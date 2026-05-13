import { Injectable } from "@nestjs/common";
import {
  Prisma,
  PurchaseOrder,
  PurchaseOrderItem,
  Supplier,
  User,
  Product,
} from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

export type PurchaseOrderFull = PurchaseOrder & {
  supplier: Pick<Supplier, "id" | "legalName">;
  registeredBy: Pick<User, "id" | "name">;
  items: (PurchaseOrderItem & {
    product: Pick<Product, "id" | "code" | "name">;
  })[];
};

const includeFull = {
  supplier: { select: { id: true, legalName: true } },
  registeredBy: { select: { id: true, name: true } },
  items: {
    include: {
      product: { select: { id: true, code: true, name: true } },
    },
    orderBy: { id: "asc" as const },
  },
} satisfies Prisma.PurchaseOrderInclude;

@Injectable()
export class PurchaseOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.PurchaseOrderCreateInput): Promise<PurchaseOrderFull> {
    return this.prisma.purchaseOrder.create({
      data,
      include: includeFull,
    });
  }

  findById(id: string): Promise<PurchaseOrderFull | null> {
    return this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: includeFull,
    });
  }

  findAll(): Promise<PurchaseOrderFull[]> {
    return this.prisma.purchaseOrder.findMany({
      orderBy: { purchaseDate: "desc" },
      include: includeFull,
    });
  }

  remove(id: string): Promise<PurchaseOrderFull> {
    return this.prisma.purchaseOrder.delete({
      where: { id },
      include: includeFull,
    });
  }
}
