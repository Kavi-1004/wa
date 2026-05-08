import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Query,
  Res,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiExcludeEndpoint,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import type { Response } from "express";
import { WhatsAppAppService } from "./whatsapp-app.service";
import { StoreContactsDto } from "./dto/store-contacts.dto";
import { SendMessageDto } from "./dto/send-message.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";
import { SendIndividualMessageDto } from "./dto/send-individual-message.dto";
import { SendBulkMessageDto } from "./dto/send-bulk-message.dto";
import { Roles } from "../../common/decorators";
import { Role } from "../../common/enums";
import { renderDashboard } from "./whatsapp-dashboard.renderer";

@ApiTags("WhatsApp")
@ApiBearerAuth()
@Controller("whatsapp")
export class WhatsAppAppController {
  constructor(private readonly whatsAppAppService: WhatsAppAppService) {}

  // ─── Contact CRUD ─────────────────────────────────────────────────────────────

  @Post("contacts")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Store WhatsApp contacts in bulk" })
  @ApiResponse({ status: 201, description: "Contacts stored successfully" })
  @ApiResponse({ status: 400, description: "Validation error" })
  async storeContacts(@Body() dto: StoreContactsDto) {
    return this.whatsAppAppService.storeContacts(dto);
  }

  @Get("contacts")
  @ApiOperation({ summary: "List all active WhatsApp contacts" })
  @ApiResponse({ status: 200, description: "Contacts retrieved" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getContacts(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.whatsAppAppService.getContacts({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get("contacts/:id")
  @ApiOperation({ summary: "Get a single WhatsApp contact by ID" })
  @ApiResponse({ status: 200, description: "Contact retrieved" })
  @ApiResponse({ status: 404, description: "Contact not found" })
  @ApiParam({ name: "id", description: "Contact UUID" })
  async getContactById(@Param("id") id: string) {
    return this.whatsAppAppService.getContactById(id);
  }

  @Patch("contacts/:id")
  @ApiOperation({ summary: "Update a WhatsApp contact" })
  @ApiResponse({ status: 200, description: "Contact updated" })
  @ApiResponse({ status: 404, description: "Contact not found" })
  @ApiParam({ name: "id", description: "Contact UUID" })
  async updateContact(@Param("id") id: string, @Body() dto: UpdateContactDto) {
    return this.whatsAppAppService.updateContact(id, dto);
  }

  @Delete("contacts/:id")
  @ApiOperation({ summary: "Deactivate a WhatsApp contact" })
  @ApiResponse({ status: 200, description: "Contact deactivated" })
  @ApiResponse({ status: 404, description: "Contact not found" })
  @ApiParam({ name: "id", description: "Contact UUID" })
  async deleteContact(@Param("id") id: string) {
    return this.whatsAppAppService.deleteContact(id);
  }

  // ─── Messaging ────────────────────────────────────────────────────────────────

  @Post("send")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Send a message to all active contacts" })
  @ApiResponse({ status: 200, description: "Message dispatch results" })
  @ApiResponse({ status: 400, description: "No contacts or missing config" })
  async sendMessage(@Body() dto: SendMessageDto) {
    return this.whatsAppAppService.sendMessage(dto);
  }

  @Post("send/:contactId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Send a message to a single contact" })
  @ApiResponse({ status: 200, description: "Message dispatch result" })
  @ApiResponse({ status: 404, description: "Contact not found" })
  @ApiParam({ name: "contactId", description: "Contact UUID" })
  async sendToContact(
    @Param("contactId") contactId: string,
    @Body() dto: SendIndividualMessageDto,
  ) {
    return this.whatsAppAppService.sendMessageToContact(contactId, dto);
  }

  @Post("send-bulk")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Send a message to selected contacts by IDs" })
  @ApiResponse({ status: 200, description: "Message dispatch results" })
  @ApiResponse({ status: 400, description: "No active contacts for given IDs" })
  async sendBulk(@Body() dto: SendBulkMessageDto) {
    return this.whatsAppAppService.sendMessageToSelected(dto);
  }

  // ─── Message Logs ─────────────────────────────────────────────────────────────

  @Get("logs")
  @ApiOperation({ summary: "Get message logs with pagination and filtering" })
  @ApiResponse({ status: 200, description: "Message logs retrieved" })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ["sent", "failed", "pending"],
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getMessageLogs(
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.whatsAppAppService.getMessageLogs({
      status: status || undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  // ─── Dashboard ────────────────────────────────────────────────────────────────

  @Get("dashboard")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiExcludeEndpoint()
  async dashboard(
    @Query("tab") tab: string | undefined,
    @Query("status") status: string | undefined,
    @Query("page") page: string | undefined,
    @Res() res: Response,
  ) {
    const currentTab = tab ?? "logs";
    const currentStatus = status ?? "";
    const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);

    const [dashboardData, contacts] = await Promise.all([
      this.whatsAppAppService.getDashboardData({
        status: currentStatus || undefined,
        page: currentPage,
        limit: 20,
      }),
      this.whatsAppAppService.getDashboardContacts(),
    ]);

    const html = renderDashboard(
      dashboardData,
      contacts,
      currentStatus,
      currentTab,
    );
    res.type("html").send(html);
  }
}
