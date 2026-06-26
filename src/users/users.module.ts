import { forwardRef, Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { ClerkWebhookService } from "./clerk-webhook.service";
import { UsersController } from "./users.controller";
import { UsersRepository } from "./users.repository";
import { UsersService } from "./users.service";

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, ClerkWebhookService],
  exports: [UsersRepository, UsersService],
})
export class UsersModule {}
