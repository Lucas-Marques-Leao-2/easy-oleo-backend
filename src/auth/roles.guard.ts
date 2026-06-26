import { getAuth } from "@clerk/express";
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { UserRole } from "@prisma/client";

import { AuthContextService } from "./auth-context.service";
import { ROLES_KEY } from "./roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authContext: AuthContextService,
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

    const role = await this.authContext.resolveRoleByExternalId(auth.userId);
    request.role = role;
    return requiredRoles.some((required) => required === role);
  }
}
