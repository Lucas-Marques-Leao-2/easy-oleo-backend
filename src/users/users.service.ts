import * as bcrypt from "bcryptjs";
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { throwConflictIfUniqueViolation } from "../lib/prisma-unique.util";
import { UserResponse } from "./responses/user.response";
import { CreateUserDto } from "./schemas/create-user.dto";
import { UpdateUserDto } from "./schemas/update-user.dto";
import { UsersRepository } from "./users.repository";

const SALT_ROUNDS = 10;

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
  constructor(private readonly repo: UsersRepository) {}

  async create(dto: CreateUserDto): Promise<UserResponse> {
    if (await this.repo.findByCpf(dto.cpf)) {
      throw new ConflictException("Este CPF já está cadastrado.");
    }
    if (await this.repo.findByEmail(dto.email)) {
      throw new ConflictException("Este e-mail já está em uso.");
    }
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
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
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }

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
}
