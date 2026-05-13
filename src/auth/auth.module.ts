import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { ClerkAuthGuard } from "./clerk-auth.guard";
import { RolesGuard } from "./roles.guard";

@Module({
  imports: [PrismaModule],
  providers: [ClerkAuthGuard, RolesGuard],
  exports: [ClerkAuthGuard, RolesGuard],
})
export class AuthModule {}
