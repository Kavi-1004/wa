import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database";
import { AuthModule } from "../auth/auth.module";
import { WhatsAppAppService } from "./whatsapp-app.service";
import { WhatsAppAppController } from "./whatsapp-app.controller";

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [WhatsAppAppService],
  controllers: [WhatsAppAppController],
  exports: [WhatsAppAppService],
})
export class WhatsAppAppModule {}
