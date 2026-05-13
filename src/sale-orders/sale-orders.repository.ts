import { Injectable } from "@nestjs/common";
import {
  Prisma,
  SaleOrder,
  SaleOrderItem,
  Customer,
  User,
  Product,
} from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

export type SaleOrderFull = SaleOrder & {
  customer: Pick<Customer, "id" | "name">;
  createdBy: Pick<User, "id" | "name">;
  items: (SaleOrderItem & {
    product: Pick<Product, "id" | "code" | "name">;
  })[];
};

const includeFull = {
  customer: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  items: {
    include: {
      product: { select: { id: true, code: true, name: true } },
    },
    orderBy: { id: "asc" as const },
  },
} satisfies Prisma.SaleOrderInclude;

@Injectable()
export class SaleOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.SaleOrderCreateInput): Promise<SaleOrderFull> {
    return this.prisma.saleOrder.create({
      data,
      include: includeFull,
    });
  }

  findById(id: string): Promise<SaleOrderFull | null> {
    return this.prisma.saleOrder.findUnique({
      where: { id },
      include: includeFull,
    });
  }

  findAll(): Promise<SaleOrderFull[]> {
    return this.prisma.saleOrder.findMany({
      orderBy: { orderDate: "desc" },
      include: includeFull,
    });
  }

  update(
    id: string,
    data: Prisma.SaleOrderUpdateInput,
  ): Promise<SaleOrderFull> {
    return this.prisma.saleOrder.update({
      where: { id },
      data,
      include: includeFull,
    });
  }

  remove(id: string): Promise<SaleOrderFull> {
    return this.prisma.saleOrder.delete({
      where: { id },
      include: includeFull,
    });
  }
}
