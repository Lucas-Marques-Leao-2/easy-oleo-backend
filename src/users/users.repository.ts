import { Injectable } from '@nestjs/common';
import { Prisma, User, UserPhone } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export type UserWithPhones = User & { phones: UserPhone[] };

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.UserCreateInput,
    phoneNumbers?: string[],
  ): Promise<UserWithPhones> {
    return this.prisma.user.create({
      data: {
        ...data,
        phones: phoneNumbers?.length
          ? { create: phoneNumbers.map((number) => ({ number })) }
          : undefined,
      },
      include: { phones: true },
    });
  }

  findAll(): Promise<UserWithPhones[]> {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { phones: true },
    });
  }

  findById(id: string): Promise<UserWithPhones | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { phones: true },
    });
  }

  findByCpf(cpf: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { cpf } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(
    id: string,
    data: Prisma.UserUpdateInput,
    phoneNumbers?: string[] | null,
  ): Promise<UserWithPhones> {
    if (phoneNumbers !== undefined) {
      await this.prisma.userPhone.deleteMany({ where: { userId: id } });
      return this.prisma.user.update({
        where: { id },
        data: {
          ...data,
          phones:
            phoneNumbers.length > 0
              ? { create: phoneNumbers.map((number) => ({ number })) }
              : undefined,
        },
        include: { phones: true },
      });
    }

    return this.prisma.user.update({
      where: { id },
      data,
      include: { phones: true },
    });
  }

  remove(id: string): Promise<UserWithPhones> {
    return this.prisma.user.delete({
      where: { id },
      include: { phones: true },
    });
  }
}
