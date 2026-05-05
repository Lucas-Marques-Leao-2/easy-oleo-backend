import { Test } from '@nestjs/testing';

import { CustomersController } from './customers/customers.controller';
import { CustomersService } from './customers/customers.service';
import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';
import { PurchaseOrdersController } from './purchase-orders/purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders/purchase-orders.service';
import { SaleOrdersController } from './sale-orders/sale-orders.controller';
import { SaleOrdersService } from './sale-orders/sale-orders.service';
import { SuppliersController } from './suppliers/suppliers.controller';
import { SuppliersService } from './suppliers/suppliers.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';

function crudServiceMock(result: unknown) {
  return {
    create: jest.fn().mockResolvedValue(result),
    findAll: jest.fn().mockResolvedValue([result]),
    findOne: jest.fn().mockResolvedValue(result),
    update: jest.fn().mockResolvedValue(result),
    remove: jest.fn().mockResolvedValue(result),
  };
}

describe('CRUD controllers', () => {
  it.each([
    [CustomersController, CustomersService],
    [ProductsController, ProductsService],
    [SuppliersController, SuppliersService],
    [UsersController, UsersService],
  ])('%p delegates CRUD methods to its service', async (Controller, Service) => {
    const result = { id: 'entity-1' };
    const service = crudServiceMock(result);
    const moduleRef = await Test.createTestingModule({
      controllers: [Controller],
      providers: [{ provide: Service, useValue: service }],
    }).compile();
    const controller = moduleRef.get(Controller) as {
      create: (dto: unknown) => Promise<unknown>;
      findAll: () => Promise<unknown>;
      findOne: (id: string) => Promise<unknown>;
      update: (id: string, dto: unknown) => Promise<unknown>;
      remove: (id: string) => Promise<unknown>;
    };

    await expect(controller.create({ name: 'A' })).resolves.toBe(result);
    await expect(controller.findAll()).resolves.toEqual([result]);
    await expect(controller.findOne('entity-1')).resolves.toBe(result);
    await expect(controller.update('entity-1', { name: 'B' })).resolves.toBe(
      result,
    );
    await expect(controller.remove('entity-1')).resolves.toBe(result);

    expect(service.create).toHaveBeenCalledWith({ name: 'A' });
    expect(service.findAll).toHaveBeenCalledWith();
    expect(service.findOne).toHaveBeenCalledWith('entity-1');
    expect(service.update).toHaveBeenCalledWith('entity-1', { name: 'B' });
    expect(service.remove).toHaveBeenCalledWith('entity-1');
  });
});

describe('SaleOrdersController', () => {
  it('delegates all order operations to SaleOrdersService', async () => {
    const result = { id: 'sale-order-1' };
    const service = {
      ...crudServiceMock(result),
      confirm: jest.fn().mockResolvedValue(result),
      cancel: jest.fn().mockResolvedValue(result),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [SaleOrdersController],
      providers: [{ provide: SaleOrdersService, useValue: service }],
    }).compile();
    const controller = moduleRef.get(SaleOrdersController);

    await expect(controller.create({ customerId: 'customer-1' } as never)).resolves.toBe(result);
    await expect(controller.findAll()).resolves.toEqual([result]);
    await expect(controller.findOne('sale-order-1')).resolves.toBe(result);
    await expect(controller.update('sale-order-1', { items: [] } as never)).resolves.toBe(
      result,
    );
    await expect(controller.remove('sale-order-1')).resolves.toBe(result);
    await expect(controller.confirm('sale-order-1')).resolves.toBe(result);
    await expect(controller.cancel('sale-order-1')).resolves.toBe(result);

    expect(service.confirm).toHaveBeenCalledWith('sale-order-1');
    expect(service.cancel).toHaveBeenCalledWith('sale-order-1');
  });
});

describe('PurchaseOrdersController', () => {
  it('delegates purchase order operations to PurchaseOrdersService', async () => {
    const result = { id: 'purchase-order-1' };
    const service = {
      create: jest.fn().mockResolvedValue(result),
      findAll: jest.fn().mockResolvedValue([result]),
      findOne: jest.fn().mockResolvedValue(result),
      remove: jest.fn().mockResolvedValue(result),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [PurchaseOrdersController],
      providers: [{ provide: PurchaseOrdersService, useValue: service }],
    }).compile();
    const controller = moduleRef.get(PurchaseOrdersController);

    await expect(controller.create({ supplierId: 'supplier-1' } as never)).resolves.toBe(result);
    await expect(controller.findAll()).resolves.toEqual([result]);
    await expect(controller.findOne('purchase-order-1')).resolves.toBe(result);
    await expect(controller.remove('purchase-order-1')).resolves.toBe(result);

    expect(service.create).toHaveBeenCalledWith({ supplierId: 'supplier-1' });
    expect(service.findOne).toHaveBeenCalledWith('purchase-order-1');
    expect(service.remove).toHaveBeenCalledWith('purchase-order-1');
  });
});
