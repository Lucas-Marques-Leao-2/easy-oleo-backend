import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { throwConflictIfUniqueViolation } from "../lib/prisma-unique.util";
import { SupplierResponse } from "./responses/supplier.response";
import { CreateSupplierDto } from "./schemas/create-supplier.dto";
import { UpdateSupplierDto } from "./schemas/update-supplier.dto";
import { SuppliersRepository } from "./suppliers.repository";

function toResponse(
  row: Awaited<ReturnType<SuppliersRepository["findById"]>>,
): SupplierResponse {
  if (!row) {
    throw new NotFoundException();
  }
  return {
    id: row.id,
    legalName: row.legalName,
    cnpj: row.cnpj,
    street: row.street,
    number: row.number,
    complement: row.complement,
    district: row.district,
    city: row.city,
    state: row.state,
    zipCode: row.zipCode,
    email: row.email,
    phones: row.phones.map((p) => ({ id: p.id, number: p.number })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class SuppliersService {
  constructor(private readonly suppliersRepository: SuppliersRepository) {}

  async create(dto: CreateSupplierDto): Promise<SupplierResponse> {
    const existing = await this.suppliersRepository.findByCnpj(dto.cnpj);
    if (existing) {
      throw new ConflictException("Este CNPJ já está cadastrado.");
    }
    try {
      const row = await this.suppliersRepository.create(dto);
      return toResponse(row);
    } catch (error) {
      throwConflictIfUniqueViolation(error);
      throw error;
    }
  }

  async findAll(): Promise<SupplierResponse[]> {
    const rows = await this.suppliersRepository.findAll();
    return rows.map((row) => toResponse(row));
  }

  async findOne(id: string): Promise<SupplierResponse> {
    const row = await this.suppliersRepository.findById(id);
    if (!row) throw new NotFoundException("Fornecedor não encontrado.");
    return toResponse(row);
  }

  async update(id: string, dto: UpdateSupplierDto): Promise<SupplierResponse> {
    await this.findOne(id);
    try {
      const row = await this.suppliersRepository.update(id, dto);
      return toResponse(row);
    } catch (error) {
      throwConflictIfUniqueViolation(error);
      throw error;
    }
  }

  async remove(id: string): Promise<SupplierResponse> {
    await this.findOne(id);
    const row = await this.suppliersRepository.remove(id);
    return toResponse(row);
  }
}
