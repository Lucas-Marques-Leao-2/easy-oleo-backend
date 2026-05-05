import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Prisma, SaleOrderStatus } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { ProductsRepository } from "../products/products.repository";
import { SaleOrdersRepository, SaleOrderFull } from "./sale-orders.repository";
import { SaleOrdersService } from "./sale-orders.service";

const now = new Date("2026-04-20T10:00:00.000Z");

function saleOrder(overrides: Partial<SaleOrderFull> = {}): SaleOrderFull {
  return {
    id: "sale-order-1",
    orderDate: now,
    total: new Prisma.Decimal("91.8"),
    status: SaleOrderStatus.DRAFT,
    customerId: "customer-1",
    createdByUserId: "user-1",
    customer: { id: "customer-1", name: "Cliente" },
    createdBy: { id: "user-1", name: "Usuário" },
    items: [
      {
        id: "item-1",
        saleOrderId: "sale-order-1",
        productId: "product-1",
        quantity: new Prisma.Decimal("2"),
        unitPrice: new Prisma.Decimal("45.9"),
        subtotal: new Prisma.Decimal("91.8"),
        product: { id: "product-1", code: "OLEO", name: "Óleo" },
      },
    ],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("SaleOrdersService", () => {
  let prisma: {
    customer: { findUnique: jest.Mock };
    user: { findUnique: jest.Mock };
    saleOrderItem: { deleteMany: jest.Mock };
    saleOrder: { update: jest.Mock; findUnique: jest.Mock };
    $transaction: jest.Mock;
  };
  let repo: jest.Mocked<SaleOrdersRepository>;
  let productsRepo: jest.Mocked<ProductsRepository>;
  let service: SaleOrdersService;

  beforeEach(() => {
    prisma = {
      customer: { findUnique: jest.fn() },
      user: { findUnique: jest.fn() },
      saleOrderItem: { deleteMany: jest.fn() },
      saleOrder: { update: jest.fn(), findUnique: jest.fn() },
      $transaction: jest.fn((callback) => callback(prisma)),
    };
    repo = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<SaleOrdersRepository>;
    productsRepo = {
      findById: jest.fn(),
      updateStockTx: jest.fn(),
    } as unknown as jest.Mocked<ProductsRepository>;
    service = new SaleOrdersService(
      prisma as unknown as PrismaService,
      repo,
      productsRepo,
    );
  });

  it("creates a DRAFT order with current product prices and calculated total", async () => {
    prisma.customer.findUnique.mockResolvedValue({ id: "customer-1" });
    prisma.user.findUnique.mockResolvedValue({ id: "user-1" });
    productsRepo.findById.mockResolvedValue({
      id: "product-1",
      salePrice: new Prisma.Decimal("45.9"),
    } as never);
    repo.create.mockResolvedValue(saleOrder());

    await expect(
      service.create({
        customerId: "customer-1",
        createdByUserId: "user-1",
        items: [{ productId: "product-1", quantity: 2 }],
      }),
    ).resolves.toMatchObject({ total: 91.8, status: SaleOrderStatus.DRAFT });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        total: new Prisma.Decimal("91.8"),
        status: SaleOrderStatus.DRAFT,
        items: {
          create: [
            expect.objectContaining({
              quantity: new Prisma.Decimal("2"),
              unitPrice: new Prisma.Decimal("45.9"),
              subtotal: new Prisma.Decimal("91.8"),
            }),
          ],
        },
      }),
    );
  });

  it("rejects missing related records and missing products", async () => {
    prisma.customer.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.create({
        customerId: "missing",
        createdByUserId: "user-1",
        items: [{ productId: "product-1", quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    prisma.customer.findUnique.mockResolvedValue({ id: "customer-1" });
    prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.create({
        customerId: "customer-1",
        createdByUserId: "missing",
        items: [{ productId: "product-1", quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    prisma.user.findUnique.mockResolvedValue({ id: "user-1" });
    productsRepo.findById.mockResolvedValue(null);
    await expect(
      service.create({
        customerId: "customer-1",
        createdByUserId: "user-1",
        items: [{ productId: "missing-product", quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("only updates and removes DRAFT orders", async () => {
    repo.findById.mockResolvedValue(
      saleOrder({ status: SaleOrderStatus.CONFIRMED }),
    );

    await expect(
      service.update("sale-order-1", { orderDate: now }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.remove("sale-order-1")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("replaces items inside a transaction when updating items", async () => {
    repo.findById.mockResolvedValue(saleOrder());
    productsRepo.findById.mockResolvedValue({
      id: "product-1",
      salePrice: new Prisma.Decimal("45.9"),
    } as never);
    prisma.saleOrder.update.mockResolvedValue(saleOrder());

    await expect(
      service.update("sale-order-1", {
        items: [{ productId: "product-1", quantity: 2 }],
      }),
    ).resolves.toMatchObject({ id: "sale-order-1" });
    expect(prisma.saleOrderItem.deleteMany).toHaveBeenCalledWith({
      where: { saleOrderId: "sale-order-1" },
    });
    expect(prisma.saleOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "sale-order-1" },
        data: expect.objectContaining({ total: new Prisma.Decimal("91.8") }),
      }),
    );
  });

  it("confirms DRAFT orders by decrementing stock and mapping insufficient stock", async () => {
    repo.findById.mockResolvedValueOnce(saleOrder());
    prisma.saleOrder.findUnique.mockResolvedValue({
      id: "sale-order-1",
      items: [{ productId: "product-1", quantity: new Prisma.Decimal("2") }],
    });
    productsRepo.updateStockTx.mockRejectedValueOnce(
      new Error("Estoque insuficiente."),
    );

    await expect(service.confirm("sale-order-1")).rejects.toBeInstanceOf(
      BadRequestException,
    );

    productsRepo.updateStockTx.mockResolvedValue({} as never);
    repo.findById.mockResolvedValueOnce(saleOrder());
    repo.findById.mockResolvedValueOnce(
      saleOrder({ status: SaleOrderStatus.CONFIRMED }),
    );
    await expect(service.confirm("sale-order-1")).resolves.toMatchObject({
      status: SaleOrderStatus.CONFIRMED,
    });
    expect(productsRepo.updateStockTx).toHaveBeenLastCalledWith(
      prisma,
      "product-1",
      new Prisma.Decimal("-2"),
    );
  });

  it("cancels DRAFT directly and CONFIRMED orders by restoring stock", async () => {
    repo.findById.mockResolvedValueOnce(saleOrder());
    repo.update.mockResolvedValueOnce(
      saleOrder({ status: SaleOrderStatus.CANCELLED }),
    );
    await expect(service.cancel("sale-order-1")).resolves.toMatchObject({
      status: SaleOrderStatus.CANCELLED,
    });

    repo.findById.mockResolvedValueOnce(
      saleOrder({ status: SaleOrderStatus.CONFIRMED }),
    );
    prisma.saleOrder.findUnique.mockResolvedValue({
      id: "sale-order-1",
      items: [{ productId: "product-1", quantity: new Prisma.Decimal("2") }],
    });
    repo.findById.mockResolvedValueOnce(
      saleOrder({ status: SaleOrderStatus.CANCELLED }),
    );
    await expect(service.cancel("sale-order-1")).resolves.toMatchObject({
      status: SaleOrderStatus.CANCELLED,
    });
    expect(productsRepo.updateStockTx).toHaveBeenCalledWith(
      prisma,
      "product-1",
      new Prisma.Decimal("2"),
    );
  });
});
