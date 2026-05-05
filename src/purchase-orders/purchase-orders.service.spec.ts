import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { ProductsRepository } from "../products/products.repository";
import {
  PurchaseOrderFull,
  PurchaseOrdersRepository,
} from "./purchase-orders.repository";
import { PurchaseOrdersService } from "./purchase-orders.service";

const now = new Date("2026-04-20T10:00:00.000Z");

function purchaseOrder(
  overrides: Partial<PurchaseOrderFull> = {},
): PurchaseOrderFull {
  return {
    id: "purchase-order-1",
    purchaseDate: now,
    total: new Prisma.Decimal("1560"),
    supplierId: "supplier-1",
    registeredByUserId: "user-1",
    supplier: { id: "supplier-1", legalName: "Fornecedor" },
    registeredBy: { id: "user-1", name: "Usuário" },
    items: [
      {
        id: "item-1",
        purchaseOrderId: "purchase-order-1",
        productId: "product-1",
        quantity: new Prisma.Decimal("48"),
        unitCost: new Prisma.Decimal("32.5"),
        subtotal: new Prisma.Decimal("1560"),
        product: { id: "product-1", code: "OLEO", name: "Óleo" },
      },
    ],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("PurchaseOrdersService", () => {
  let prisma: {
    supplier: { findUnique: jest.Mock };
    user: { findUnique: jest.Mock };
    purchaseOrder: { create: jest.Mock; delete: jest.Mock };
    $transaction: jest.Mock;
  };
  let repo: jest.Mocked<PurchaseOrdersRepository>;
  let productsRepo: jest.Mocked<ProductsRepository>;
  let service: PurchaseOrdersService;

  beforeEach(() => {
    prisma = {
      supplier: { findUnique: jest.fn() },
      user: { findUnique: jest.fn() },
      purchaseOrder: { create: jest.fn(), delete: jest.fn() },
      $transaction: jest.fn((callback) => callback(prisma)),
    };
    repo = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<PurchaseOrdersRepository>;
    productsRepo = {
      findById: jest.fn(),
      updateStockTx: jest.fn(),
    } as unknown as jest.Mocked<ProductsRepository>;
    service = new PurchaseOrdersService(
      prisma as unknown as PrismaService,
      repo,
      productsRepo,
    );
  });

  it("creates a purchase order and increments stock in the same transaction", async () => {
    prisma.supplier.findUnique.mockResolvedValue({ id: "supplier-1" });
    prisma.user.findUnique.mockResolvedValue({ id: "user-1" });
    productsRepo.findById.mockResolvedValue({ id: "product-1" } as never);
    prisma.purchaseOrder.create.mockResolvedValue(purchaseOrder());
    productsRepo.updateStockTx.mockResolvedValue({} as never);

    await expect(
      service.create({
        supplierId: "supplier-1",
        registeredByUserId: "user-1",
        items: [{ productId: "product-1", quantity: 48, unitCost: 32.5 }],
      }),
    ).resolves.toMatchObject({ total: 1560 });
    expect(prisma.purchaseOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          total: new Prisma.Decimal("1560"),
          items: {
            create: [
              expect.objectContaining({ subtotal: new Prisma.Decimal("1560") }),
            ],
          },
        }),
      }),
    );
    expect(productsRepo.updateStockTx).toHaveBeenCalledWith(
      prisma,
      "product-1",
      new Prisma.Decimal("48"),
    );
  });

  it("rejects missing supplier, user, or product", async () => {
    prisma.supplier.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.create({
        supplierId: "missing",
        registeredByUserId: "user-1",
        items: [{ productId: "product-1", quantity: 1, unitCost: 1 }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    prisma.supplier.findUnique.mockResolvedValue({ id: "supplier-1" });
    prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.create({
        supplierId: "supplier-1",
        registeredByUserId: "missing",
        items: [{ productId: "product-1", quantity: 1, unitCost: 1 }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    prisma.user.findUnique.mockResolvedValue({ id: "user-1" });
    productsRepo.findById.mockResolvedValue(null);
    await expect(
      service.create({
        supplierId: "supplier-1",
        registeredByUserId: "user-1",
        items: [{ productId: "missing-product", quantity: 1, unitCost: 1 }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("finds orders and rejects missing records", async () => {
    repo.findAll.mockResolvedValue([purchaseOrder()]);
    repo.findById.mockResolvedValueOnce(purchaseOrder());
    repo.findById.mockResolvedValueOnce(null);

    await expect(service.findAll()).resolves.toHaveLength(1);
    await expect(service.findOne("purchase-order-1")).resolves.toMatchObject({
      id: "purchase-order-1",
    });
    await expect(service.findOne("missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("removes orders by reversing stock and maps insufficient stock", async () => {
    repo.findById.mockResolvedValue(purchaseOrder());
    productsRepo.updateStockTx.mockRejectedValueOnce(
      new Error("Estoque insuficiente."),
    );
    await expect(service.remove("purchase-order-1")).rejects.toBeInstanceOf(
      BadRequestException,
    );

    productsRepo.updateStockTx.mockResolvedValue({} as never);
    prisma.purchaseOrder.delete.mockResolvedValue(purchaseOrder());
    await expect(service.remove("purchase-order-1")).resolves.toMatchObject({
      id: "purchase-order-1",
    });
    expect(productsRepo.updateStockTx).toHaveBeenLastCalledWith(
      prisma,
      "product-1",
      new Prisma.Decimal("-48"),
    );
  });
});
