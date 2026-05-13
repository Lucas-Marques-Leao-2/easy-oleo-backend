jest.mock("@clerk/express", () => ({
  getAuth: jest.fn(),
}));

import { UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { getAuth } from "@clerk/express";

import { ClerkAuthGuard } from "../../src/auth/clerk-auth.guard";
import { IS_PUBLIC_KEY } from "../../src/auth/public.decorator";

describe("ClerkAuthGuard", () => {
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

  it("allows the request when @Public metadata is set", () => {
    const reflector = {
      getAllAndOverride: jest.fn((key: string) =>
        key === IS_PUBLIC_KEY ? true : undefined,
      ),
    } as unknown as Reflector;
    const guard = new ClerkAuthGuard(reflector);
    const request = {};
    expect(guard.canActivate(ctx(request) as never)).toBe(true);
    expect(getAuthMock).not.toHaveBeenCalled();
  });

  it("sets clerkAuth when getAuth returns userId", () => {
    const reflector = {
      getAllAndOverride: jest.fn(() => false),
    } as unknown as Reflector;
    getAuthMock.mockReturnValue({ userId: "user_abc" } as never);
    const guard = new ClerkAuthGuard(reflector);
    const request: Record<string, unknown> = {};
    expect(guard.canActivate(ctx(request) as never)).toBe(true);
    expect(request.clerkAuth).toEqual({ userId: "user_abc" });
  });

  it("throws when not public and there is no userId", () => {
    const reflector = {
      getAllAndOverride: jest.fn(() => false),
    } as unknown as Reflector;
    getAuthMock.mockReturnValue({ userId: null } as never);
    const guard = new ClerkAuthGuard(reflector);
    expect(() => guard.canActivate(ctx({}) as never)).toThrow(
      UnauthorizedException,
    );
  });
});
