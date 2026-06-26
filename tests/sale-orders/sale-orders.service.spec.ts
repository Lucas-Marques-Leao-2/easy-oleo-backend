import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Prisma, SaleOrderStatus } from "@prisma/client";

import { InsufficientStockException } from "../../src/common/exceptions/insufficient-stock.exception";
import { OrderLinesService } from "../../src/common/services/order-lines.service";
import { CustomersRepository } from "../../src/customers/customers.repository";
import { PrismaService } from "../../src/prisma/prisma.service";
import { ProductsRepository } from "../../src/products/products.repository";
import { UsersRepository } from "../../src/users/users.repository";
import {
  SaleOrdersRepository,
  SaleOrderFull,
} from "../../src/sale-orders/sale-orders.repository";
import { SaleOrdersService } from "../../src/sale-orders/sale-orders.service";

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
    saleOrderItem: { deleteMany: jest.Mock };
    saleOrder: { update: jest.Mock; findUnique: jest.Mock };
    $transaction: jest.Mock;
  };
  let repo: jest.Mocked<SaleOrdersRepository>;
  let productsRepo: jest.Mocked<ProductsRepository>;
  let customersRepo: jest.Mocked<Pick<CustomersRepository, "findById">>;
  let usersRepo: jest.Mocked<Pick<UsersRepository, "findById">>;
  let orderLines: jest.Mocked<Pick<OrderLinesService, "buildSaleLines">>;
  let service: SaleOrdersService;

  beforeEach(() => {
    prisma = {
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
    customersRepo = { findById: jest.fn() };
    usersRepo = { findById: jest.fn() };
    orderLines = { buildSaleLines: jest.fn() };
    service = new SaleOrdersService(
      prisma as unknown as PrismaService,
      repo,
      productsRepo,
      customersRepo as unknown as CustomersRepository,
      usersRepo as unknown as UsersRepository,
      orderLines as unknown as OrderLinesService,
    );
  });

  it("creates a DRAFT order with current product prices and calculated total", async () => {
    customersRepo.findById.mockResolvedValue({ id: "customer-1" } as never);
    usersRepo.findById.mockResolvedValue({ id: "user-1" } as never);
    orderLines.buildSaleLines.mockResolvedValue({
      total: new Prisma.Decimal("91.8"),
      creates: [
        {
          quantity: new Prisma.Decimal("2"),
          unitPrice: new Prisma.Decimal("45.9"),
          subtotal: new Prisma.Decimal("91.8"),
          product: { connect: { id: "product-1" } },
        },
      ],
    });
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
    customersRepo.findById.mockResolvedValueOnce(null);
    await expect(
      service.create({
        customerId: "missing",
        createdByUserId: "user-1",
        items: [{ productId: "product-1", quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    customersRepo.findById.mockResolvedValue({ id: "customer-1" } as never);
    usersRepo.findById.mockResolvedValueOnce(null);
    await expect(
      service.create({
        customerId: "customer-1",
        createdByUserId: "missing",
        items: [{ productId: "product-1", quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    usersRepo.findById.mockResolvedValue({ id: "user-1" } as never);
    orderLines.buildSaleLines.mockRejectedValue(
      new NotFoundException("Produto não encontrado: missing-product."),
    );
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
    orderLines.buildSaleLines.mockResolvedValue({
      total: new Prisma.Decimal("91.8"),
      creates: [
        {
          quantity: new Prisma.Decimal("2"),
          unitPrice: new Prisma.Decimal("45.9"),
          subtotal: new Prisma.Decimal("91.8"),
          product: { connect: { id: "product-1" } },
        },
      ],
    });
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
      new InsufficientStockException(),
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

  it("lists and finds sale orders", async () => {
    repo.findAll.mockResolvedValue([saleOrder()]);
    repo.findById.mockResolvedValueOnce(saleOrder());

    await expect(service.findAll()).resolves.toHaveLength(1);
    await expect(service.findOne("sale-order-1")).resolves.toMatchObject({
      id: "sale-order-1",
      total: 91.8,
    });
  });

  it("returns existing order when update payload is empty", async () => {
    repo.findById.mockResolvedValue(saleOrder());

    await expect(service.update("sale-order-1", {})).resolves.toMatchObject({
      id: "sale-order-1",
    });
    expect(orderLines.buildSaleLines).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("updates only orderDate without replacing items", async () => {
    const newDate = new Date("2026-05-01T10:00:00.000Z");
    repo.findById.mockResolvedValue(saleOrder());
    repo.update.mockResolvedValue(saleOrder({ orderDate: newDate }));

    await expect(
      service.update("sale-order-1", { orderDate: newDate }),
    ).resolves.toMatchObject({ id: "sale-order-1" });
    expect(repo.update).toHaveBeenCalledWith("sale-order-1", {
      orderDate: newDate,
    });
  });

  it("rejects update when customer does not exist", async () => {
    repo.findById.mockResolvedValue(saleOrder());
    customersRepo.findById.mockResolvedValue(null);

    await expect(
      service.update("sale-order-1", { customerId: "missing-customer" }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejects confirm/cancel/remove when order is missing or invalid", async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.confirm("missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.cancel("missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.remove("missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );

    repo.findById.mockResolvedValue(
      saleOrder({ status: SaleOrderStatus.CONFIRMED }),
    );
    await expect(service.confirm("sale-order-1")).rejects.toBeInstanceOf(
      BadRequestException,
    );

    repo.findById.mockResolvedValue(
      saleOrder({ status: SaleOrderStatus.CANCELLED }),
    );
    await expect(service.cancel("sale-order-1")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("rejects update when sale order does not exist", async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      service.update("missing", { orderDate: now }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("updates only customerId without replacing items", async () => {
    repo.findById.mockResolvedValue(saleOrder());
    customersRepo.findById.mockResolvedValue({
      id: "customer-2",
      name: "Outro",
    } as never);
    repo.update.mockResolvedValue(
      saleOrder({ customer: { id: "customer-2", name: "Outro" } }),
    );

    await expect(
      service.update("sale-order-1", { customerId: "customer-2" }),
    ).resolves.toMatchObject({
      customer: { id: "customer-2" },
    });
    expect(repo.update).toHaveBeenCalledWith("sale-order-1", {
      customer: { connect: { id: "customer-2" } },
    });
  });

  it("rethrows unexpected stock errors during confirm", async () => {
    repo.findById.mockResolvedValueOnce(saleOrder());
    prisma.saleOrder.findUnique.mockResolvedValue({
      id: "sale-order-1",
      items: [{ productId: "product-1", quantity: new Prisma.Decimal("2") }],
    });
    productsRepo.updateStockTx.mockRejectedValue(new Error("db failure"));

    await expect(service.confirm("sale-order-1")).rejects.toThrow("db failure");
  });

  it("rejects findOne when order does not exist", async () => {
    repo.findById.mockResolvedValue(null);

    await expect(service.findOne("missing")).rejects.toBeInstanceOf(
      NotFoundException,
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
