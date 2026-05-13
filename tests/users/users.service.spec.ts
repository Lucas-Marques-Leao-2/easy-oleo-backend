import * as bcrypt from "bcryptjs";
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { WebhookEvent } from "@clerk/express";
import { Webhook } from "svix";

import { UsersRepository } from "../../src/users/users.repository";
import { UsersService } from "../../src/users/users.service";

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
      | "findByExternalId"
      | "update"
      | "remove"
      | "upsertFromClerk"
    >
  >;
  let config: { getOrThrow: jest.Mock };
  let service: UsersService;

  beforeEach(() => {
    jest.spyOn(bcrypt, "hash").mockResolvedValue("hashed-password" as never);
    config = {
      getOrThrow: jest.fn().mockImplementation((k: string) => {
        if (k === "CLERK_WEBHOOK_SECRET") return "whsec_test";
        throw new Error(`unexpected ${k}`);
      }),
    };
    repo = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCpf: jest.fn(),
      findByEmail: jest.fn(),
      findByExternalId: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      upsertFromClerk: jest.fn(),
    };
    service = new UsersService(
      repo as unknown as UsersRepository,
      config as unknown as ConfigService,
    );
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
});

describe("UsersService.processClerkWebhook", () => {
  let verifyMock: jest.SpyInstance;
  let repo: jest.Mocked<
    Pick<UsersRepository, "findByExternalId" | "upsertFromClerk">
  >;
  let config: { getOrThrow: jest.Mock };
  let service: UsersService;

  beforeEach(() => {
    verifyMock = jest.spyOn(Webhook.prototype, "verify").mockReturnValue({
      type: "user.created",
      data: {
        id: "user_clerk_1",
        email_addresses: [{ id: "ea1", email_address: "c@example.com" }],
        primary_email_address_id: "ea1",
        first_name: "Pat",
        last_name: "Lee",
      },
    } as WebhookEvent);
    jest
      .spyOn(bcrypt, "hash")
      .mockResolvedValue("clerk-provision-hash" as never);
    config = {
      getOrThrow: jest.fn().mockReturnValue("whsec_test"),
    };
    repo = {
      findByExternalId: jest.fn(),
      upsertFromClerk: jest.fn(),
    };
    service = new UsersService(
      repo as unknown as UsersRepository,
      config as unknown as ConfigService,
    );
  });

  afterEach(() => {
    verifyMock.mockRestore();
    jest.restoreAllMocks();
  });

  it("throws when Svix verification fails", async () => {
    verifyMock.mockImplementation(() => {
      throw new Error("bad sig");
    });
    await expect(
      service.processClerkWebhook({}, "id", "ts", "sig"),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("upserts with create profile when user does not exist yet", async () => {
    repo.findByExternalId.mockResolvedValue(null);
    repo.upsertFromClerk.mockResolvedValue(
      user({
        externalId: "user_clerk_1",
        email: "c@example.com",
        name: "Pat Lee",
      }) as never,
    );
    await service.processClerkWebhook({ x: 1 }, "id", "ts", "sig");
    expect(repo.upsertFromClerk).toHaveBeenCalledWith(
      expect.objectContaining({
        externalId: "user_clerk_1",
        email: "c@example.com",
        name: "Pat Lee",
        createProfile: expect.objectContaining({
          role: "ATTENDANT",
          passwordHash: "clerk-provision-hash",
        }),
      }),
    );
  });

  it("updates without create profile when user already exists", async () => {
    verifyMock.mockReturnValue({
      type: "user.updated",
      data: {
        id: "user_clerk_1",
        email_addresses: [{ id: "ea1", email_address: "new@example.com" }],
        primary_email_address_id: "ea1",
        first_name: "Pat",
        last_name: "Lee",
      },
    } as WebhookEvent);
    repo.findByExternalId.mockResolvedValue(
      user({ externalId: "user_clerk_1" }) as never,
    );
    repo.upsertFromClerk.mockResolvedValue(user() as never);
    await service.processClerkWebhook({ x: 1 }, "id", "ts", "sig");
    expect(repo.upsertFromClerk).toHaveBeenCalledWith({
      externalId: "user_clerk_1",
      email: "new@example.com",
      name: "Pat Lee",
      createProfile: undefined,
    });
  });

  it("throws InternalServerErrorException when upsert fails", async () => {
    repo.findByExternalId.mockResolvedValue(null);
    repo.upsertFromClerk.mockRejectedValue(new Error("db"));
    await expect(
      service.processClerkWebhook({ x: 1 }, "id", "ts", "sig"),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
