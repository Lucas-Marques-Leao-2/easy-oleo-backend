import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Product } from '@prisma/client';

import { throwConflictIfUniqueViolation } from '../lib/prisma-unique.util';
import { ProductResponse } from './responses/product.response';
import { CreateProductDto } from './schemas/create-product.dto';
import { UpdateProductDto } from './schemas/update-product.dto';
import { ProductsRepository } from './products.repository';

function toResponse(p: Product): ProductResponse {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    brand: p.brand,
    type: p.type,
    viscosity: p.viscosity,
    unit: p.unit,
    salePrice: p.salePrice.toNumber(),
    stockQuantity: p.stockQuantity.toNumber(),
    minStock: p.minStock.toNumber(),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

@Injectable()
export class ProductsService {
  constructor(private readonly repo: ProductsRepository) {}

  async create(dto: CreateProductDto): Promise<ProductResponse> {
    const exists = await this.repo.findByCode(dto.code);
    if (exists) throw new ConflictException('Este código já está em uso.');
    try {
      const p = await this.repo.create(dto);
      return toResponse(p);
    } catch (e) {
      throwConflictIfUniqueViolation(e);
      throw e;
    }
  }

  async findAll(): Promise<ProductResponse[]> {
    const rows = await this.repo.findAll();
    return rows.map(toResponse);
  }

  async findOne(id: string): Promise<ProductResponse> {
    const p = await this.repo.findById(id);
    if (!p) throw new NotFoundException('Produto não encontrado.');
    return toResponse(p);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductResponse> {
    await this.findOne(id);
    if (dto.code) {
      const other = await this.repo.findByCode(dto.code);
      if (other && other.id !== id) {
        throw new ConflictException('Este código já está em uso.');
      }
    }
    try {
      const p = await this.repo.update(id, dto);
      return toResponse(p);
    } catch (e) {
      throwConflictIfUniqueViolation(e);
      throw e;
    }
  }

  async remove(id: string): Promise<ProductResponse> {
    await this.findOne(id);
    const p = await this.repo.remove(id);
    return toResponse(p);
  }
}
