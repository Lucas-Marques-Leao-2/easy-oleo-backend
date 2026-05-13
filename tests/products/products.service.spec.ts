import { ConflictException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { ProductsRepository } from "../../src/products/products.repository";
import { ProductsService } from "../../src/products/products.service";

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

describe("ProductsService", () => {
  let repo: jest.Mocked<ProductsRepository>;
  let service: ProductsService;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      updateStockTx: jest.fn(),
    } as unknown as jest.Mocked<ProductsRepository>;
    service = new ProductsService(repo);
  });

  it("creates and maps Decimal fields to numbers", async () => {
    const dto = {
      code: "OLEO-5W30-1L",
      name: "Óleo motor sintético 5W30",
      brand: "Mobil",
      type: "óleo lubrificante",
      unit: "L",
      salePrice: 45.9,
      stockQuantity: 120,
      minStock: 24,
    };
    repo.findByCode.mockResolvedValue(null);
    repo.create.mockResolvedValue(product() as never);

    await expect(service.create(dto)).resolves.toMatchObject({
      salePrice: 45.9,
      stockQuantity: 120,
      minStock: 24,
    });
    expect(repo.create).toHaveBeenCalledWith(dto);
  });

  it("rejects duplicate create and update codes", async () => {
    repo.findByCode.mockResolvedValue(product({ id: "other" }) as never);

    await expect(
      service.create({ code: "OLEO-5W30-1L" } as never),
    ).rejects.toBeInstanceOf(ConflictException);

    repo.findById.mockResolvedValue(product() as never);
    await expect(
      service.update("product-1", { code: "OLEO-5W30-1L" }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("covers read/update/remove and missing product paths", async () => {
    repo.findAll.mockResolvedValue([product()] as never);
    repo.findById.mockResolvedValueOnce(product() as never);
    repo.findById.mockResolvedValueOnce(product() as never);
    repo.findByCode.mockResolvedValueOnce(product() as never);
    repo.update.mockResolvedValue(product({ name: "Updated" }) as never);
    repo.findById.mockResolvedValueOnce(product() as never);
    repo.remove.mockResolvedValue(product() as never);

    await expect(service.findAll()).resolves.toHaveLength(1);
    await expect(service.findOne("product-1")).resolves.toMatchObject({
      id: "product-1",
    });
    await expect(
      service.update("product-1", { code: "OLEO-5W30-1L", name: "Updated" }),
    ).resolves.toMatchObject({
      name: "Updated",
    });
    await expect(service.remove("product-1")).resolves.toMatchObject({
      id: "product-1",
    });

    repo.findById.mockResolvedValue(null);
    await expect(service.findOne("missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
