import * as bcrypt from "bcryptjs";
import type { WebhookEvent } from "@clerk/express";
import { createHash, randomBytes } from "node:crypto";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Webhook } from "svix";

import { throwConflictIfUniqueViolation } from "../lib/prisma-unique.util";
import { UserResponse } from "./responses/user.response";
import { CreateUserDto } from "./schemas/create-user.dto";
import { UpdateUserDto } from "./schemas/update-user.dto";
import { UsersRepository } from "./users.repository";

const SALT_ROUNDS = 10;

function clerkPlaceholderCpf(externalId: string): string {
  const h = createHash("sha256").update(externalId).digest("hex");
  let digits = "";
  for (const c of h) {
    if (digits.length >= 11) break;
    digits += String(parseInt(c, 16) % 10);
  }
  return (digits + "00000000000").slice(0, 11);
}

function clerkPrimaryEmail(data: {
  email_addresses?: { id: string; email_address: string }[];
  primary_email_address_id?: string | null;
}): string {
  const emails = data.email_addresses ?? [];
  const primaryId = data.primary_email_address_id;
  const primary =
    emails.find((e) => e.id === primaryId)?.email_address ??
    emails[0]?.email_address;
  if (!primary) {
    throw new BadRequestException("E-mail do Clerk ausente.");
  }
  return primary;
}

function clerkDisplayName(data: {
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
}): string {
  const n = [data.first_name, data.last_name].filter(Boolean).join(" ").trim();
  if (n) return n;
  if (data.username) return data.username;
  return "Usuário";
}

function toResponse(
  row: Awaited<ReturnType<UsersRepository["findById"]>>,
): UserResponse {
  if (!row) throw new NotFoundException();
  return {
    id: row.id,
    name: row.name,
    cpf: row.cpf,
    street: row.street,
    number: row.number,
    complement: row.complement,
    district: row.district,
    city: row.city,
    state: row.state,
    zipCode: row.zipCode,
    email: row.email,
    role: row.role,
    phones: row.phones.map((p) => ({ id: p.id, number: p.number })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly repo: UsersRepository,
    private readonly config: ConfigService,
  ) {}

  async create(dto: CreateUserDto): Promise<UserResponse> {
    if (await this.repo.findByCpf(dto.cpf)) {
      throw new ConflictException("Este CPF já está cadastrado.");
    }
    if (await this.repo.findByEmail(dto.email)) {
      throw new ConflictException("Este e-mail já está em uso.");
    }
    const passwordHash = await bcrypt.hash(
      randomBytes(32).toString("hex"),
      SALT_ROUNDS,
    );
    try {
      const row = await this.repo.create(
        {
          name: dto.name,
          cpf: dto.cpf,
          street: dto.street,
          number: dto.number,
          complement: dto.complement,
          district: dto.district,
          city: dto.city,
          state: dto.state,
          zipCode: dto.zipCode,
          email: dto.email,
          passwordHash,
          role: dto.role ?? "ATTENDANT",
        },
        dto.phones,
      );
      return toResponse(row);
    } catch (e) {
      throwConflictIfUniqueViolation(e);
      throw e;
    }
  }

  async findAll(): Promise<UserResponse[]> {
    const rows = await this.repo.findAll();
    return rows.map((r) => toResponse(r));
  }

  async findOne(id: string): Promise<UserResponse> {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundException("Usuário não encontrado.");
    return toResponse(row);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponse> {
    await this.findOne(id);
    if (dto.email) {
      const u = await this.repo.findByEmail(dto.email);
      if (u && u.id !== id) {
        throw new ConflictException("Este e-mail já está em uso.");
      }
    }

    const data: Parameters<UsersRepository["update"]>[1] = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.street !== undefined) data.street = dto.street;
    if (dto.number !== undefined) data.number = dto.number;
    if (dto.complement !== undefined) data.complement = dto.complement;
    if (dto.district !== undefined) data.district = dto.district;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.state !== undefined) data.state = dto.state;
    if (dto.zipCode !== undefined) data.zipCode = dto.zipCode;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.role !== undefined) data.role = dto.role;

    try {
      const row = await this.repo.update(
        id,
        data,
        dto.phones === undefined ? undefined : dto.phones,
      );
      return toResponse(row);
    } catch (e) {
      throwConflictIfUniqueViolation(e);
      throw e;
    }
  }

  async remove(id: string): Promise<UserResponse> {
    await this.findOne(id);
    const row = await this.repo.remove(id);
    return toResponse(row);
  }

  async processClerkWebhook(
    body: unknown,
    svixId: string,
    svixTimestamp: string,
    svixSignature: string,
  ): Promise<void> {
    const secret = this.config.getOrThrow<string>("CLERK_WEBHOOK_SECRET");
    const wh = new Webhook(secret);
    let evt: WebhookEvent;
    try {
      evt = wh.verify(JSON.stringify(body), {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as WebhookEvent;
    } catch {
      throw new BadRequestException(
        "Falha ao verificar a assinatura do webhook.",
      );
    }

    switch (evt.type) {
      case "user.created":
      case "user.updated": {
        const data = evt.data as {
          id: string;
          email_addresses?: { id: string; email_address: string }[];
          primary_email_address_id?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          username?: string | null;
        };
        const externalId = data.id;
        const email = clerkPrimaryEmail(data);
        const name = clerkDisplayName(data);
        const existing = await this.repo.findByExternalId(externalId);
        const createProfile = existing
          ? undefined
          : {
              cpf: clerkPlaceholderCpf(externalId),
              passwordHash: await bcrypt.hash(
                randomBytes(32).toString("hex"),
                SALT_ROUNDS,
              ),
              street: "—",
              number: "—",
              city: "—",
              state: "AL",
              zipCode: "00000000",
              role: "ATTENDANT" as const,
            };
        try {
          await this.repo.upsertFromClerk({
            externalId,
            email,
            name,
            createProfile,
          });
        } catch (e) {
          this.logger.error(`Clerk webhook upsert failed (${externalId}).`);
          this.logger.debug(e);
          throw new InternalServerErrorException(
            "Erro ao criar/atualizar usuário.",
          );
        }
        break;
      }
      default:
        break;
    }
  }
}
