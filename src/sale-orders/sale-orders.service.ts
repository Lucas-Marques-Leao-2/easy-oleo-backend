import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, SaleOrderStatus } from "@prisma/client";

import { InsufficientStockException } from "../common/exceptions/insufficient-stock.exception";
import { OrderLinesService } from "../common/services/order-lines.service";
import { CustomersRepository } from "../customers/customers.repository";
import { PrismaService } from "../prisma/prisma.service";
import { ProductsRepository } from "../products/products.repository";
import { UsersRepository } from "../users/users.repository";
import { SaleOrderResponse } from "./responses/sale-order.response";
import { CreateSaleOrderDto } from "./schemas/create-sale-order.dto";
import { UpdateSaleOrderDto } from "./schemas/update-sale-order.dto";
import { SaleOrdersRepository, SaleOrderFull } from "./sale-orders.repository";

function toResponse(row: SaleOrderFull): SaleOrderResponse {
  return {
    id: row.id,
    orderDate: row.orderDate,
    total: row.total.toNumber(),
    status: row.status,
    customer: { id: row.customer.id, name: row.customer.name },
    createdBy: { id: row.createdBy.id, name: row.createdBy.name },
    items: row.items.map((it) => ({
      id: it.id,
      productId: it.productId,
      productCode: it.product.code,
      productName: it.product.name,
      quantity: it.quantity.toNumber(),
      unitPrice: it.unitPrice.toNumber(),
      subtotal: it.subtotal.toNumber(),
    })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class SaleOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: SaleOrdersRepository,
    private readonly productsRepo: ProductsRepository,
    private readonly customersRepo: CustomersRepository,
    private readonly usersRepo: UsersRepository,
    private readonly orderLines: OrderLinesService,
  ) {}

  async create(dto: CreateSaleOrderDto): Promise<SaleOrderResponse> {
    const customer = await this.customersRepo.findById(dto.customerId);
    if (!customer) {
      throw new NotFoundException("Cliente não encontrado.");
    }
    const user = await this.usersRepo.findById(dto.createdByUserId);
    if (!user) {
      throw new NotFoundException("Usuário (criador) não encontrado.");
    }

    const { total, creates } = await this.orderLines.buildSaleLines(dto.items);

    const row = await this.repo.create({
      orderDate: dto.orderDate ?? new Date(),
      total,
      status: SaleOrderStatus.DRAFT,
      customer: { connect: { id: dto.customerId } },
      createdBy: { connect: { id: dto.createdByUserId } },
      items: { create: creates },
    });

    return toResponse(row);
  }

  async findAll(): Promise<SaleOrderResponse[]> {
    const rows = await this.repo.findAll();
    return rows.map(toResponse);
  }

  async findOne(id: string): Promise<SaleOrderResponse> {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundException("Pedido de venda não encontrado.");
    return toResponse(row);
  }

  async update(
    id: string,
    dto: UpdateSaleOrderDto,
  ): Promise<SaleOrderResponse> {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new NotFoundException("Pedido de venda não encontrado.");
    if (existing.status !== SaleOrderStatus.DRAFT) {
      throw new BadRequestException(
        "Só é possível editar pedido em rascunho (DRAFT).",
      );
    }

    const hasPatch =
      dto.orderDate !== undefined ||
      dto.customerId !== undefined ||
      (dto.items !== undefined && dto.items.length > 0);

    if (!hasPatch) {
      return this.findOne(id);
    }

    if (dto.customerId) {
      const c = await this.customersRepo.findById(dto.customerId);
      if (!c) throw new NotFoundException("Cliente não encontrado.");
    }

    if (dto.items && dto.items.length > 0) {
      const { total, creates } = await this.orderLines.buildSaleLines(
        dto.items,
      );

      const row = await this.prisma.$transaction(async (tx) => {
        await tx.saleOrderItem.deleteMany({ where: { saleOrderId: id } });
        return tx.saleOrder.update({
          where: { id },
          data: {
            orderDate: dto.orderDate ?? undefined,
            total,
            ...(dto.customerId
              ? { customer: { connect: { id: dto.customerId } } }
              : {}),
            items: { create: creates },
          },
          include: {
            customer: { select: { id: true, name: true } },
            createdBy: { select: { id: true, name: true } },
            items: {
              include: {
                product: { select: { id: true, code: true, name: true } },
              },
              orderBy: { id: "asc" },
            },
          },
        });
      });

      return toResponse(row as SaleOrderFull);
    }

    const data: Prisma.SaleOrderUpdateInput = {};
    if (dto.orderDate !== undefined) data.orderDate = dto.orderDate;
    if (dto.customerId !== undefined) {
      data.customer = { connect: { id: dto.customerId } };
    }

    const row = await this.repo.update(id, data);

    return toResponse(row);
  }

  async remove(id: string): Promise<SaleOrderResponse> {
    const existing = await this.repo.findById(id);
    if (!existing)
      throw new NotFoundException("Pedido de venda não encontrado.");
    if (existing.status !== SaleOrderStatus.DRAFT) {
      throw new BadRequestException(
        "Só é possível excluir pedido em rascunho (DRAFT).",
      );
    }
    const row = await this.repo.remove(id);
    return toResponse(row);
  }

  async confirm(id: string): Promise<SaleOrderResponse> {
    const order = await this.repo.findById(id);
    if (!order) throw new NotFoundException("Pedido de venda não encontrado.");
    if (order.status !== SaleOrderStatus.DRAFT) {
      throw new BadRequestException(
        "Só é possível confirmar pedido em rascunho (DRAFT).",
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const fresh = await tx.saleOrder.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!fresh)
        throw new NotFoundException("Pedido de venda não encontrado.");
      for (const item of fresh.items) {
        try {
          await this.productsRepo.updateStockTx(
            tx,
            item.productId,
            item.quantity.mul(-1),
          );
        } catch (e) {
          if (e instanceof InsufficientStockException) {
            throw new BadRequestException(e.message);
          }
          throw e;
        }
      }
      await tx.saleOrder.update({
        where: { id },
        data: { status: SaleOrderStatus.CONFIRMED },
      });
    });

    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundException("Pedido de venda não encontrado.");
    return toResponse(row);
  }

  async cancel(id: string): Promise<SaleOrderResponse> {
    const order = await this.repo.findById(id);
    if (!order) throw new NotFoundException("Pedido de venda não encontrado.");
    if (order.status === SaleOrderStatus.CANCELLED) {
      throw new BadRequestException("Pedido já está cancelado.");
    }

    if (order.status === SaleOrderStatus.DRAFT) {
      const row = await this.repo.update(id, {
        status: SaleOrderStatus.CANCELLED,
      });
      return toResponse(row);
    }

    await this.prisma.$transaction(async (tx) => {
      const fresh = await tx.saleOrder.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!fresh)
        throw new NotFoundException("Pedido de venda não encontrado.");
      for (const item of fresh.items) {
        await this.productsRepo.updateStockTx(
          tx,
          item.productId,
          item.quantity,
        );
      }
      await tx.saleOrder.update({
        where: { id },
        data: { status: SaleOrderStatus.CANCELLED },
      });
    });

    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundException("Pedido de venda não encontrado.");
    return toResponse(row);
  }
}
