import * as bcrypt from "bcryptjs";
import type { WebhookEvent } from "@clerk/express";
import { createHash, randomBytes } from "node:crypto";
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Webhook } from "svix";

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

@Injectable()
export class ClerkWebhookService {
  private readonly logger = new Logger(ClerkWebhookService.name);

  constructor(
    private readonly repo: UsersRepository,
    private readonly config: ConfigService,
  ) {}

  async process(
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
