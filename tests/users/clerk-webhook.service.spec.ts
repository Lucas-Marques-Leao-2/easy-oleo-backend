import * as bcrypt from "bcryptjs";
import {
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { WebhookEvent } from "@clerk/express";
import { Webhook } from "svix";

import { ClerkWebhookService } from "../../src/users/clerk-webhook.service";
import { UsersRepository } from "../../src/users/users.repository";

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

describe("ClerkWebhookService", () => {
  let verifyMock: jest.SpyInstance;
  let repo: jest.Mocked<
    Pick<UsersRepository, "findByExternalId" | "upsertFromClerk">
  >;
  let config: { getOrThrow: jest.Mock };
  let service: ClerkWebhookService;

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
    service = new ClerkWebhookService(
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
    await expect(service.process({}, "id", "ts", "sig")).rejects.toBeInstanceOf(
      BadRequestException,
    );
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
    await service.process({ x: 1 }, "id", "ts", "sig");
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
    await service.process({ x: 1 }, "id", "ts", "sig");
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
      service.process({ x: 1 }, "id", "ts", "sig"),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it("ignores unsupported webhook event types", async () => {
    verifyMock.mockReturnValue({
      type: "session.created",
      data: {},
    } as WebhookEvent);

    await expect(
      service.process({ x: 1 }, "id", "ts", "sig"),
    ).resolves.toBeUndefined();
    expect(repo.findByExternalId).not.toHaveBeenCalled();
    expect(repo.upsertFromClerk).not.toHaveBeenCalled();
  });

  it("rejects Clerk payloads without email", async () => {
    verifyMock.mockReturnValue({
      type: "user.created",
      data: {
        id: "user_clerk_1",
        email_addresses: [],
        primary_email_address_id: null,
      },
    } as WebhookEvent);

    await expect(service.process({ x: 1 }, "id", "ts", "sig")).rejects.toThrow(
      new BadRequestException("E-mail do Clerk ausente."),
    );
  });

  it("uses username or default display name when names are absent", async () => {
    verifyMock.mockReturnValue({
      type: "user.created",
      data: {
        id: "user_clerk_2",
        email_addresses: [{ id: "ea1", email_address: "u@example.com" }],
        primary_email_address_id: "ea1",
        username: "pat_user",
      },
    } as WebhookEvent);
    repo.findByExternalId.mockResolvedValue(null);
    repo.upsertFromClerk.mockResolvedValue(user() as never);

    await service.process({ x: 1 }, "id", "ts", "sig");
    expect(repo.upsertFromClerk).toHaveBeenCalledWith(
      expect.objectContaining({ name: "pat_user" }),
    );

    verifyMock.mockReturnValue({
      type: "user.created",
      data: {
        id: "user_clerk_3",
        email_addresses: [{ id: "ea1", email_address: "u2@example.com" }],
        primary_email_address_id: "ea1",
      },
    } as WebhookEvent);

    await service.process({ x: 1 }, "id", "ts", "sig");
    expect(repo.upsertFromClerk).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: "Usuário" }),
    );
  });
});
