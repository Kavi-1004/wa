import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma.service";
import { StoreContactsDto } from "./dto/store-contacts.dto";
import { SendMessageDto } from "./dto/send-message.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";
import { SendIndividualMessageDto } from "./dto/send-individual-message.dto";
import { SendBulkMessageDto } from "./dto/send-bulk-message.dto";

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

  // ─── Contact CRUD ─────────────────────────────────────────────────────────────

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

  async getContacts(filters?: { page?: number; limit?: number }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;

    const [contacts, total] = await Promise.all([
      this.prisma.whatsAppContact.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.whatsAppContact.count({ where: { isActive: true } }),
    ]);

    return {
      total,
      page,
      totalPages: Math.ceil(total / limit),
      contacts: contacts.map((c) => ({
        id: c.id,
        phoneNumber: c.phoneNumber,
        name: c.name,
        isActive: c.isActive,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    };
  }

  async getContactById(id: string) {
    const contact = await this.prisma.whatsAppContact.findUnique({
      where: { id },
    });

    if (!contact) {
      throw new NotFoundException(`Contact with id "${id}" not found`);
    }

    return {
      id: contact.id,
      phoneNumber: contact.phoneNumber,
      name: contact.name,
      isActive: contact.isActive,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    };
  }

  async updateContact(id: string, dto: UpdateContactDto) {
    const existing = await this.prisma.whatsAppContact.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Contact with id "${id}" not found`);
    }

    const data: Record<string, unknown> = {};
    if (dto.phoneNumber !== undefined) {
      data.phoneNumber = dto.phoneNumber.replace(/\+/g, "");
    }
    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    const updated = await this.prisma.whatsAppContact.update({
      where: { id },
      data,
    });

    this.logger.log(`Contact updated: ${updated.phoneNumber}`);

    return {
      id: updated.id,
      phoneNumber: updated.phoneNumber,
      name: updated.name,
      isActive: updated.isActive,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async deleteContact(id: string) {
    const existing = await this.prisma.whatsAppContact.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Contact with id "${id}" not found`);
    }

    await this.prisma.whatsAppContact.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log(`Contact deactivated: ${existing.phoneNumber}`);

    return { message: "Contact deactivated successfully" };
  }

  // ─── Messaging ────────────────────────────────────────────────────────────────

  private getWhatsAppConfig() {
    const apiToken = this.configService.get<string>("whatsapp.apiToken");
    const phoneNumberId = this.configService.get<string>(
      "whatsapp.phoneNumberId",
    );
    const apiUrl = this.configService.get<string>("whatsapp.apiUrl");
    const templateName = this.configService.get<string>(
      "whatsapp.templateName",
    );

    if (!apiToken || !phoneNumberId) {
      this.logger.error(
        "WhatsApp configuration missing: WHATSAPP_API_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set",
      );
      throw new BadRequestException(
        "WhatsApp is not configured. Set WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID in your environment.",
      );
    }

    return {
      apiToken,
      phoneNumberId,
      apiUrl: apiUrl || "https://graph.facebook.com/v25.0",
      templateName: templateName || "",
    };
  }

  async sendMessage(dto: SendMessageDto) {
    const config = this.getWhatsAppConfig();

    const contacts = await this.prisma.whatsAppContact.findMany({
      where: { isActive: true },
    });

    if (contacts.length === 0) {
      throw new BadRequestException(
        "No active contacts found. Store contacts first before sending messages.",
      );
    }

    const effectiveTemplateName = dto.templateName || config.templateName;

    this.logger.log(
      `Sending message to ${contacts.length} contact(s): "${dto.message}"`,
    );

    const results: SendResult[] = [];

    for (const contact of contacts) {
      const result = await this.sendToContact(
        contact.id,
        contact.phoneNumber,
        contact.name,
        dto.message,
        effectiveTemplateName,
        `${config.apiUrl}/${config.phoneNumberId}/messages`,
        config.apiToken,
      );
      results.push(result);
    }

    return this.buildSendResponse(results, contacts.length);
  }

  async sendMessageToContact(contactId: string, dto: SendIndividualMessageDto) {
    const config = this.getWhatsAppConfig();

    const contact = await this.prisma.whatsAppContact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      throw new NotFoundException(`Contact with id "${contactId}" not found`);
    }

    if (!contact.isActive) {
      throw new BadRequestException(
        `Contact "${contact.phoneNumber}" is not active`,
      );
    }

    const effectiveTemplateName = dto.templateName || config.templateName;

    this.logger.log(
      `Sending message to ${contact.phoneNumber}: "${dto.message}"`,
    );

    const result = await this.sendToContact(
      contact.id,
      contact.phoneNumber,
      contact.name,
      dto.message,
      effectiveTemplateName,
      `${config.apiUrl}/${config.phoneNumberId}/messages`,
      config.apiToken,
    );

    return {
      total: 1,
      sent: result.status === "sent" ? 1 : 0,
      failed: result.status === "failed" ? 1 : 0,
      results: [result],
    };
  }

  async sendMessageToSelected(dto: SendBulkMessageDto) {
    const config = this.getWhatsAppConfig();

    const contacts = await this.prisma.whatsAppContact.findMany({
      where: { id: { in: dto.contactIds }, isActive: true },
    });

    if (contacts.length === 0) {
      throw new BadRequestException(
        "No active contacts found for the given IDs.",
      );
    }

    const effectiveTemplateName = dto.templateName || config.templateName;

    this.logger.log(
      `Sending message to ${contacts.length} selected contact(s): "${dto.message}"`,
    );

    const results: SendResult[] = [];

    for (const contact of contacts) {
      const result = await this.sendToContact(
        contact.id,
        contact.phoneNumber,
        contact.name,
        dto.message,
        effectiveTemplateName,
        `${config.apiUrl}/${config.phoneNumberId}/messages`,
        config.apiToken,
      );
      results.push(result);
    }

    return this.buildSendResponse(results, contacts.length);
  }

  private async sendToContact(
    contactId: string,
    phoneNumber: string,
    name: string | null,
    message: string,
    templateName: string | undefined,
    url: string,
    apiToken: string,
  ): Promise<SendResult> {
    const payload = templateName
      ? {
          messaging_product: "whatsapp",
          to: phoneNumber,
          type: "template",
          template: {
            name: templateName,
            language: { code: "en" },
          },
        }
      : {
          messaging_product: "whatsapp",
          to: phoneNumber,
          type: "text",
          text: { body: message },
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

        await this.logMessage(contactId, phoneNumber, message, {
          status: "failed",
          errorDetail: errorMsg,
        });

        return { phoneNumber, name, status: "failed", error: errorMsg };
      }

      const waMessageId = data.messages?.[0]?.id ?? null;
      this.logger.log(
        `Message sent to ${phoneNumber} — waMessageId: ${waMessageId ?? "n/a"}`,
      );

      await this.logMessage(contactId, phoneNumber, message, {
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

      await this.logMessage(contactId, phoneNumber, message, {
        status: "failed",
        errorDetail: errorMsg,
      });

      return { phoneNumber, name, status: "failed", error: errorMsg };
    }
  }

  private buildSendResponse(results: SendResult[], total: number) {
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

    return { sent, failed, total, results };
  }

  // ─── Dashboard & Logs ─────────────────────────────────────────────────────────

  async getMessageLogs(filters: {
    status?: string;
    page: number;
    limit: number;
  }) {
    const where = filters.status ? { status: filters.status } : {};

    const [logs, totalLogs] = await Promise.all([
      this.prisma.whatsAppMessageLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        include: { contact: { select: { name: true } } },
      }),
      this.prisma.whatsAppMessageLog.count({ where }),
    ]);

    return {
      logs: logs.map((log) => ({
        id: log.id,
        contactId: log.contactId,
        phoneNumber: log.phoneNumber,
        message: log.message,
        status: log.status,
        waMessageId: log.waMessageId,
        errorDetail: log.errorDetail,
        sentAt: log.sentAt,
        createdAt: log.createdAt,
        contactName: log.contact?.name ?? null,
      })),
      total: totalLogs,
      page: filters.page,
      totalPages: Math.ceil(totalLogs / filters.limit),
    };
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

  async getDashboardContacts() {
    const contacts = await this.prisma.whatsAppContact.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { messageLogs: true } },
      },
    });

    return contacts.map((c) => ({
      id: c.id,
      phoneNumber: c.phoneNumber,
      name: c.name,
      isActive: c.isActive,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messageCount: c._count.messageLogs,
    }));
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
