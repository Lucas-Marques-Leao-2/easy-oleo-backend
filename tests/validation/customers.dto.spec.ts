import { CustomerType } from "@prisma/client";

import { CreateCustomerDto } from "../../src/customers/schemas/create-customer.dto";
import { UpdateCustomerDto } from "../../src/customers/schemas/update-customer.dto";
import {
  expectInvalidDto,
  expectValidationErrors,
  expectValidationProperty,
  validateDto,
} from "../lib/validate-dto";

const VALID_CNPJ = "11222333000181";
const VALID_CPF = "52998224725";
const VALID_PHONE = "82991112233";

function validCreateCustomer(overrides: Partial<CreateCustomerDto> = {}) {
  return {
    name: "Auto Peças Maceió Ltda",
    document: VALID_CNPJ,
    street: "Av. Álvaro Otacílio",
    number: "4512",
    city: "Maceió",
    state: "AL",
    zipCode: "57035290",
    email: "compras@autopecasmaceio.com.br",
    ...overrides,
  };
}

const REQUIRED_FIELDS = [
  "name",
  "document",
  "street",
  "number",
  "city",
  "state",
  "zipCode",
  "email",
] as const;

describe("CreateCustomerDto", () => {
  describe("A. Happy path", () => {
    it("accepts minimal valid payload", async () => {
      const dto = await validateDto(CreateCustomerDto, validCreateCustomer());
      expect(dto.document).toBe(VALID_CNPJ);
      expect(typeof dto.document).toBe("string");
    });

    it("accepts full valid payload with optional fields", async () => {
      const dto = await validateDto(
        CreateCustomerDto,
        validCreateCustomer({
          type: CustomerType.PJ,
          complement: "Galpão B",
          district: "Ponta Verde",
          phones: [VALID_PHONE, "82332112345"],
        }),
      );
      expect(dto.type).toBe(CustomerType.PJ);
      expect(dto.phones).toEqual([VALID_PHONE, "82332112345"]);
    });
  });

  describe("B. Type coercion", () => {
    it("keeps document as string digits", async () => {
      const dto = await validateDto(CreateCustomerDto, validCreateCustomer());
      expect(dto.document).toBe(VALID_CNPJ);
      expect(typeof dto.document).toBe("string");
    });
  });

  describe("C. Required field absence", () => {
    it("rejects empty object", async () => {
      await expectInvalidDto(CreateCustomerDto, {});
    });

    it.each(REQUIRED_FIELDS)("rejects when %s is missing", async (field) => {
      const payload = validCreateCustomer();
      delete (payload as Record<string, unknown>)[field];
      await expectValidationProperty(CreateCustomerDto, payload, field);
    });
  });

  describe("D. Invalid types", () => {
    it("rejects null name", async () => {
      await expectValidationProperty(
        CreateCustomerDto,
        validCreateCustomer({ name: null as unknown as string }),
        "name",
      );
    });

    it("coerces numeric document to string via implicit conversion", async () => {
      const dto = await validateDto(
        CreateCustomerDto,
        validCreateCustomer({ document: 11222333000181 as unknown as string }),
      );
      expect(dto.document).toBe(VALID_CNPJ);
      expect(typeof dto.document).toBe("string");
    });
  });

  describe("E. Boundary values", () => {
    it("rejects empty name", async () => {
      await expectValidationErrors(
        CreateCustomerDto,
        validCreateCustomer({ name: "" }),
        ["Nome ou razão social não pode ser vazio."],
      );
    });

    it("rejects name with 301 characters", async () => {
      await expectValidationProperty(
        CreateCustomerDto,
        validCreateCustomer({ name: "a".repeat(301) }),
        "name",
      );
    });

    it("accepts name with 300 characters", async () => {
      const dto = await validateDto(
        CreateCustomerDto,
        validCreateCustomer({ name: "a".repeat(300) }),
      );
      expect(dto.name).toHaveLength(300);
    });

    it.each([
      ["1 char state", "A"],
      ["3 char state", "ALL"],
    ])("rejects %s", async (_label, state) => {
      await expectValidationProperty(
        CreateCustomerDto,
        validCreateCustomer({ state }),
        "state",
      );
    });

    it("rejects zipCode shorter than 8", async () => {
      await expectValidationProperty(
        CreateCustomerDto,
        validCreateCustomer({ zipCode: "5703529" }),
        "zipCode",
      );
    });

    it("rejects zipCode longer than 9", async () => {
      await expectValidationProperty(
        CreateCustomerDto,
        validCreateCustomer({ zipCode: "5703529000" }),
        "zipCode",
      );
    });
  });

  describe("F. Format validation", () => {
    it.each([
      ["missing @", "compras.autopecas.com"],
      ["missing domain", "compras@"],
      ["with spaces", "compras @autopecas.com"],
    ])("rejects email: %s", async (_label, email) => {
      await expectValidationErrors(
        CreateCustomerDto,
        validCreateCustomer({ email }),
        ["E-mail inválido."],
      );
    });

    it("rejects invalid customer type", async () => {
      await expectValidationErrors(
        CreateCustomerDto,
        validCreateCustomer({ type: "XX" as CustomerType }),
        ["Tipo inválido."],
      );
    });

    it("accepts CPF document path", async () => {
      const dto = await validateDto(
        CreateCustomerDto,
        validCreateCustomer({ document: VALID_CPF, type: CustomerType.PF }),
      );
      expect(dto.document).toBe(VALID_CPF);
    });
  });

  describe("G. Whitelist / forbidNonWhitelisted", () => {
    it("rejects unknown extra properties", async () => {
      await expectValidationErrors(
        CreateCustomerDto,
        { ...validCreateCustomer(), foo: "bar" },
        [/property foo should not exist/],
      );
    });
  });
});

describe("UpdateCustomerDto", () => {
  describe("I. Partial update semantics", () => {
    it("accepts empty object", async () => {
      const dto = await validateDto(UpdateCustomerDto, {});
      expect(dto).toEqual({});
    });

    it("accepts single field update", async () => {
      const dto = await validateDto(UpdateCustomerDto, { name: "Novo" });
      expect(dto.name).toBe("Novo");
    });
  });

  describe("G. Whitelist / forbidNonWhitelisted", () => {
    it("rejects immutable document field", async () => {
      await expectValidationErrors(
        UpdateCustomerDto,
        { document: VALID_CNPJ },
        [/property document should not exist/],
      );
    });
  });
});
