import { NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { OrderLinesService } from "../../src/common/services/order-lines.service";
import { ProductsRepository } from "../../src/products/products.repository";

const now = new Date("2026-04-20T10:00:00.000Z");

function product(overrides: Record<string, unknown> = {}) {
  return {
    id: "product-1",
    code: "OLEO-5W30-1L",
    name: "Óleo motor sintético 5W30",
    brand: "Mobil",
    type: "óleo lubrificante",
    viscosity: "5W-30",
    unit: "L",
    salePrice: new Prisma.Decimal("45.9"),
    stockQuantity: new Prisma.Decimal("120"),
    minStock: new Prisma.Decimal("24"),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("OrderLinesService", () => {
  let productsRepo: jest.Mocked<Pick<ProductsRepository, "findById">>;
  let service: OrderLinesService;

  beforeEach(() => {
    productsRepo = { findById: jest.fn() };
    service = new OrderLinesService(
      productsRepo as unknown as ProductsRepository,
    );
  });

  describe("buildSaleLines", () => {
    it("calculates total and line items from product sale prices", async () => {
      productsRepo.findById.mockResolvedValue(product() as never);

      const result = await service.buildSaleLines([
        { productId: "product-1", quantity: 2 },
      ]);

      expect(result.total).toEqual(new Prisma.Decimal("91.8"));
      expect(result.creates).toEqual([
        {
          quantity: new Prisma.Decimal("2"),
          unitPrice: new Prisma.Decimal("45.9"),
          subtotal: new Prisma.Decimal("91.8"),
          product: { connect: { id: "product-1" } },
        },
      ]);
    });

    it("accumulates totals across multiple lines", async () => {
      productsRepo.findById
        .mockResolvedValueOnce(
          product({
            id: "product-1",
            salePrice: new Prisma.Decimal("10"),
          }) as never,
        )
        .mockResolvedValueOnce(
          product({
            id: "product-2",
            salePrice: new Prisma.Decimal("5"),
          }) as never,
        );

      const result = await service.buildSaleLines([
        { productId: "product-1", quantity: 3 },
        { productId: "product-2", quantity: 4 },
      ]);

      expect(result.total).toEqual(new Prisma.Decimal("50"));
      expect(result.creates).toHaveLength(2);
    });

    it("throws when a product is missing", async () => {
      productsRepo.findById.mockResolvedValue(null);

      await expect(
        service.buildSaleLines([{ productId: "missing", quantity: 1 }]),
      ).rejects.toThrow(
        new NotFoundException("Produto não encontrado: missing."),
      );
    });
  });

  describe("buildPurchaseLines", () => {
    it("calculates total and line items from unit costs", async () => {
      productsRepo.findById.mockResolvedValue(product() as never);

      const result = await service.buildPurchaseLines([
        { productId: "product-1", quantity: 48, unitCost: 32.5 },
      ]);

      expect(result.total).toEqual(new Prisma.Decimal("1560"));
      expect(result.creates).toEqual([
        {
          quantity: new Prisma.Decimal("48"),
          unitCost: new Prisma.Decimal("32.5"),
          subtotal: new Prisma.Decimal("1560"),
          product: { connect: { id: "product-1" } },
        },
      ]);
    });

    it("throws when a product is missing", async () => {
      productsRepo.findById.mockResolvedValue(null);

      await expect(
        service.buildPurchaseLines([
          { productId: "missing", quantity: 1, unitCost: 10 },
        ]),
      ).rejects.toThrow(
        new NotFoundException("Produto não encontrado: missing."),
      );
    });
  });
});
