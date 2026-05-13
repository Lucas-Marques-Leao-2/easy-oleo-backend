import { getAuth } from "@clerk/express";
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { UserRole } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { ROLES_KEY } from "./roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const auth = getAuth(request);

    if (!auth?.userId) {
      throw new UnauthorizedException("Usuário não autenticado.");
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { externalId: auth.userId },
      });

      if (!user) {
        throw new UnauthorizedException("Usuário não encontrado.");
      }

      request.role = user.role;
      return requiredRoles.some((role) => role === user.role);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException("Erro ao verificar permissões.");
    }
  }
}
