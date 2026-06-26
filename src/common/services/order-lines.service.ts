import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { ProductsRepository } from "../../products/products.repository";

export type SaleOrderLineInput = {
  productId: string;
  quantity: number;
};

export type PurchaseOrderLineInput = {
  productId: string;
  quantity: number;
  unitCost: number;
};

@Injectable()
export class OrderLinesService {
  constructor(private readonly productsRepo: ProductsRepository) {}

  async buildSaleLines(items: SaleOrderLineInput[]): Promise<{
    total: Prisma.Decimal;
    creates: Prisma.SaleOrderItemCreateWithoutSaleOrderInput[];
  }> {
    let total = new Prisma.Decimal(0);
    const creates: Prisma.SaleOrderItemCreateWithoutSaleOrderInput[] = [];

    for (const line of items) {
      const product = await this.productsRepo.findById(line.productId);
      if (!product) {
        throw new NotFoundException(
          `Produto não encontrado: ${line.productId}.`,
        );
      }
      const qty = new Prisma.Decimal(String(line.quantity));
      const unitPrice = product.salePrice;
      const subtotal = qty.mul(unitPrice);
      total = total.plus(subtotal);
      creates.push({
        quantity: qty,
        unitPrice,
        subtotal,
        product: { connect: { id: product.id } },
      });
    }

    return { total, creates };
  }

  async buildPurchaseLines(items: PurchaseOrderLineInput[]): Promise<{
    total: Prisma.Decimal;
    creates: Prisma.PurchaseOrderItemCreateWithoutPurchaseOrderInput[];
  }> {
    let total = new Prisma.Decimal(0);
    const creates: Prisma.PurchaseOrderItemCreateWithoutPurchaseOrderInput[] =
      [];

    for (const line of items) {
      const product = await this.productsRepo.findById(line.productId);
      if (!product) {
        throw new NotFoundException(
          `Produto não encontrado: ${line.productId}.`,
        );
      }
      const qty = new Prisma.Decimal(String(line.quantity));
      const unitCost = new Prisma.Decimal(String(line.unitCost));
      const subtotal = qty.mul(unitCost);
      total = total.plus(subtotal);
      creates.push({
        quantity: qty,
        unitCost,
        subtotal,
        product: { connect: { id: product.id } },
      });
    }

    return { total, creates };
  }
}
