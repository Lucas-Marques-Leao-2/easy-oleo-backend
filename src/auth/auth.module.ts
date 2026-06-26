import { forwardRef, Module } from "@nestjs/common";

import { UsersModule } from "../users/users.module";
import { AuthContextService } from "./auth-context.service";
import { ClerkAuthGuard } from "./clerk-auth.guard";
import { RolesGuard } from "./roles.guard";

@Module({
  imports: [forwardRef(() => UsersModule)],
  providers: [ClerkAuthGuard, RolesGuard, AuthContextService],
  exports: [ClerkAuthGuard, RolesGuard, AuthContextService],
})
export class AuthModule {}
