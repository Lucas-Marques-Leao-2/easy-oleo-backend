import { CreateProductDto } from "../../src/products/schemas/create-product.dto";
import { UpdateProductDto } from "../../src/products/schemas/update-product.dto";
import {
  expectInvalidDto,
  expectValidationErrors,
  expectValidationProperty,
  validateDto,
} from "../lib/validate-dto";

function validCreateProduct(overrides: Partial<CreateProductDto> = {}) {
  return {
    code: "OLEO-5W30-1L",
    name: "Óleo motor sintético 5W30",
    brand: "Mobil",
    type: "óleo lubrificante",
    unit: "L",
    salePrice: 45.9,
    stockQuantity: 120,
    minStock: 24,
    ...overrides,
  };
}

const REQUIRED_FIELDS = [
  "code",
  "name",
  "brand",
  "type",
  "unit",
  "salePrice",
  "stockQuantity",
  "minStock",
] as const;

describe("CreateProductDto", () => {
  describe("A. Happy path", () => {
    it("accepts minimal valid payload", async () => {
      const dto = await validateDto(CreateProductDto, validCreateProduct());
      expect(dto.salePrice).toBe(45.9);
      expect(dto.stockQuantity).toBe(120);
      expect(dto.minStock).toBe(24);
    });

    it("accepts full valid payload with optional viscosity", async () => {
      const dto = await validateDto(
        CreateProductDto,
        validCreateProduct({ viscosity: "5W-30" }),
      );
      expect(dto.viscosity).toBe("5W-30");
    });
  });

  describe("B. Type coercion", () => {
    it("coerces string decimals to numbers", async () => {
      const dto = await validateDto(
        CreateProductDto,
        validCreateProduct({
          salePrice: "45.9" as unknown as number,
          stockQuantity: "120" as unknown as number,
          minStock: "24" as unknown as number,
        }),
      );
      expect(dto.salePrice).toBe(45.9);
      expect(typeof dto.salePrice).toBe("number");
      expect(dto.stockQuantity).toBe(120);
      expect(dto.minStock).toBe(24);
    });

    it("coerces string integers to numbers", async () => {
      const dto = await validateDto(
        CreateProductDto,
        validCreateProduct({
          stockQuantity: "50" as unknown as number,
          minStock: "10" as unknown as number,
        }),
      );
      expect(dto.stockQuantity).toBe(50);
      expect(dto.minStock).toBe(10);
    });
  });

  describe("C. Required field absence", () => {
    it("rejects empty object", async () => {
      await expectInvalidDto(CreateProductDto, {});
    });

    it.each(REQUIRED_FIELDS)("rejects when %s is missing", async (field) => {
      const payload = validCreateProduct();
      delete (payload as Record<string, unknown>)[field];
      await expectValidationProperty(CreateProductDto, payload, field);
    });
  });

  describe("D. Invalid types", () => {
    it("rejects null code", async () => {
      await expectValidationProperty(
        CreateProductDto,
        validCreateProduct({ code: null as unknown as string }),
        "code",
      );
    });

    it("rejects string as salePrice", async () => {
      await expectValidationProperty(
        CreateProductDto,
        validCreateProduct({ salePrice: "not-a-number" as unknown as number }),
        "salePrice",
      );
    });
  });

  describe("E. Boundary values", () => {
    it("rejects empty code", async () => {
      await expectValidationProperty(
        CreateProductDto,
        validCreateProduct({ code: "" }),
        "code",
      );
    });

    it("rejects salePrice of 0", async () => {
      await expectValidationProperty(
        CreateProductDto,
        validCreateProduct({ salePrice: 0 }),
        "salePrice",
      );
    });

    it("rejects negative salePrice", async () => {
      await expectValidationProperty(
        CreateProductDto,
        validCreateProduct({ salePrice: -1 }),
        "salePrice",
      );
    });

    it("rejects negative stockQuantity", async () => {
      await expectValidationProperty(
        CreateProductDto,
        validCreateProduct({ stockQuantity: -1 }),
        "stockQuantity",
      );
    });

    it("rejects negative minStock", async () => {
      await expectValidationProperty(
        CreateProductDto,
        validCreateProduct({ minStock: -1 }),
        "minStock",
      );
    });

    it("accepts stockQuantity and minStock of 0", async () => {
      const dto = await validateDto(
        CreateProductDto,
        validCreateProduct({ stockQuantity: 0, minStock: 0 }),
      );
      expect(dto.stockQuantity).toBe(0);
      expect(dto.minStock).toBe(0);
    });
  });

  describe("G. Whitelist / forbidNonWhitelisted", () => {
    it("rejects unknown extra properties", async () => {
      await expectValidationErrors(
        CreateProductDto,
        { ...validCreateProduct(), unknown: true },
        [/property unknown should not exist/],
      );
    });
  });
});

describe("UpdateProductDto", () => {
  describe("I. Partial update semantics", () => {
    it("accepts empty object", async () => {
      const dto = await validateDto(UpdateProductDto, {});
      expect(dto).toEqual({});
    });

    it("accepts single field update with coercion", async () => {
      const dto = await validateDto(UpdateProductDto, { minStock: "5" });
      expect(dto.minStock).toBe(5);
      expect(typeof dto.minStock).toBe("number");
    });
  });

  describe("E. Boundary values on partial update", () => {
    it("rejects negative salePrice on update", async () => {
      await expectValidationProperty(
        UpdateProductDto,
        { salePrice: -5 },
        "salePrice",
      );
    });
  });
});
