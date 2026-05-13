import {
  type ExecutionContext,
  UnauthorizedException,
  createParamDecorator,
} from "@nestjs/common";

export type ClerkAuthUser = { userId: string };

export const ClerkUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): ClerkAuthUser => {
    const request = ctx.switchToHttp().getRequest();
    const clerkAuth = request.clerkAuth;
    if (!clerkAuth?.userId) {
      throw new UnauthorizedException();
    }
    return clerkAuth;
  },
);
