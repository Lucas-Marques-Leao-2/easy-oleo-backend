jest.mock("@clerk/express", () => ({
  getAuth: jest.fn(),
}));

import { UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@prisma/client";
import { getAuth } from "@clerk/express";

import { AuthContextService } from "../../src/auth/auth-context.service";
import { ROLES_KEY } from "../../src/auth/roles.decorator";
import { RolesGuard } from "../../src/auth/roles.guard";

describe("RolesGuard", () => {
  const getAuthMock = jest.mocked(getAuth);

  function ctx(request: Record<string, unknown>) {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("allows when no roles metadata is set", async () => {
    const reflector = {
      getAllAndOverride: jest.fn(() => undefined),
    } as unknown as Reflector;
    const authContext = {
      resolveRoleByExternalId: jest.fn(),
    } as unknown as AuthContextService;
    const guard = new RolesGuard(reflector, authContext);
    expect(await guard.canActivate(ctx({}) as never)).toBe(true);
    expect(authContext.resolveRoleByExternalId).not.toHaveBeenCalled();
  });

  it("returns true when user role matches one of required roles", async () => {
    const reflector = {
      getAllAndOverride: jest.fn((key: string) =>
        key === ROLES_KEY ? [UserRole.ADMIN] : undefined,
      ),
    } as unknown as Reflector;
    getAuthMock.mockReturnValue({ userId: "clerk_1" } as never);
    const authContext = {
      resolveRoleByExternalId: jest.fn().mockResolvedValue(UserRole.ADMIN),
    } as unknown as AuthContextService;
    const guard = new RolesGuard(reflector, authContext);
    const request: Record<string, unknown> = {};
    expect(await guard.canActivate(ctx(request) as never)).toBe(true);
    expect(request.role).toBe(UserRole.ADMIN);
  });

  it("throws when user is missing in database", async () => {
    const reflector = {
      getAllAndOverride: jest.fn((key: string) =>
        key === ROLES_KEY ? [UserRole.ADMIN] : undefined,
      ),
    } as unknown as Reflector;
    getAuthMock.mockReturnValue({ userId: "clerk_x" } as never);
    const authContext = {
      resolveRoleByExternalId: jest
        .fn()
        .mockRejectedValue(
          new UnauthorizedException("Usuário não encontrado."),
        ),
    } as unknown as AuthContextService;
    const guard = new RolesGuard(reflector, authContext);
    await expect(guard.canActivate(ctx({}) as never)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("returns false when user role is not allowed", async () => {
    const reflector = {
      getAllAndOverride: jest.fn((key: string) =>
        key === ROLES_KEY ? [UserRole.ADMIN] : undefined,
      ),
    } as unknown as Reflector;
    getAuthMock.mockReturnValue({ userId: "clerk_1" } as never);
    const authContext = {
      resolveRoleByExternalId: jest.fn().mockResolvedValue(UserRole.SELLER),
    } as unknown as AuthContextService;
    const guard = new RolesGuard(reflector, authContext);
    const request: Record<string, unknown> = {};
    expect(await guard.canActivate(ctx(request) as never)).toBe(false);
  });
});
