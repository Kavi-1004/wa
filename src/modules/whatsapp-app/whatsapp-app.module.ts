import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database";
import { WhatsAppAppService } from "./whatsapp-app.service";
import { WhatsAppAppController } from "./whatsapp-app.controller";

@Module({
  imports: [DatabaseModule],
  providers: [WhatsAppAppService],
  controllers: [WhatsAppAppController],
  exports: [WhatsAppAppService],
})
export class WhatsAppAppModule {}
