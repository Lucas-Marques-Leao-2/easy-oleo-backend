import { Injectable } from "@nestjs/common";
import { Prisma, Product } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { InsufficientStockException } from "../common/exceptions/insufficient-stock.exception";
import { CreateProductDto } from "./schemas/create-product.dto";
import { UpdateProductDto } from "./schemas/update-product.dto";

function toDecimal(n: number): Prisma.Decimal {
  return new Prisma.Decimal(String(n));
}

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateProductDto): Promise<Product> {
    return this.prisma.product.create({
      data: {
        code: dto.code,
        name: dto.name,
        brand: dto.brand,
        type: dto.type,
        viscosity: dto.viscosity,
        unit: dto.unit,
        salePrice: toDecimal(dto.salePrice),
        stockQuantity: toDecimal(dto.stockQuantity),
        minStock: toDecimal(dto.minStock),
      },
    });
  }

  findAll(): Promise<Product[]> {
    return this.prisma.product.findMany({ orderBy: { name: "asc" } });
  }

  findById(id: string): Promise<Product | null> {
    return this.prisma.product.findUnique({ where: { id } });
  }

  findByCode(code: string): Promise<Product | null> {
    return this.prisma.product.findUnique({ where: { code } });
  }

  update(id: string, dto: UpdateProductDto): Promise<Product> {
    const data: Prisma.ProductUpdateInput = {};
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.brand !== undefined) data.brand = dto.brand;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.viscosity !== undefined) data.viscosity = dto.viscosity;
    if (dto.unit !== undefined) data.unit = dto.unit;
    if (dto.salePrice !== undefined) data.salePrice = toDecimal(dto.salePrice);
    if (dto.stockQuantity !== undefined)
      data.stockQuantity = toDecimal(dto.stockQuantity);
    if (dto.minStock !== undefined) data.minStock = toDecimal(dto.minStock);

    return this.prisma.product.update({ where: { id }, data });
  }

  remove(id: string): Promise<Product> {
    return this.prisma.product.delete({ where: { id } });
  }

  async updateStockTx(
    tx: Prisma.TransactionClient,
    productId: string,
    delta: Prisma.Decimal,
  ): Promise<Product> {
    const p = await tx.product.findUniqueOrThrow({ where: { id: productId } });
    const next = p.stockQuantity.plus(delta);
    if (next.lessThan(0)) {
      throw new InsufficientStockException();
    }
    return tx.product.update({
      where: { id: productId },
      data: { stockQuantity: next },
    });
  }
}
