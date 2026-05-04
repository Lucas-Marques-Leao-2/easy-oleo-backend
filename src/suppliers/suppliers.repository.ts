import { Injectable } from '@nestjs/common';
import { Prisma, Supplier, SupplierPhone } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './schemas/create-supplier.dto';
import { UpdateSupplierDto } from './schemas/update-supplier.dto';

export type SupplierWithPhones = Supplier & { phones: SupplierPhone[] };

@Injectable()
export class SuppliersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateSupplierDto): Promise<SupplierWithPhones> {
    const phonesInput = dto.phones;

    return this.prisma.supplier.create({
      data: {
        legalName: dto.legalName,
        cnpj: dto.cnpj,
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

  findAll(): Promise<SupplierWithPhones[]> {
    return this.prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' },
      include: { phones: true },
    });
  }

  findById(id: string): Promise<SupplierWithPhones | null> {
    return this.prisma.supplier.findUnique({
      where: { id },
      include: { phones: true },
    });
  }

  findByCnpj(cnpj: string): Promise<Supplier | null> {
    return this.prisma.supplier.findUnique({ where: { cnpj } });
  }

  update(id: string, dto: UpdateSupplierDto): Promise<SupplierWithPhones> {
    const data: Prisma.SupplierUpdateInput = {};
    if (dto.legalName !== undefined) data.legalName = dto.legalName;
    if (dto.street !== undefined) data.street = dto.street;
    if (dto.number !== undefined) data.number = dto.number;
    if (dto.complement !== undefined) data.complement = dto.complement;
    if (dto.district !== undefined) data.district = dto.district;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.state !== undefined) data.state = dto.state;
    if (dto.zipCode !== undefined) data.zipCode = dto.zipCode;
    if (dto.email !== undefined) data.email = dto.email;

    return this.prisma.supplier.update({
      where: { id },
      data,
      include: { phones: true },
    });
  }

  remove(id: string): Promise<SupplierWithPhones> {
    return this.prisma.supplier.delete({
      where: { id },
      include: { phones: true },
    });
  }
}
