import { CreateCustomerDto } from "../../src/customers/schemas/create-customer.dto";
import { CreateSupplierDto } from "../../src/suppliers/schemas/create-supplier.dto";
import { CreateUserDto } from "../../src/users/schemas/create-user.dto";
import {
  expectValidationErrors,
  expectValidationProperty,
  validateDto,
} from "../lib/validate-dto";

const VALID_CPF = "52998224725";
const VALID_CNPJ = "11222333000181";

function validUserBase() {
  return {
    name: "Carla Administradora",
    cpf: VALID_CPF,
    street: "Rua Principal",
    number: "100",
    city: "Maceió",
    state: "AL",
    zipCode: "57020000",
    email: "carla@easyoleo.local",
  };
}

function validCustomerBase() {
  return {
    name: "Auto Peças Maceió Ltda",
    document: VALID_CNPJ,
    street: "Av. Álvaro Otacílio",
    number: "4512",
    city: "Maceió",
    state: "AL",
    zipCode: "57035290",
    email: "compras@autopecasmaceio.com.br",
  };
}

function validSupplierBase() {
  return {
    legalName: "Distribuidora Lubrificantes Nordeste S.A.",
    cnpj: VALID_CNPJ,
    street: "Rodovia BR-104",
    number: "Km 12",
    city: "Maceió",
    state: "AL",
    zipCode: "57081065",
    email: "vendas@lubnordeste.com.br",
  };
}

describe("Brazilian document DTO validation", () => {
  describe("CPF (CreateUserDto)", () => {
    it("accepts valid CPF digits as string", async () => {
      const dto = await validateDto(CreateUserDto, validUserBase());
      expect(dto.cpf).toBe(VALID_CPF);
      expect(typeof dto.cpf).toBe("string");
    });

    it.each([
      ["formatted with dots/dashes", "529.982.247-25"],
      ["10 digits", "5299822472"],
      ["12 digits", "529982247251"],
      ["all same digits", "11111111111"],
      ["invalid check digits", "52998224720"],
    ])("rejects CPF: %s", async (_label, cpf) => {
      await expectValidationErrors(CreateUserDto, { ...validUserBase(), cpf }, [
        "CPF inválido.",
      ]);
    });

    it.each([["null", null]])("rejects CPF as %s", async (_label, cpf) => {
      await expectValidationProperty(
        CreateUserDto,
        { ...validUserBase(), cpf },
        "cpf",
      );
    });

    it("coerces numeric CPF to string via implicit conversion", async () => {
      const dto = await validateDto(CreateUserDto, {
        ...validUserBase(),
        cpf: 52998224725 as unknown as string,
      });
      expect(dto.cpf).toBe(VALID_CPF);
      expect(typeof dto.cpf).toBe("string");
    });
  });

  describe("CNPJ (CreateSupplierDto)", () => {
    it("accepts valid CNPJ digits as string", async () => {
      const dto = await validateDto(CreateSupplierDto, validSupplierBase());
      expect(dto.cnpj).toBe(VALID_CNPJ);
      expect(typeof dto.cnpj).toBe("string");
    });

    it.each([
      ["formatted", "11.222.333/0001-81"],
      ["13 digits", "1122233300018"],
      ["15 digits", "112223330001811"],
      ["all same digits", "11111111111111"],
      ["invalid check digits", "11222333000180"],
    ])("rejects CNPJ: %s", async (_label, cnpj) => {
      await expectValidationErrors(
        CreateSupplierDto,
        { ...validSupplierBase(), cnpj },
        ["CNPJ inválido."],
      );
    });
  });

  describe("Customer document (CreateCustomerDto)", () => {
    it("accepts valid CPF document", async () => {
      const dto = await validateDto(CreateCustomerDto, {
        ...validCustomerBase(),
        document: VALID_CPF,
      });
      expect(dto.document).toBe(VALID_CPF);
    });

    it("accepts valid CNPJ document", async () => {
      const dto = await validateDto(CreateCustomerDto, validCustomerBase());
      expect(dto.document).toBe(VALID_CNPJ);
    });

    it.each([
      ["10 digits", "1234567890"],
      ["12 digits", "123456789012"],
      ["13 digits", "1234567890123"],
      ["15 digits", "123456789012345"],
    ])("rejects document with %s", async (_label, document) => {
      await expectValidationErrors(
        CreateCustomerDto,
        { ...validCustomerBase(), document },
        ["Informe CPF (11 dígitos) ou CNPJ (14 dígitos), só números."],
      );
    });

    it("accepts formatted CPF document by stripping non-digits", async () => {
      const dto = await validateDto(CreateCustomerDto, {
        ...validCustomerBase(),
        document: "529.982.247-25",
      });
      expect(dto.document).toBe("529.982.247-25");
    });

    it("rejects invalid CPF check digits with CPF message", async () => {
      await expectValidationErrors(
        CreateCustomerDto,
        { ...validCustomerBase(), document: "11111111111" },
        ["CPF inválido."],
      );
    });

    it("rejects invalid CNPJ check digits with CNPJ message", async () => {
      await expectValidationErrors(
        CreateCustomerDto,
        { ...validCustomerBase(), document: "11222333000180" },
        ["CNPJ inválido."],
      );
    });

    it("coerces numeric document to string via implicit conversion", async () => {
      const dto = await validateDto(CreateCustomerDto, {
        ...validCustomerBase(),
        document: 11222333000181 as unknown as string,
      });
      expect(dto.document).toBe(VALID_CNPJ);
    });
  });
});
