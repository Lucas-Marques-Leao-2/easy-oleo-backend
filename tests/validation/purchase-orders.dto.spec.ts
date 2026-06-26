import { CreatePurchaseOrderDto } from "../../src/purchase-orders/schemas/create-purchase-order.dto";
import { PurchaseOrderLineDto } from "../../src/purchase-orders/schemas/purchase-order-line.dto";
import {
  expectInvalidDto,
  expectValidationErrors,
  expectValidationProperty,
  validateDto,
} from "../lib/validate-dto";

const VALID_SUPPLIER_ID = "cm8sup01abcd";
const VALID_USER_ID = "cm8user01abcd";
const VALID_PRODUCT_ID = "cm8prod01abcd";

function validPurchaseOrderLine(
  overrides: Partial<PurchaseOrderLineDto> = {},
): PurchaseOrderLineDto {
  return {
    productId: VALID_PRODUCT_ID,
    quantity: 48,
    unitCost: 32.5,
    ...overrides,
  };
}

function validCreatePurchaseOrder(
  overrides: Partial<CreatePurchaseOrderDto> = {},
) {
  return {
    supplierId: VALID_SUPPLIER_ID,
    registeredByUserId: VALID_USER_ID,
    items: [validPurchaseOrderLine()],
    ...overrides,
  };
}

describe("PurchaseOrderLineDto", () => {
  describe("A. Happy path", () => {
    it("accepts valid line and coerces numeric fields", async () => {
      const dto = await validateDto(PurchaseOrderLineDto, {
        productId: VALID_PRODUCT_ID,
        quantity: "48",
        unitCost: "32.5",
      });
      expect(dto.quantity).toBe(48);
      expect(dto.unitCost).toBe(32.5);
      expect(typeof dto.quantity).toBe("number");
      expect(typeof dto.unitCost).toBe("number");
    });
  });

  describe("E. Boundary values", () => {
    it("rejects quantity of 0", async () => {
      await expectValidationProperty(
        PurchaseOrderLineDto,
        validPurchaseOrderLine({ quantity: 0 }),
        "quantity",
      );
    });

    it("rejects negative quantity", async () => {
      await expectValidationProperty(
        PurchaseOrderLineDto,
        validPurchaseOrderLine({ quantity: -1 }),
        "quantity",
      );
    });

    it("rejects negative unitCost", async () => {
      await expectValidationProperty(
        PurchaseOrderLineDto,
        validPurchaseOrderLine({ unitCost: -0.01 }),
        "unitCost",
      );
    });

    it("accepts unitCost of 0", async () => {
      const dto = await validateDto(
        PurchaseOrderLineDto,
        validPurchaseOrderLine({ unitCost: 0 }),
      );
      expect(dto.unitCost).toBe(0);
    });
  });

  describe("F. Format validation", () => {
    it("rejects invalid productId CUID", async () => {
      await expectValidationErrors(
        PurchaseOrderLineDto,
        validPurchaseOrderLine({ productId: "12345" }),
        ["ID de produto inválido."],
      );
    });
  });
});

describe("CreatePurchaseOrderDto", () => {
  describe("A. Happy path", () => {
    it("accepts minimal valid payload", async () => {
      const dto = await validateDto(
        CreatePurchaseOrderDto,
        validCreatePurchaseOrder(),
      );
      expect(dto.supplierId).toBe(VALID_SUPPLIER_ID);
      expect(dto.items[0].unitCost).toBe(32.5);
    });

    it("accepts full valid payload with purchaseDate", async () => {
      const dto = await validateDto(
        CreatePurchaseOrderDto,
        validCreatePurchaseOrder({ purchaseDate: "2026-04-20T12:00:00.000Z" }),
      );
      expect(dto.purchaseDate).toBeInstanceOf(Date);
    });
  });

  describe("B. Type coercion", () => {
    it("coerces ISO date string to Date", async () => {
      const dto = await validateDto(
        CreatePurchaseOrderDto,
        validCreatePurchaseOrder({ purchaseDate: "2026-04-20" }),
      );
      expect(dto.purchaseDate).toBeInstanceOf(Date);
    });

    it("coerces nested quantity and unitCost strings", async () => {
      const dto = await validateDto(CreatePurchaseOrderDto, {
        ...validCreatePurchaseOrder(),
        items: [
          { productId: VALID_PRODUCT_ID, quantity: "10", unitCost: "15.75" },
        ],
      });
      expect(dto.items[0].quantity).toBe(10);
      expect(dto.items[0].unitCost).toBe(15.75);
    });
  });

  describe("C. Required field absence", () => {
    it("rejects empty object", async () => {
      await expectInvalidDto(CreatePurchaseOrderDto, {});
    });

    it("rejects missing supplierId", async () => {
      await expectValidationProperty(
        CreatePurchaseOrderDto,
        {
          registeredByUserId: VALID_USER_ID,
          items: [validPurchaseOrderLine()],
        },
        "supplierId",
      );
    });

    it("rejects missing registeredByUserId", async () => {
      await expectValidationProperty(
        CreatePurchaseOrderDto,
        {
          supplierId: VALID_SUPPLIER_ID,
          items: [validPurchaseOrderLine()],
        },
        "registeredByUserId",
      );
    });
  });

  describe("F. Format validation", () => {
    it("rejects invalid supplierId CUID", async () => {
      await expectValidationErrors(
        CreatePurchaseOrderDto,
        validCreatePurchaseOrder({ supplierId: "invalid" }),
        ["ID de fornecedor inválido."],
      );
    });

    it("rejects invalid registeredByUserId CUID", async () => {
      await expectValidationErrors(
        CreatePurchaseOrderDto,
        validCreatePurchaseOrder({ registeredByUserId: "UUID-STYLE" }),
        ["ID de usuário inválido."],
      );
    });
  });

  describe("G. Whitelist / forbidNonWhitelisted", () => {
    it("rejects unknown extra properties", async () => {
      await expectValidationErrors(
        CreatePurchaseOrderDto,
        { ...validCreatePurchaseOrder(), note: "urgent" },
        [/property note should not exist/],
      );
    });
  });

  describe("H. Nested validation", () => {
    it("rejects empty items array", async () => {
      await expectValidationProperty(
        CreatePurchaseOrderDto,
        validCreatePurchaseOrder({ items: [] }),
        "items",
      );
    });

    it("rejects item missing productId", async () => {
      await expectValidationProperty(
        CreatePurchaseOrderDto,
        {
          ...validCreatePurchaseOrder(),
          items: [{ quantity: 10, unitCost: 5 }],
        },
        "items.0.productId",
      );
    });

    it("rejects item missing quantity", async () => {
      await expectValidationProperty(
        CreatePurchaseOrderDto,
        {
          ...validCreatePurchaseOrder(),
          items: [{ productId: VALID_PRODUCT_ID, unitCost: 5 }],
        },
        "items.0.quantity",
      );
    });

    it("rejects multiple items with mixed valid/invalid unitCost", async () => {
      await expectValidationProperty(
        CreatePurchaseOrderDto,
        {
          ...validCreatePurchaseOrder(),
          items: [
            validPurchaseOrderLine(),
            validPurchaseOrderLine({ unitCost: -1 }),
          ],
        },
        "items.1.unitCost",
      );
    });
  });
});
