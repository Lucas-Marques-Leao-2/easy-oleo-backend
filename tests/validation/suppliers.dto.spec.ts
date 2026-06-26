import { CreateSupplierDto } from "../../src/suppliers/schemas/create-supplier.dto";
import { UpdateSupplierDto } from "../../src/suppliers/schemas/update-supplier.dto";
import {
  expectInvalidDto,
  expectValidationErrors,
  expectValidationProperty,
  validateDto,
} from "../lib/validate-dto";

const VALID_CNPJ = "11222333000181";
const VALID_PHONE = "82991112233";

function validCreateSupplier(overrides: Partial<CreateSupplierDto> = {}) {
  return {
    legalName: "Distribuidora Lubrificantes Nordeste S.A.",
    cnpj: VALID_CNPJ,
    street: "Rodovia BR-104",
    number: "Km 12",
    city: "Maceió",
    state: "AL",
    zipCode: "57081065",
    email: "vendas@lubnordeste.com.br",
    ...overrides,
  };
}

const REQUIRED_FIELDS = [
  "legalName",
  "cnpj",
  "street",
  "number",
  "city",
  "state",
  "zipCode",
  "email",
] as const;

describe("CreateSupplierDto", () => {
  describe("A. Happy path", () => {
    it("accepts minimal valid payload", async () => {
      const dto = await validateDto(CreateSupplierDto, validCreateSupplier());
      expect(dto.cnpj).toBe(VALID_CNPJ);
      expect(typeof dto.cnpj).toBe("string");
    });

    it("accepts full valid payload with optional fields", async () => {
      const dto = await validateDto(
        CreateSupplierDto,
        validCreateSupplier({
          complement: "Anexo expedição",
          district: "Tabuleiro do Martins",
          phones: [VALID_PHONE],
        }),
      );
      expect(dto.complement).toBe("Anexo expedição");
      expect(dto.phones).toEqual([VALID_PHONE]);
    });
  });

  describe("B. Type coercion", () => {
    it("keeps CNPJ as string digits", async () => {
      const dto = await validateDto(CreateSupplierDto, validCreateSupplier());
      expect(dto.cnpj).toBe(VALID_CNPJ);
      expect(typeof dto.cnpj).toBe("string");
    });
  });

  describe("C. Required field absence", () => {
    it("rejects empty object", async () => {
      await expectInvalidDto(CreateSupplierDto, {});
    });

    it.each(REQUIRED_FIELDS)("rejects when %s is missing", async (field) => {
      const payload = validCreateSupplier();
      delete (payload as Record<string, unknown>)[field];
      await expectValidationProperty(CreateSupplierDto, payload, field);
    });
  });

  describe("D. Invalid types", () => {
    it("rejects null legalName", async () => {
      await expectValidationProperty(
        CreateSupplierDto,
        validCreateSupplier({ legalName: null as unknown as string }),
        "legalName",
      );
    });

    it("coerces numeric cnpj to string via implicit conversion", async () => {
      const dto = await validateDto(
        CreateSupplierDto,
        validCreateSupplier({ cnpj: 11222333000181 as unknown as string }),
      );
      expect(dto.cnpj).toBe(VALID_CNPJ);
      expect(typeof dto.cnpj).toBe("string");
    });
  });

  describe("E. Boundary values", () => {
    it("rejects empty legalName", async () => {
      await expectValidationProperty(
        CreateSupplierDto,
        validCreateSupplier({ legalName: "" }),
        "legalName",
      );
    });

    it("rejects legalName with 301 characters", async () => {
      await expectValidationProperty(
        CreateSupplierDto,
        validCreateSupplier({ legalName: "a".repeat(301) }),
        "legalName",
      );
    });

    it("accepts legalName with 300 characters", async () => {
      const dto = await validateDto(
        CreateSupplierDto,
        validCreateSupplier({ legalName: "a".repeat(300) }),
      );
      expect(dto.legalName).toHaveLength(300);
    });

    it.each([
      ["1 char state", "A"],
      ["3 char state", "ALL"],
    ])("rejects %s", async (_label, state) => {
      await expectValidationProperty(
        CreateSupplierDto,
        validCreateSupplier({ state }),
        "state",
      );
    });

    it("rejects zipCode shorter than 8", async () => {
      await expectValidationProperty(
        CreateSupplierDto,
        validCreateSupplier({ zipCode: "5708106" }),
        "zipCode",
      );
    });

    it("rejects zipCode longer than 9", async () => {
      await expectValidationProperty(
        CreateSupplierDto,
        validCreateSupplier({ zipCode: "5708106500" }),
        "zipCode",
      );
    });
  });

  describe("F. Format validation", () => {
    it.each([
      ["missing @", "vendas.lubnordeste.com"],
      ["missing domain", "vendas@"],
      ["with spaces", "vendas @lubnordeste.com"],
    ])("rejects email: %s", async (_label, email) => {
      await expectValidationErrors(
        CreateSupplierDto,
        validCreateSupplier({ email }),
        ["E-mail inválido."],
      );
    });

    it("rejects invalid CNPJ", async () => {
      await expectValidationErrors(
        CreateSupplierDto,
        validCreateSupplier({ cnpj: "11111111111111" }),
        ["CNPJ inválido."],
      );
    });
  });

  describe("G. Whitelist / forbidNonWhitelisted", () => {
    it("rejects unknown extra properties", async () => {
      await expectValidationErrors(
        CreateSupplierDto,
        { ...validCreateSupplier(), extra: 1 },
        [/property extra should not exist/],
      );
    });
  });
});

describe("UpdateSupplierDto", () => {
  describe("I. Partial update semantics", () => {
    it("accepts empty object", async () => {
      const dto = await validateDto(UpdateSupplierDto, {});
      expect(dto).toEqual({});
    });

    it("accepts single field update", async () => {
      const dto = await validateDto(UpdateSupplierDto, { city: "Maceió" });
      expect(dto.city).toBe("Maceió");
    });
  });

  describe("G. Whitelist / forbidNonWhitelisted", () => {
    it("rejects immutable cnpj field", async () => {
      await expectValidationErrors(UpdateSupplierDto, { cnpj: VALID_CNPJ }, [
        /property cnpj should not exist/,
      ]);
    });
  });
});
