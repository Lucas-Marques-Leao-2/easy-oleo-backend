import { Prisma } from '@prisma/client';

import { CustomersRepository } from './customers/customers.repository';
import { PrismaService } from './prisma/prisma.service';
import { ProductsRepository } from './products/products.repository';
import { PurchaseOrdersRepository } from './purchase-orders/purchase-orders.repository';
import { SaleOrdersRepository } from './sale-orders/sale-orders.repository';
import { SuppliersRepository } from './suppliers/suppliers.repository';
import { UsersRepository } from './users/users.repository';

describe('Repositories', () => {
  it('CustomersRepository builds Prisma create/update/read/delete calls', async () => {
    const prisma = {
      customer: {
        create: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
      },
    };
    const repo = new CustomersRepository(prisma as unknown as PrismaService);

    await repo.create({
      type: 'PJ',
      name: 'Cliente',
      document: '11222333000181',
      street: 'Rua',
      number: '1',
      city: 'Maceió',
      state: 'AL',
      zipCode: '57000000',
      email: 'cliente@example.com',
      phones: ['82999998888'],
    });
    await repo.findAll();
    await repo.findById('customer-1');
    await repo.findByDocument('11222333000181');
    await repo.update('customer-1', { name: 'Novo' });
    await repo.remove('customer-1');

    expect(prisma.customer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'PJ',
          phones: { create: [{ number: '82999998888' }] },
        }),
        include: { phones: true },
      }),
    );
    expect(prisma.customer.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
      include: { phones: true },
    });
    expect(prisma.customer.findUnique).toHaveBeenCalledWith({
      where: { document: '11222333000181' },
    });
    expect(prisma.customer.update).toHaveBeenCalledWith({
      where: { id: 'customer-1' },
      data: { name: 'Novo' },
      include: { phones: true },
    });
    expect(prisma.customer.delete).toHaveBeenCalledWith({
      where: { id: 'customer-1' },
      include: { phones: true },
    });
  });

  it('SuppliersRepository builds Prisma calls with phone create input', async () => {
    const prisma = {
      supplier: {
        create: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
      },
    };
    const repo = new SuppliersRepository(prisma as unknown as PrismaService);

    await repo.create({
      legalName: 'Fornecedor',
      cnpj: '11222333000181',
      street: 'Rua',
      number: '1',
      city: 'Maceió',
      state: 'AL',
      zipCode: '57000000',
      email: 'fornecedor@example.com',
      phones: ['82988887777'],
    });
    await repo.findAll();
    await repo.findByCnpj('11222333000181');
    await repo.update('supplier-1', { city: 'Maceió' });
    await repo.remove('supplier-1');

    expect(prisma.supplier.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cnpj: '11222333000181',
          phones: { create: [{ number: '82988887777' }] },
        }),
        include: { phones: true },
      }),
    );
    expect(prisma.supplier.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
      include: { phones: true },
    });
    expect(prisma.supplier.findUnique).toHaveBeenCalledWith({
      where: { cnpj: '11222333000181' },
    });
    expect(prisma.supplier.update).toHaveBeenCalledWith({
      where: { id: 'supplier-1' },
      data: { city: 'Maceió' },
      include: { phones: true },
    });
  });

  it('UsersRepository replaces phones only when phoneNumbers is provided', async () => {
    const prisma = {
      user: {
        create: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
      },
      userPhone: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    const repo = new UsersRepository(prisma as unknown as PrismaService);

    await repo.create({ name: 'Carla' } as never, ['82991112233']);
    await repo.findAll();
    await repo.findByCpf('52998224725');
    await repo.findByEmail('carla@example.com');
    await repo.update('user-1', { email: 'new@example.com' }, []);
    await repo.update('user-1', { name: 'Nova' });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { name: 'Carla', phones: { create: [{ number: '82991112233' }] } },
      include: { phones: true },
    });
    expect(prisma.userPhone.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(prisma.user.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'user-1' },
      data: { email: 'new@example.com', phones: undefined },
      include: { phones: true },
    });
    expect(prisma.user.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'user-1' },
      data: { name: 'Nova' },
      include: { phones: true },
    });
  });

  it('ProductsRepository converts numbers to Decimal and guards stock underflow', async () => {
    const tx = {
      product: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: 'product-1',
          stockQuantity: new Prisma.Decimal('5'),
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const prisma = {
      product: {
        create: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
      },
    };
    const repo = new ProductsRepository(prisma as unknown as PrismaService);

    await repo.create({
      code: 'OLEO',
      name: 'Óleo',
      brand: 'Mobil',
      type: 'óleo',
      unit: 'L',
      salePrice: 45.9,
      stockQuantity: 5,
      minStock: 1,
    });
    await repo.update('product-1', { salePrice: 50, stockQuantity: 8 });
    await repo.updateStockTx(tx as unknown as Prisma.TransactionClient, 'product-1', new Prisma.Decimal('-2'));

    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          salePrice: new Prisma.Decimal('45.9'),
          stockQuantity: new Prisma.Decimal('5'),
          minStock: new Prisma.Decimal('1'),
        }),
      }),
    );
    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 'product-1' },
      data: {
        salePrice: new Prisma.Decimal('50'),
        stockQuantity: new Prisma.Decimal('8'),
      },
    });
    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: 'product-1' },
      data: { stockQuantity: new Prisma.Decimal('3') },
    });

    await expect(
      repo.updateStockTx(
        tx as unknown as Prisma.TransactionClient,
        'product-1',
        new Prisma.Decimal('-10'),
      ),
    ).rejects.toThrow('Estoque insuficiente.');
  });

  it('SaleOrdersRepository and PurchaseOrdersRepository use full include shapes', async () => {
    const prisma = {
      saleOrder: {
        create: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
      },
      purchaseOrder: {
        create: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        delete: jest.fn().mockResolvedValue({}),
      },
    };
    const saleRepo = new SaleOrdersRepository(prisma as unknown as PrismaService);
    const purchaseRepo = new PurchaseOrdersRepository(
      prisma as unknown as PrismaService,
    );

    await saleRepo.create({} as never);
    await saleRepo.findById('sale-order-1');
    await saleRepo.findAll();
    await saleRepo.update('sale-order-1', {});
    await saleRepo.remove('sale-order-1');
    await purchaseRepo.create({} as never);
    await purchaseRepo.findById('purchase-order-1');
    await purchaseRepo.findAll();
    await purchaseRepo.remove('purchase-order-1');

    expect(prisma.saleOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { orderDate: 'desc' },
        include: expect.objectContaining({
          customer: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          items: expect.objectContaining({ orderBy: { id: 'asc' } }),
        }),
      }),
    );
    expect(prisma.saleOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sale-order-1' },
        include: expect.objectContaining({
          customer: { select: { id: true, name: true } },
        }),
      }),
    );
    expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { purchaseDate: 'desc' },
        include: expect.objectContaining({
          supplier: { select: { id: true, legalName: true } },
          registeredBy: { select: { id: true, name: true } },
          items: expect.objectContaining({ orderBy: { id: 'asc' } }),
        }),
      }),
    );
  });
});
