import {
  type ExecutionContext,
  SetMetadata,
  createParamDecorator,
} from "@nestjs/common";
import type { UserRole } from "@prisma/client";

export const ROLES_KEY = "roles";

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const RequestUserRole = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): UserRole | undefined => {
    const request = ctx.switchToHttp().getRequest<{ role?: UserRole }>();
    return request.role;
  },
);
