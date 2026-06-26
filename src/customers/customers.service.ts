import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { throwConflictIfUniqueViolation } from "../lib/prisma-unique.util";
import { CustomersRepository } from "./customers.repository";
import { CustomerResponse } from "./responses/customer.response";
import { CreateCustomerDto } from "./schemas/create-customer.dto";
import { UpdateCustomerDto } from "./schemas/update-customer.dto";

function toResponse(
  row: Awaited<ReturnType<CustomersRepository["findById"]>>,
): CustomerResponse {
  if (!row) {
    throw new NotFoundException();
  }
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    document: row.document,
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
export class CustomersService {
  constructor(private readonly customersRepository: CustomersRepository) {}

  async create(dto: CreateCustomerDto): Promise<CustomerResponse> {
    const existing = await this.customersRepository.findByDocument(
      dto.document,
    );
    if (existing) {
      throw new ConflictException("Este documento já está cadastrado.");
    }
    try {
      const row = await this.customersRepository.create(dto);
      return toResponse(row);
    } catch (error) {
      throwConflictIfUniqueViolation(error);
      throw error;
    }
  }

  async findAll(): Promise<CustomerResponse[]> {
    const rows = await this.customersRepository.findAll();
    return rows.map((row) => toResponse(row));
  }

  async findOne(id: string): Promise<CustomerResponse> {
    const row = await this.customersRepository.findById(id);
    if (!row) throw new NotFoundException("Customer não encontrado.");
    return toResponse(row);
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<CustomerResponse> {
    await this.findOne(id);
    try {
      const row = await this.customersRepository.update(
        id,
        dto,
        dto.phones === undefined ? undefined : dto.phones,
      );
      return toResponse(row);
    } catch (error) {
      throwConflictIfUniqueViolation(error);
      throw error;
    }
  }

  async remove(id: string): Promise<CustomerResponse> {
    await this.findOne(id);
    const row = await this.customersRepository.remove(id);
    return toResponse(row);
  }
}
