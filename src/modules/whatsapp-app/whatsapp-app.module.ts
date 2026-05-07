import { Module } from '@nestjs/common';
import { WhatsAppAppService } from './whatsapp-app.service';
import { WhatsAppAppController } from './whatsapp-app.controller';

@Module({
  providers: [WhatsAppAppService],
  controllers: [WhatsAppAppController],
  exports: [WhatsAppAppService],
})
export class WhatsAppAppModule {}
