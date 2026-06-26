import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { InsufficientStockException } from "../common/exceptions/insufficient-stock.exception";
import { OrderLinesService } from "../common/services/order-lines.service";
import { PrismaService } from "../prisma/prisma.service";
import { ProductsRepository } from "../products/products.repository";
import { SuppliersRepository } from "../suppliers/suppliers.repository";
import { UsersRepository } from "../users/users.repository";
import { PurchaseOrderResponse } from "./responses/purchase-order.response";
import { CreatePurchaseOrderDto } from "./schemas/create-purchase-order.dto";
import {
  PurchaseOrdersRepository,
  PurchaseOrderFull,
} from "./purchase-orders.repository";

function toResponse(row: PurchaseOrderFull): PurchaseOrderResponse {
  return {
    id: row.id,
    purchaseDate: row.purchaseDate,
    total: row.total.toNumber(),
    supplier: { id: row.supplier.id, name: row.supplier.legalName },
    registeredBy: { id: row.registeredBy.id, name: row.registeredBy.name },
    items: row.items.map((it) => ({
      id: it.id,
      productId: it.productId,
      productCode: it.product.code,
      productName: it.product.name,
      quantity: it.quantity.toNumber(),
      unitCost: it.unitCost.toNumber(),
      subtotal: it.subtotal.toNumber(),
    })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: PurchaseOrdersRepository,
    private readonly productsRepo: ProductsRepository,
    private readonly suppliersRepo: SuppliersRepository,
    private readonly usersRepo: UsersRepository,
    private readonly orderLines: OrderLinesService,
  ) {}

  async create(dto: CreatePurchaseOrderDto): Promise<PurchaseOrderResponse> {
    const supplier = await this.suppliersRepo.findById(dto.supplierId);
    if (!supplier) throw new NotFoundException("Fornecedor não encontrado.");
    const user = await this.usersRepo.findById(dto.registeredByUserId);
    if (!user) throw new NotFoundException("Usuário não encontrado.");

    const { total, creates } = await this.orderLines.buildPurchaseLines(
      dto.items,
    );

    const row = await this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          purchaseDate: dto.purchaseDate ?? new Date(),
          total,
          supplier: { connect: { id: dto.supplierId } },
          registeredBy: { connect: { id: dto.registeredByUserId } },
          items: { create: creates },
        },
        include: {
          supplier: { select: { id: true, legalName: true } },
          registeredBy: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, code: true, name: true } },
            },
            orderBy: { id: "asc" },
          },
        },
      });

      for (const item of po.items) {
        try {
          await this.productsRepo.updateStockTx(
            tx,
            item.productId,
            item.quantity,
          );
        } catch (e) {
          if (e instanceof InsufficientStockException) {
            throw new BadRequestException(e.message);
          }
          throw e;
        }
      }

      return po as unknown as PurchaseOrderFull;
    });

    return toResponse(row);
  }

  async findAll(): Promise<PurchaseOrderResponse[]> {
    const rows = await this.repo.findAll();
    return rows.map(toResponse);
  }

  async findOne(id: string): Promise<PurchaseOrderResponse> {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundException("Pedido de compra não encontrado.");
    return toResponse(row);
  }

  async remove(id: string): Promise<PurchaseOrderResponse> {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new NotFoundException("Pedido de compra não encontrado.");

    const row = await this.prisma.$transaction(async (tx) => {
      for (const item of existing.items) {
        try {
          await this.productsRepo.updateStockTx(
            tx,
            item.productId,
            item.quantity.mul(-1),
          );
        } catch (e) {
          if (e instanceof InsufficientStockException) {
            throw new BadRequestException(
              "Não é possível excluir: estoque atual ficaria negativo.",
            );
          }
          throw e;
        }
      }
      return tx.purchaseOrder.delete({
        where: { id },
        include: {
          supplier: { select: { id: true, legalName: true } },
          registeredBy: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, code: true, name: true } },
            },
            orderBy: { id: "asc" },
          },
        },
      });
    });

    return toResponse(row as PurchaseOrderFull);
  }
}
