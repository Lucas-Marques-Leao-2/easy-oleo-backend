import { CreateCustomerDto } from "../src/customers/schemas/create-customer.dto";
import { UpdateCustomerDto } from "../src/customers/schemas/update-customer.dto";
import { CreateProductDto } from "../src/products/schemas/create-product.dto";
import { UpdateProductDto } from "../src/products/schemas/update-product.dto";
import { CreatePurchaseOrderDto } from "../src/purchase-orders/schemas/create-purchase-order.dto";
import { CreateSaleOrderDto } from "../src/sale-orders/schemas/create-sale-order.dto";
import { UpdateSaleOrderDto } from "../src/sale-orders/schemas/update-sale-order.dto";
import { CreateSupplierDto } from "../src/suppliers/schemas/create-supplier.dto";
import { UpdateSupplierDto } from "../src/suppliers/schemas/update-supplier.dto";
import { CreateUserDto } from "../src/users/schemas/create-user.dto";
import { UpdateUserDto } from "../src/users/schemas/update-user.dto";
import { expectInvalidDto, validateDto } from "./lib/validate-dto";

describe("DTO validation (class-validator)", () => {
  it("accepts valid create payloads", async () => {
    const customer = await validateDto(CreateCustomerDto, {
      type: "PJ",
      name: "Auto Peças Maceió Ltda",
      document: "11222333000181",
      street: "Av. Álvaro Otacílio",
      number: "4512",
      city: "Maceió",
      state: "AL",
      zipCode: "57035290",
      email: "compras@autopecasmaceio.com.br",
      phones: ["82999998888"],
    });
    expect(customer).toMatchObject({ type: "PJ" });

    const supplier = await validateDto(CreateSupplierDto, {
      legalName: "Distribuidora Lubrificantes Nordeste S.A.",
      cnpj: "11222333000181",
      street: "Rodovia BR-104",
      number: "Km 12",
      city: "Maceió",
      state: "AL",
      zipCode: "57081065",
      email: "vendas@lubnordeste.com.br",
    });
    expect(supplier).toMatchObject({ cnpj: "11222333000181" });

    const user = await validateDto(CreateUserDto, {
      name: "Carla Administradora",
      cpf: "52998224725",
      street: "Rua Principal",
      number: "100",
      city: "Maceió",
      state: "AL",
      zipCode: "57020000",
      email: "carla@easyoleo.local",
    });
    expect(user).toMatchObject({ cpf: "52998224725" });
    expect(user.role).toBeUndefined();

    const product = await validateDto(CreateProductDto, {
      code: "OLEO-5W30-1L",
      name: "Óleo motor sintético 5W30",
      brand: "Mobil",
      type: "óleo lubrificante",
      unit: "L",
      salePrice: "45.9",
      stockQuantity: "120",
      minStock: "24",
    });
    expect(product).toMatchObject({ salePrice: 45.9, stockQuantity: 120 });
  });

  it("validates order payloads and coerces dates/numbers", async () => {
    const sale = await validateDto(CreateSaleOrderDto, {
      orderDate: "2026-04-20",
      customerId: "cm8cust01abcd",
      createdByUserId: "cm8user01abcd",
      items: [{ productId: "cm8prod01abcd", quantity: "2" }],
    });
    const purchase = await validateDto(CreatePurchaseOrderDto, {
      purchaseDate: "2026-04-20",
      supplierId: "cm8sup01abcd",
      registeredByUserId: "cm8user01abcd",
      items: [{ productId: "cm8prod01abcd", quantity: "48", unitCost: "32.5" }],
    });

    expect(sale.orderDate).toBeInstanceOf(Date);
    expect(sale.items[0].quantity).toBe(2);
    expect(purchase.purchaseDate).toBeInstanceOf(Date);
    expect(purchase.items[0].unitCost).toBe(32.5);
  });

  it("rejects invalid required fields", async () => {
    await expectInvalidDto(CreateCustomerDto, { document: "123" });
    await expectInvalidDto(CreateSupplierDto, { cnpj: "11111111111111" });
    await expectInvalidDto(CreateUserDto, { email: "not-an-email" });
    await expectInvalidDto(CreateProductDto, { salePrice: -1 });
    await expectInvalidDto(CreateSaleOrderDto, {
      customerId: "cm8cust01abcd",
      createdByUserId: "cm8user01abcd",
      items: [],
    });
  });

  it("allows partial update payloads", async () => {
    const customer = await validateDto(UpdateCustomerDto, { name: "Novo" });
    expect(customer).toMatchObject({ name: "Novo" });

    const supplier = await validateDto(UpdateSupplierDto, { city: "Maceió" });
    expect(supplier).toMatchObject({ city: "Maceió" });

    const user = await validateDto(UpdateUserDto, { name: "Novo nome" });
    expect(user).toMatchObject({ name: "Novo nome" });

    const saleOrder = await validateDto(UpdateSaleOrderDto, {});
    expect(saleOrder).toEqual({});

    const product = await validateDto(UpdateProductDto, { minStock: "5" });
    expect(product).toMatchObject({ minStock: 5 });
  });

  it("rejects immutable fields on update DTOs", async () => {
    await expectInvalidDto(UpdateCustomerDto, { document: "11222333000181" });
    await expectInvalidDto(UpdateSupplierDto, { cnpj: "11222333000181" });
    await expectInvalidDto(UpdateUserDto, { cpf: "52998224725" });
    await expectInvalidDto(UpdateSaleOrderDto, {
      createdByUserId: "cm8user01abcd",
    });
  });
});
