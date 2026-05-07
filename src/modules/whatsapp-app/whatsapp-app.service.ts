import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma.service";
import { StoreContactsDto } from "./dto/store-contacts.dto";
import { SendMessageDto } from "./dto/send-message.dto";

interface WhatsAppApiResponse {
  messages?: { id: string }[];
  error?: { message: string; type: string; code: number };
}

export interface SendResult {
  phoneNumber: string;
  name: string | null;
  status: "sent" | "failed";
  waMessageId?: string;
  error?: string;
}

@Injectable()
export class WhatsAppAppService {
  private readonly logger = new Logger(WhatsAppAppService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async storeContacts(dto: StoreContactsDto) {
    const results = await Promise.all(
      dto.contacts.map(async (contact) => {
        const phoneNumber = contact.phoneNumber.replace(/\+/g, "");

        const upserted = await this.prisma.whatsAppContact.upsert({
          where: { phoneNumber },
          update: {
            name: contact.name ?? undefined,
            isActive: true,
          },
          create: {
            phoneNumber,
            name: contact.name,
          },
        });

        this.logger.log(
          `Contact stored: ${phoneNumber} (${contact.name ?? "no name"})`,
        );
        return upserted;
      }),
    );

    return {
      stored: results.length,
      contacts: results.map((c) => ({
        id: c.id,
        phoneNumber: c.phoneNumber,
        name: c.name,
      })),
    };
  }

  async getContacts() {
    const contacts = await this.prisma.whatsAppContact.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return {
      total: contacts.length,
      contacts: contacts.map((c) => ({
        id: c.id,
        phoneNumber: c.phoneNumber,
        name: c.name,
        createdAt: c.createdAt,
      })),
    };
  }

  async sendMessage(dto: SendMessageDto) {
    const apiToken = this.configService.get<string>("whatsapp.apiToken");
    const phoneNumberId = this.configService.get<string>(
      "whatsapp.phoneNumberId",
    );
    const apiUrl = this.configService.get<string>("whatsapp.apiUrl");

    if (!apiToken || !phoneNumberId) {
      this.logger.error(
        "WhatsApp configuration missing: WHATSAPP_API_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set",
      );
      throw new BadRequestException(
        "WhatsApp is not configured. Set WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID in your environment.",
      );
    }

    const contacts = await this.prisma.whatsAppContact.findMany({
      where: { isActive: true },
    });

    if (contacts.length === 0) {
      throw new BadRequestException(
        "No active contacts found. Store contacts first before sending messages.",
      );
    }

    this.logger.log(
      `Sending message to ${contacts.length} contact(s): "${dto.message}"`,
    );

    const results: SendResult[] = [];

    for (const contact of contacts) {
      const result = await this.sendToContact(
        contact.id,
        contact.phoneNumber,
        contact.name,
        dto,
        `${apiUrl}/${phoneNumberId}/messages`,
        apiToken,
      );
      results.push(result);
    }

    const sent = results.filter((r) => r.status === "sent").length;
    const failed = results.filter((r) => r.status === "failed").length;

    this.logger.log(
      `Message dispatch complete — sent: ${sent}, failed: ${failed}`,
    );

    if (failed > 0) {
      const failedDetails = results
        .filter((r) => r.status === "failed")
        .map((r) => `${r.phoneNumber}: ${r.error}`);
      this.logger.warn(`Failed deliveries:\n${failedDetails.join("\n")}`);
    }

    return { sent, failed, total: contacts.length, results };
  }

  private async sendToContact(
    contactId: string,
    phoneNumber: string,
    name: string | null,
    dto: SendMessageDto,
    url: string,
    apiToken: string,
  ): Promise<SendResult> {
    const payload = dto.templateName
      ? {
          messaging_product: "whatsapp",
          to: phoneNumber,
          type: "template",
          template: {
            name: dto.templateName,
            language: { code: "en" },
          },
        }
      : {
          messaging_product: "whatsapp",
          to: phoneNumber,
          type: "text",
          text: { body: dto.message },
        };

    try {
      this.logger.log(`Sending to ${phoneNumber} (${name ?? "unknown"})…`);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as WhatsAppApiResponse;

      if (!response.ok) {
        const errorMsg = data.error?.message ?? `HTTP ${response.status}`;
        this.logger.error(
          `Failed to send to ${phoneNumber} — status: ${response.status}, error: ${errorMsg}`,
        );
        this.logger.error(
          `Full API response for ${phoneNumber}: ${JSON.stringify(data)}`,
        );

        await this.logMessage(contactId, phoneNumber, dto.message, {
          status: "failed",
          errorDetail: errorMsg,
        });

        return { phoneNumber, name, status: "failed", error: errorMsg };
      }

      const waMessageId = data.messages?.[0]?.id ?? null;
      this.logger.log(
        `Message sent to ${phoneNumber} — waMessageId: ${waMessageId ?? "n/a"}`,
      );

      await this.logMessage(contactId, phoneNumber, dto.message, {
        status: "sent",
        waMessageId: waMessageId ?? undefined,
      });

      return {
        phoneNumber,
        name,
        status: "sent",
        waMessageId: waMessageId ?? undefined,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Exception sending to ${phoneNumber}: ${errorMsg}`);

      await this.logMessage(contactId, phoneNumber, dto.message, {
        status: "failed",
        errorDetail: errorMsg,
      });

      return { phoneNumber, name, status: "failed", error: errorMsg };
    }
  }

  async getDashboardData(filters: {
    status?: string;
    page: number;
    limit: number;
  }) {
    const where = filters.status ? { status: filters.status } : {};

    const [logs, totalLogs, stats] = await Promise.all([
      this.prisma.whatsAppMessageLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        include: { contact: { select: { name: true } } },
      }),
      this.prisma.whatsAppMessageLog.count({ where }),
      this.prisma.whatsAppMessageLog.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
    ]);

    const totalContacts = await this.prisma.whatsAppContact.count({
      where: { isActive: true },
    });

    const statsMap: Record<string, number> = {};
    for (const s of stats) {
      statsMap[s.status] = s._count.id;
    }

    return {
      logs,
      totalLogs,
      totalPages: Math.ceil(totalLogs / filters.limit),
      currentPage: filters.page,
      stats: {
        totalMessages: totalLogs,
        sent: statsMap["sent"] ?? 0,
        failed: statsMap["failed"] ?? 0,
        pending: statsMap["pending"] ?? 0,
        totalContacts,
      },
    };
  }

  private async logMessage(
    contactId: string,
    phoneNumber: string,
    message: string,
    outcome: {
      status: string;
      waMessageId?: string;
      errorDetail?: string;
    },
  ) {
    try {
      await this.prisma.whatsAppMessageLog.create({
        data: {
          contactId,
          phoneNumber,
          message,
          status: outcome.status,
          waMessageId: outcome.waMessageId,
          errorDetail: outcome.errorDetail,
          sentAt: outcome.status === "sent" ? new Date() : null,
        },
      });
    } catch (logError) {
      this.logger.error(
        `Failed to persist message log for ${phoneNumber}: ${
          logError instanceof Error ? logError.message : "Unknown error"
        }`,
      );
    }
  }
}
