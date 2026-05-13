jest.mock("@clerk/express", () => ({
  getAuth: jest.fn(),
}));

import { UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@prisma/client";
import { getAuth } from "@clerk/express";

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
    const prisma = { user: { findUnique: jest.fn() } };
    const guard = new RolesGuard(reflector, prisma as never);
    expect(await guard.canActivate(ctx({}) as never)).toBe(true);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns true when user role matches one of required roles", async () => {
    const reflector = {
      getAllAndOverride: jest.fn((key: string) =>
        key === ROLES_KEY ? [UserRole.ADMIN] : undefined,
      ),
    } as unknown as Reflector;
    getAuthMock.mockReturnValue({ userId: "clerk_1" } as never);
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: "u1",
          role: UserRole.ADMIN,
        }),
      },
    };
    const guard = new RolesGuard(reflector, prisma as never);
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
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const guard = new RolesGuard(reflector, prisma as never);
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
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: "u1",
          role: UserRole.SELLER,
        }),
      },
    };
    const guard = new RolesGuard(reflector, prisma as never);
    const request: Record<string, unknown> = {};
    expect(await guard.canActivate(ctx(request) as never)).toBe(false);
  });
});
