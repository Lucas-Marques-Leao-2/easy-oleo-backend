import {
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";

import { AuthContextService } from "../../src/auth/auth-context.service";
import { UsersRepository } from "../../src/users/users.repository";

describe("AuthContextService", () => {
  let usersRepository: jest.Mocked<Pick<UsersRepository, "findByExternalId">>;
  let service: AuthContextService;

  beforeEach(() => {
    usersRepository = { findByExternalId: jest.fn() };
    service = new AuthContextService(
      usersRepository as unknown as UsersRepository,
    );
  });

  it("returns the role when the external user exists", async () => {
    usersRepository.findByExternalId.mockResolvedValue({
      role: UserRole.ADMIN,
    } as never);

    await expect(service.resolveRoleByExternalId("clerk_1")).resolves.toBe(
      UserRole.ADMIN,
    );
    expect(usersRepository.findByExternalId).toHaveBeenCalledWith("clerk_1");
  });

  it("throws UnauthorizedException when the user is missing", async () => {
    usersRepository.findByExternalId.mockResolvedValue(null);

    await expect(service.resolveRoleByExternalId("clerk_x")).rejects.toThrow(
      new UnauthorizedException("Usuário não encontrado."),
    );
  });

  it("wraps unexpected repository errors", async () => {
    usersRepository.findByExternalId.mockRejectedValue(new Error("db down"));

    await expect(service.resolveRoleByExternalId("clerk_1")).rejects.toThrow(
      new InternalServerErrorException("Erro ao verificar permissões."),
    );
  });
});
