import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Query,
  Res,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExcludeEndpoint,
} from "@nestjs/swagger";
import type { Response } from "express";
import { WhatsAppAppService } from "./whatsapp-app.service";
import { StoreContactsDto } from "./dto/store-contacts.dto";
import { SendMessageDto } from "./dto/send-message.dto";
import { Public } from "../../common/decorators";
import { renderDashboard } from "./whatsapp-dashboard.renderer";

@ApiTags("WhatsApp")
@Controller("whatsapp")
@Public()
export class WhatsAppAppController {
  constructor(private readonly whatsAppAppService: WhatsAppAppService) {}

  @Post("contacts")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Store WhatsApp contacts (phone numbers)" })
  @ApiResponse({ status: 201, description: "Contacts stored successfully" })
  @ApiResponse({ status: 400, description: "Validation error" })
  async storeContacts(@Body() dto: StoreContactsDto) {
    return this.whatsAppAppService.storeContacts(dto);
  }

  @Get("contacts")
  @ApiOperation({ summary: "List all active WhatsApp contacts" })
  @ApiResponse({ status: 200, description: "Contacts retrieved" })
  async getContacts() {
    return this.whatsAppAppService.getContacts();
  }

  @Post("send")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Send a message to all stored contacts" })
  @ApiResponse({ status: 200, description: "Message dispatch results" })
  @ApiResponse({ status: 400, description: "No contacts or missing config" })
  async sendMessage(@Body() dto: SendMessageDto) {
    return this.whatsAppAppService.sendMessage(dto);
  }

  @Get("dashboard")
  @ApiExcludeEndpoint()
  async dashboard(
    @Query("status") status: string | undefined,
    @Query("page") page: string | undefined,
    @Res() res: Response,
  ) {
    const currentStatus = status ?? "";
    const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);

    const data = await this.whatsAppAppService.getDashboardData({
      status: currentStatus || undefined,
      page: currentPage,
      limit: 20,
    });

    const html = renderDashboard(data, currentStatus);
    res.type("html").send(html);
  }
}
