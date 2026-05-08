import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database";
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";
import { WhatsAppAppService } from "./whatsapp-app.service";
import { WhatsAppAppController } from "./whatsapp-app.controller";

@Module({
  imports: [DatabaseModule, AuthModule, UsersModule],
  providers: [WhatsAppAppService],
  controllers: [WhatsAppAppController],
  exports: [WhatsAppAppService],
})
export class WhatsAppAppModule {}
