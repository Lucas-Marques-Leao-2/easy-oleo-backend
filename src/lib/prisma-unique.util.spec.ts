import { ConflictException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { throwConflictIfUniqueViolation } from "./prisma-unique.util";

function uniqueError(target: string | string[]) {
  return new Prisma.PrismaClientKnownRequestError("Unique failed", {
    code: "P2002",
    clientVersion: "test",
    meta: { target },
  });
}

describe("throwConflictIfUniqueViolation", () => {
  it.each([
    ["document", "Este documento já está cadastrado."],
    ["cnpj", "Este CNPJ já está cadastrado."],
    ["code", "Este código de produto já está em uso."],
    ["cpf", "Este CPF já está cadastrado."],
    ["email", "Este e-mail já está em uso."],
  ])("maps %s unique conflicts", (target, message) => {
    expect(() => throwConflictIfUniqueViolation(uniqueError(target))).toThrow(
      new ConflictException(message),
    );
  });

  it("maps composite or unknown unique conflicts", () => {
    expect(() =>
      throwConflictIfUniqueViolation(uniqueError(["Customer_document_key"])),
    ).toThrow(new ConflictException("Este documento já está cadastrado."));

    expect(() => throwConflictIfUniqueViolation(uniqueError("other"))).toThrow(
      new ConflictException(
        "Um ou mais valores enviados já estão em uso e não podem ser duplicados.",
      ),
    );
  });

  it("ignores non unique Prisma errors and arbitrary errors", () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      "Missing row",
      {
        code: "P2025",
        clientVersion: "test",
      },
    );

    expect(() => throwConflictIfUniqueViolation(prismaError)).not.toThrow();
    expect(() =>
      throwConflictIfUniqueViolation(new Error("boom")),
    ).not.toThrow();
  });
});
