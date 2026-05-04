import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

function uniqueTargetFields(
  meta: Prisma.PrismaClientKnownRequestError['meta'] | undefined,
): string[] {
  const target = meta?.target;
  if (Array.isArray(target)) return target.map(String);
  if (typeof target === 'string') return [target];
  return [];
}

export function throwConflictIfUniqueViolation(error: unknown): void {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== 'P2002'
  ) {
    return;
  }

  const fields = uniqueTargetFields(
    error.meta as Prisma.PrismaClientKnownRequestError['meta'],
  );

  const documentConflict =
    fields.includes('document') ||
    fields.some((f) => f.includes('document'));

  if (documentConflict) {
    throw new ConflictException('Este documento já está cadastrado.');
  }

  const cnpjConflict =
    fields.includes('cnpj') || fields.some((f) => f.includes('cnpj'));

  if (cnpjConflict) {
    throw new ConflictException('Este CNPJ já está cadastrado.');
  }

  const codeConflict =
    fields.includes('code') || fields.some((f) => f.includes('code'));

  if (codeConflict) {
    throw new ConflictException('Este código de produto já está em uso.');
  }

  const cpfConflict =
    fields.includes('cpf') || fields.some((f) => f.includes('cpf'));
  if (cpfConflict) {
    throw new ConflictException('Este CPF já está cadastrado.');
  }

  const emailConflict =
    fields.includes('email') || fields.some((f) => f.includes('email'));
  if (emailConflict) {
    throw new ConflictException('Este e-mail já está em uso.');
  }

  throw new ConflictException(
    'Um ou mais valores enviados já estão em uso e não podem ser duplicados.',
  );
}
