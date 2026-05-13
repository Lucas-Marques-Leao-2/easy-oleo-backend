import { createCustomerDto } from "../src/customers/schemas/create-customer.dto";
import { updateCustomerDto } from "../src/customers/schemas/update-customer.dto";
import { createProductDto } from "../src/products/schemas/create-product.dto";
import { updateProductDto } from "../src/products/schemas/update-product.dto";
import { createPurchaseOrderDto } from "../src/purchase-orders/schemas/create-purchase-order.dto";
import { createSaleOrderDto } from "../src/sale-orders/schemas/create-sale-order.dto";
import { updateSaleOrderDto } from "../src/sale-orders/schemas/update-sale-order.dto";
import { createSupplierDto } from "../src/suppliers/schemas/create-supplier.dto";
import { updateSupplierDto } from "../src/suppliers/schemas/update-supplier.dto";
import { createUserDto } from "../src/users/schemas/create-user.dto";
import { updateUserDto } from "../src/users/schemas/update-user.dto";

describe("DTO schemas", () => {
  it("accepts valid create payloads", () => {
    expect(
      createCustomerDto.parse({
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
      }),
    ).toMatchObject({ type: "PJ" });
    expect(
      createSupplierDto.parse({
        legalName: "Distribuidora Lubrificantes Nordeste S.A.",
        cnpj: "11222333000181",
        street: "Rodovia BR-104",
        number: "Km 12",
        city: "Maceió",
        state: "AL",
        zipCode: "57081065",
        email: "vendas@lubnordeste.com.br",
      }),
    ).toMatchObject({ cnpj: "11222333000181" });
    const parsedUser = createUserDto.parse({
      name: "Carla Administradora",
      cpf: "52998224725",
      street: "Rua Principal",
      number: "100",
      city: "Maceió",
      state: "AL",
      zipCode: "57020000",
      email: "carla@easyoleo.local",
    });
    expect(parsedUser).toMatchObject({ cpf: "52998224725" });
    expect(parsedUser).not.toHaveProperty("role");
    expect(
      createProductDto.parse({
        code: "OLEO-5W30-1L",
        name: "Óleo motor sintético 5W30",
        brand: "Mobil",
        type: "óleo lubrificante",
        unit: "L",
        salePrice: "45.9",
        stockQuantity: "120",
        minStock: "24",
      }),
    ).toMatchObject({ salePrice: 45.9, stockQuantity: 120 });
  });

  it("validates order payloads and coerces dates/numbers", () => {
    const sale = createSaleOrderDto.parse({
      orderDate: "2026-04-20",
      customerId: "customer-1",
      createdByUserId: "user-1",
      items: [{ productId: "product-1", quantity: "2" }],
    });
    const purchase = createPurchaseOrderDto.parse({
      purchaseDate: "2026-04-20",
      supplierId: "supplier-1",
      registeredByUserId: "user-1",
      items: [{ productId: "product-1", quantity: "48", unitCost: "32.5" }],
    });

    expect(sale.orderDate).toBeInstanceOf(Date);
    expect(sale.items[0].quantity).toBe(2);
    expect(purchase.purchaseDate).toBeInstanceOf(Date);
    expect(purchase.items[0].unitCost).toBe(32.5);
  });

  it("rejects invalid required fields", () => {
    expect(() => createCustomerDto.parse({ document: "123" })).toThrow();
    expect(() => createSupplierDto.parse({ cnpj: "11111111111111" })).toThrow();
    expect(() => createUserDto.parse({ email: "not-an-email" })).toThrow();
    expect(() => createProductDto.parse({ salePrice: -1 })).toThrow();
    expect(() =>
      createSaleOrderDto.parse({
        customerId: "customer-1",
        createdByUserId: "user-1",
        items: [],
      }),
    ).toThrow();
  });

  it("allows partial update payloads while omitting immutable fields", () => {
    expect(
      updateCustomerDto.parse({ document: "ignored", name: "Novo" }),
    ).toEqual({
      name: "Novo",
    });
    expect(
      updateSupplierDto.parse({ cnpj: "ignored", city: "Maceió" }),
    ).toEqual({
      city: "Maceió",
    });
    expect(updateUserDto.parse({ cpf: "ignored", name: "Novo nome" })).toEqual({
      name: "Novo nome",
    });
    expect(updateSaleOrderDto.parse({ createdByUserId: "ignored" })).toEqual(
      {},
    );
    expect(updateProductDto.parse({ minStock: "5" })).toEqual({ minStock: 5 });
  });
});
