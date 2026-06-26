import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { InsufficientStockException } from "../../src/common/exceptions/insufficient-stock.exception";
import { OrderLinesService } from "../../src/common/services/order-lines.service";
import { PrismaService } from "../../src/prisma/prisma.service";
import { ProductsRepository } from "../../src/products/products.repository";
import { SuppliersRepository } from "../../src/suppliers/suppliers.repository";
import { UsersRepository } from "../../src/users/users.repository";
import {
  PurchaseOrderFull,
  PurchaseOrdersRepository,
} from "../../src/purchase-orders/purchase-orders.repository";
import { PurchaseOrdersService } from "../../src/purchase-orders/purchase-orders.service";

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
    purchaseOrder: { create: jest.Mock; delete: jest.Mock };
    $transaction: jest.Mock;
  };
  let repo: jest.Mocked<PurchaseOrdersRepository>;
  let productsRepo: jest.Mocked<ProductsRepository>;
  let suppliersRepo: jest.Mocked<Pick<SuppliersRepository, "findById">>;
  let usersRepo: jest.Mocked<Pick<UsersRepository, "findById">>;
  let orderLines: jest.Mocked<Pick<OrderLinesService, "buildPurchaseLines">>;
  let service: PurchaseOrdersService;

  beforeEach(() => {
    prisma = {
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
    suppliersRepo = { findById: jest.fn() };
    usersRepo = { findById: jest.fn() };
    orderLines = { buildPurchaseLines: jest.fn() };
    service = new PurchaseOrdersService(
      prisma as unknown as PrismaService,
      repo,
      productsRepo,
      suppliersRepo as unknown as SuppliersRepository,
      usersRepo as unknown as UsersRepository,
      orderLines as unknown as OrderLinesService,
    );
  });

  it("creates a purchase order and increments stock in the same transaction", async () => {
    suppliersRepo.findById.mockResolvedValue({ id: "supplier-1" } as never);
    usersRepo.findById.mockResolvedValue({ id: "user-1" } as never);
    orderLines.buildPurchaseLines.mockResolvedValue({
      total: new Prisma.Decimal("1560"),
      creates: [
        {
          quantity: new Prisma.Decimal("48"),
          unitCost: new Prisma.Decimal("32.5"),
          subtotal: new Prisma.Decimal("1560"),
          product: { connect: { id: "product-1" } },
        },
      ],
    });
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
    suppliersRepo.findById.mockResolvedValueOnce(null);
    await expect(
      service.create({
        supplierId: "missing",
        registeredByUserId: "user-1",
        items: [{ productId: "product-1", quantity: 1, unitCost: 1 }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    suppliersRepo.findById.mockResolvedValue({ id: "supplier-1" } as never);
    usersRepo.findById.mockResolvedValueOnce(null);
    await expect(
      service.create({
        supplierId: "supplier-1",
        registeredByUserId: "missing",
        items: [{ productId: "product-1", quantity: 1, unitCost: 1 }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    usersRepo.findById.mockResolvedValue({ id: "user-1" } as never);
    orderLines.buildPurchaseLines.mockRejectedValue(
      new NotFoundException("Produto não encontrado: missing-product."),
    );
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
      new InsufficientStockException(),
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
