import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { WhatsAppAppService } from './whatsapp-app.service';
import { Public } from '../../common/decorators';

@Controller('whatsapp-app')
@Public() // Making it public as requested for simple messaging app
export class WhatsAppAppController {
  constructor(private readonly whatsAppAppService: WhatsAppAppService) {}

  @Get('send')
  async sendMessageGet(@Query('to') to?: string) {
    return this.whatsAppAppService.sendTemplateMessage(to);
  }

  @Post('send')
  async sendMessage(@Body('to') to?: string) {
    return this.whatsAppAppService.sendTemplateMessage(to);
  }
}
