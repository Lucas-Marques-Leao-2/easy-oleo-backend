import { CreateCustomerDto } from "../../src/customers/schemas/create-customer.dto";
import { CreateSupplierDto } from "../../src/suppliers/schemas/create-supplier.dto";
import { CreateUserDto } from "../../src/users/schemas/create-user.dto";
import {
  expectValidationErrors,
  expectValidationProperty,
  validateDto,
} from "../lib/validate-dto";

const VALID_PHONE = "82991112233";
const PHONE_MESSAGE = "Telefone: 11 dígitos com DDD.";

function validUser() {
  return {
    name: "Carla Administradora",
    cpf: "52998224725",
    street: "Rua Principal",
    number: "100",
    city: "Maceió",
    state: "AL",
    zipCode: "57020000",
    email: "carla@easyoleo.local",
    phones: [VALID_PHONE],
  };
}

function validCustomer() {
  return {
    name: "Auto Peças Maceió Ltda",
    document: "11222333000181",
    street: "Av. Álvaro Otacílio",
    number: "4512",
    city: "Maceió",
    state: "AL",
    zipCode: "57035290",
    email: "compras@autopecasmaceio.com.br",
    phones: [VALID_PHONE],
  };
}

function validSupplier() {
  return {
    legalName: "Distribuidora Lubrificantes Nordeste S.A.",
    cnpj: "11222333000181",
    street: "Rodovia BR-104",
    number: "Km 12",
    city: "Maceió",
    state: "AL",
    zipCode: "57081065",
    email: "vendas@lubnordeste.com.br",
    phones: [VALID_PHONE],
  };
}

describe.each([
  ["CreateUserDto", CreateUserDto, validUser],
  ["CreateCustomerDto", CreateCustomerDto, validCustomer],
  ["CreateSupplierDto", CreateSupplierDto, validSupplier],
])("Phone fields (%s)", (_label, DtoClass, factory) => {
  describe("A. Happy path", () => {
    it("accepts valid 11-digit phone array", async () => {
      const dto = await validateDto(DtoClass, factory());
      expect(dto.phones).toEqual([VALID_PHONE]);
    });

    it("allows omitting phones", async () => {
      const { phones: _phones, ...withoutPhones } = factory();
      const dto = await validateDto(DtoClass, withoutPhones);
      expect(dto.phones).toBeUndefined();
    });
  });

  describe("D. Invalid types", () => {
    it("rejects phones as string instead of array", async () => {
      await expectValidationProperty(
        DtoClass,
        { ...factory(), phones: VALID_PHONE },
        "phones",
      );
    });

    it("accepts null phones because field is optional", async () => {
      const dto = await validateDto(DtoClass, { ...factory(), phones: null });
      expect(dto.phones).toBeNull();
    });
  });

  describe("F. Format validation", () => {
    it.each([
      ["10 digits", "8299111223"],
      ["12 digits", "829911122333"],
      ["with letters", "8299111223a"],
      ["with formatting", "(82) 99111-2233"],
    ])("rejects phone: %s", async (_label, phone) => {
      await expectValidationErrors(
        DtoClass,
        { ...factory(), phones: [phone] },
        [PHONE_MESSAGE],
      );
    });

    it("rejects mixed valid and invalid phones", async () => {
      await expectValidationErrors(
        DtoClass,
        { ...factory(), phones: [VALID_PHONE, "123"] },
        [PHONE_MESSAGE],
      );
    });
  });
});
