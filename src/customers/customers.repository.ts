import { Injectable } from "@nestjs/common";
import { Customer, CustomerPhone, Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { CreateCustomerDto } from "./schemas/create-customer.dto";
import { UpdateCustomerDto } from "./schemas/update-customer.dto";

export type CustomerWithPhones = Customer & { phones: CustomerPhone[] };

@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCustomerDto): Promise<CustomerWithPhones> {
    const type = dto.type ?? "PF";
    const phonesInput = dto.phones;

    return this.prisma.customer.create({
      data: {
        type,
        name: dto.name,
        document: dto.document,
        street: dto.street,
        number: dto.number,
        complement: dto.complement,
        district: dto.district,
        city: dto.city,
        state: dto.state,
        zipCode: dto.zipCode,
        email: dto.email,
        phones: phonesInput?.length
          ? {
              create: phonesInput.map((digits) => ({ number: digits })),
            }
          : undefined,
      },
      include: { phones: true },
    });
  }

  findAll(): Promise<CustomerWithPhones[]> {
    return this.prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      include: { phones: true },
    });
  }

  findById(id: string): Promise<CustomerWithPhones | null> {
    return this.prisma.customer.findUnique({
      where: { id },
      include: { phones: true },
    });
  }

  findByDocument(document: string): Promise<Customer | null> {
    return this.prisma.customer.findUnique({ where: { document } });
  }

  async update(
    id: string,
    dto: UpdateCustomerDto,
    phoneNumbers?: string[] | null,
  ): Promise<CustomerWithPhones> {
    const data: Prisma.CustomerUpdateInput = {};
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.street !== undefined) data.street = dto.street;
    if (dto.number !== undefined) data.number = dto.number;
    if (dto.complement !== undefined) data.complement = dto.complement;
    if (dto.district !== undefined) data.district = dto.district;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.state !== undefined) data.state = dto.state;
    if (dto.zipCode !== undefined) data.zipCode = dto.zipCode;
    if (dto.email !== undefined) data.email = dto.email;

    if (phoneNumbers !== undefined) {
      await this.prisma.customerPhone.deleteMany({ where: { customerId: id } });
      return this.prisma.customer.update({
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

    return this.prisma.customer.update({
      where: { id },
      data,
      include: { phones: true },
    });
  }

  remove(id: string): Promise<CustomerWithPhones> {
    return this.prisma.customer.delete({
      where: { id },
      include: { phones: true },
    });
  }
}
