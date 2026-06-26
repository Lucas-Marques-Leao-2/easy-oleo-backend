import * as bcrypt from "bcryptjs";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { UserRole } from "@prisma/client";

import { UsersRepository } from "../../src/users/users.repository";
import { UsersService } from "../../src/users/users.service";
import { uniquePrismaError } from "../lib/prisma-errors";

const now = new Date("2026-04-20T10:00:00.000Z");

function user(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    externalId: null,
    name: "Carla Administradora",
    cpf: "52998224725",
    street: "Rua Principal",
    number: "100",
    complement: null,
    district: null,
    city: "Maceió",
    state: "AL",
    zipCode: "57020000",
    email: "carla@easyoleo.local",
    passwordHash: "stored-hash",
    role: "ATTENDANT",
    phones: [{ id: "phone-1", number: "82991112233", userId: "user-1" }],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("UsersService", () => {
  let repo: jest.Mocked<
    Pick<
      UsersRepository,
      | "create"
      | "findAll"
      | "findById"
      | "findByCpf"
      | "findByEmail"
      | "update"
      | "remove"
    >
  >;
  let service: UsersService;

  beforeEach(() => {
    jest.spyOn(bcrypt, "hash").mockResolvedValue("hashed-password" as never);
    repo = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCpf: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    service = new UsersService(repo as unknown as UsersRepository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("creates a user with internal password hash and without returning passwordHash", async () => {
    const dto = {
      name: "Carla Administradora",
      cpf: "52998224725",
      street: "Rua Principal",
      number: "100",
      city: "Maceió",
      state: "AL",
      zipCode: "57020000",
      email: "carla@easyoleo.local",
      phones: ["82991112233"],
    };
    repo.findByCpf.mockResolvedValue(null);
    repo.findByEmail.mockResolvedValue(null);
    repo.create.mockResolvedValue(user() as never);

    const result = await service.create(dto);

    expect(bcrypt.hash).toHaveBeenCalledWith(expect.any(String), 10);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        passwordHash: "hashed-password",
        role: "ATTENDANT",
      }),
      ["82991112233"],
    );
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("creates a user with an explicit role", async () => {
    const dto = {
      name: "Admin",
      cpf: "52998224725",
      street: "Rua Principal",
      number: "100",
      city: "Maceió",
      state: "AL",
      zipCode: "57020000",
      email: "admin@easyoleo.local",
      role: UserRole.ADMIN,
    };
    repo.findByCpf.mockResolvedValue(null);
    repo.findByEmail.mockResolvedValue(null);
    repo.create.mockResolvedValue(user({ role: UserRole.ADMIN }) as never);

    await expect(service.create(dto)).resolves.toMatchObject({
      role: UserRole.ADMIN,
    });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: UserRole.ADMIN }),
      undefined,
    );
  });

  it("rejects duplicate CPF and duplicate email", async () => {
    repo.findByCpf.mockResolvedValueOnce(user() as never);
    await expect(
      service.create({ cpf: "52998224725" } as never),
    ).rejects.toBeInstanceOf(ConflictException);

    repo.findByCpf.mockResolvedValueOnce(null);
    repo.findByEmail.mockResolvedValueOnce(user() as never);
    await expect(
      service.create({
        cpf: "52998224725",
        email: "used@example.com",
      } as never),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("updates only provided fields", async () => {
    repo.findById.mockResolvedValue(user() as never);
    repo.findByEmail.mockResolvedValue(user() as never);
    repo.update.mockResolvedValue(
      user({ email: "carla.nova@sistema.req" }) as never,
    );

    await expect(
      service.update("user-1", {
        email: "carla.nova@sistema.req",
        phones: ["82991112233"],
      }),
    ).resolves.toMatchObject({ email: "carla.nova@sistema.req" });
    expect(repo.update).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        email: "carla.nova@sistema.req",
      }),
      ["82991112233"],
    );
  });

  it("covers read/remove and not found paths", async () => {
    repo.findAll.mockResolvedValue([user()] as never);
    repo.findById.mockResolvedValueOnce(user() as never);
    repo.findById.mockResolvedValueOnce(user() as never);
    repo.remove.mockResolvedValue(user() as never);

    await expect(service.findAll()).resolves.toHaveLength(1);
    await expect(service.findOne("user-1")).resolves.toMatchObject({
      id: "user-1",
    });
    await expect(service.remove("user-1")).resolves.toMatchObject({
      id: "user-1",
    });

    repo.findById.mockResolvedValue(null);
    await expect(service.findOne("missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("rejects duplicate email on update", async () => {
    repo.findById.mockResolvedValue(user() as never);
    repo.findByEmail.mockResolvedValue(
      user({ id: "other-user", email: "used@example.com" }) as never,
    );

    await expect(
      service.update("user-1", { email: "used@example.com" }),
    ).rejects.toThrow(new ConflictException("Este e-mail já está em uso."));
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("maps Prisma unique violations to ConflictException", async () => {
    repo.findByCpf.mockResolvedValue(null);
    repo.findByEmail.mockResolvedValue(null);
    repo.create.mockRejectedValue(uniquePrismaError("cpf"));

    await expect(
      service.create({
        cpf: "52998224725",
        email: "carla@easyoleo.local",
      } as never),
    ).rejects.toThrow(new ConflictException("Este CPF já está cadastrado."));

    repo.findById.mockResolvedValue(user() as never);
    repo.update.mockRejectedValue(uniquePrismaError("email"));

    await expect(
      service.update("user-1", { email: "duplicado@example.com" }),
    ).rejects.toThrow(new ConflictException("Este e-mail já está em uso."));
  });

  it("rethrows non-unique repository errors", async () => {
    repo.findByCpf.mockResolvedValue(null);
    repo.findByEmail.mockResolvedValue(null);
    repo.create.mockRejectedValue(new Error("db failure"));

    await expect(
      service.create({
        cpf: "52998224725",
        email: "carla@easyoleo.local",
      } as never),
    ).rejects.toThrow("db failure");

    repo.findById.mockResolvedValue(user() as never);
    repo.update.mockRejectedValue(new Error("update failed"));

    await expect(service.update("user-1", { name: "Novo" })).rejects.toThrow(
      "update failed",
    );
  });

  it("throws when removing a missing user", async () => {
    repo.findById.mockResolvedValue(null);

    await expect(service.remove("missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
