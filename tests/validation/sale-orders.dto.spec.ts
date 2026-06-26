import { CreateSaleOrderDto } from "../../src/sale-orders/schemas/create-sale-order.dto";
import { SaleOrderLineDto } from "../../src/sale-orders/schemas/sale-order-line.dto";
import { UpdateSaleOrderDto } from "../../src/sale-orders/schemas/update-sale-order.dto";
import {
  expectInvalidDto,
  expectValidationErrors,
  expectValidationProperty,
  validateDto,
} from "../lib/validate-dto";

const VALID_CUSTOMER_ID = "cm8cust01abcd";
const VALID_USER_ID = "cm8user01abcd";
const VALID_PRODUCT_ID = "cm8prod01abcd";

function validSaleOrderLine(
  overrides: Partial<SaleOrderLineDto> = {},
): SaleOrderLineDto {
  return {
    productId: VALID_PRODUCT_ID,
    quantity: 2,
    ...overrides,
  };
}

function validCreateSaleOrder(overrides: Partial<CreateSaleOrderDto> = {}) {
  return {
    customerId: VALID_CUSTOMER_ID,
    createdByUserId: VALID_USER_ID,
    items: [validSaleOrderLine()],
    ...overrides,
  };
}

describe("SaleOrderLineDto", () => {
  describe("A. Happy path", () => {
    it("accepts valid line and coerces quantity to number", async () => {
      const dto = await validateDto(SaleOrderLineDto, {
        productId: VALID_PRODUCT_ID,
        quantity: "2",
      });
      expect(dto.quantity).toBe(2);
      expect(typeof dto.quantity).toBe("number");
      expect(dto.productId).toBe(VALID_PRODUCT_ID);
    });
  });

  describe("E. Boundary values", () => {
    it("rejects quantity of 0", async () => {
      await expectValidationProperty(
        SaleOrderLineDto,
        validSaleOrderLine({ quantity: 0 }),
        "quantity",
      );
    });

    it("rejects negative quantity", async () => {
      await expectValidationProperty(
        SaleOrderLineDto,
        validSaleOrderLine({ quantity: -1 }),
        "quantity",
      );
    });
  });

  describe("F. Format validation", () => {
    it("rejects invalid productId CUID", async () => {
      await expectValidationErrors(
        SaleOrderLineDto,
        validSaleOrderLine({ productId: "invalid" }),
        ["ID de produto inválido."],
      );
    });

    it("rejects empty productId", async () => {
      await expectValidationProperty(
        SaleOrderLineDto,
        validSaleOrderLine({ productId: "" }),
        "productId",
      );
    });
  });
});

describe("CreateSaleOrderDto", () => {
  describe("A. Happy path", () => {
    it("accepts minimal valid payload", async () => {
      const dto = await validateDto(CreateSaleOrderDto, validCreateSaleOrder());
      expect(dto.customerId).toBe(VALID_CUSTOMER_ID);
      expect(dto.items).toHaveLength(1);
      expect(dto.items[0].quantity).toBe(2);
    });

    it("accepts full valid payload with orderDate", async () => {
      const dto = await validateDto(
        CreateSaleOrderDto,
        validCreateSaleOrder({ orderDate: "2026-04-20T10:00:00.000Z" }),
      );
      expect(dto.orderDate).toBeInstanceOf(Date);
    });
  });

  describe("B. Type coercion", () => {
    it("coerces ISO date string to Date", async () => {
      const dto = await validateDto(
        CreateSaleOrderDto,
        validCreateSaleOrder({ orderDate: "2026-04-20" }),
      );
      expect(dto.orderDate).toBeInstanceOf(Date);
    });

    it("coerces item quantity strings to numbers", async () => {
      const dto = await validateDto(CreateSaleOrderDto, {
        ...validCreateSaleOrder(),
        items: [{ productId: VALID_PRODUCT_ID, quantity: "3" }],
      });
      expect(dto.items[0].quantity).toBe(3);
    });
  });

  describe("C. Required field absence", () => {
    it("rejects empty object", async () => {
      await expectInvalidDto(CreateSaleOrderDto, {});
    });

    it("rejects missing customerId", async () => {
      await expectValidationProperty(
        CreateSaleOrderDto,
        {
          createdByUserId: VALID_USER_ID,
          items: [validSaleOrderLine()],
        },
        "customerId",
      );
    });

    it("rejects missing createdByUserId", async () => {
      await expectValidationProperty(
        CreateSaleOrderDto,
        {
          customerId: VALID_CUSTOMER_ID,
          items: [validSaleOrderLine()],
        },
        "createdByUserId",
      );
    });

    it("rejects missing items", async () => {
      await expectValidationProperty(
        CreateSaleOrderDto,
        {
          customerId: VALID_CUSTOMER_ID,
          createdByUserId: VALID_USER_ID,
        },
        "items",
      );
    });
  });

  describe("D. Invalid types", () => {
    it("rejects items as object instead of array", async () => {
      await expectValidationProperty(
        CreateSaleOrderDto,
        {
          ...validCreateSaleOrder(),
          items: validSaleOrderLine() as unknown as SaleOrderLineDto[],
        },
        "items",
      );
    });
  });

  describe("F. Format validation", () => {
    it.each([
      ["customerId uppercase", { customerId: "CM8CUST01ABCD" }],
      ["createdByUserId without c prefix", { createdByUserId: "m8user01abcd" }],
    ])("rejects %s", async (_label, override) => {
      await expectInvalidDto(CreateSaleOrderDto, {
        ...validCreateSaleOrder(),
        ...override,
      });
    });
  });

  describe("G. Whitelist / forbidNonWhitelisted", () => {
    it("rejects unknown extra properties", async () => {
      await expectValidationErrors(
        CreateSaleOrderDto,
        { ...validCreateSaleOrder(), status: "OPEN" },
        [/property status should not exist/],
      );
    });
  });

  describe("H. Nested validation", () => {
    it("rejects empty items array", async () => {
      await expectValidationProperty(
        CreateSaleOrderDto,
        validCreateSaleOrder({ items: [] }),
        "items",
      );
    });

    it("rejects item missing productId", async () => {
      await expectValidationProperty(
        CreateSaleOrderDto,
        {
          ...validCreateSaleOrder(),
          items: [{ quantity: 2 }],
        },
        "items.0.productId",
      );
    });

    it("rejects item missing quantity", async () => {
      await expectValidationProperty(
        CreateSaleOrderDto,
        {
          ...validCreateSaleOrder(),
          items: [{ productId: VALID_PRODUCT_ID }],
        },
        "items.0.quantity",
      );
    });

    it("rejects multiple items with one invalid productId", async () => {
      await expectValidationProperty(
        CreateSaleOrderDto,
        {
          ...validCreateSaleOrder(),
          items: [
            validSaleOrderLine(),
            validSaleOrderLine({ productId: "bad-id" }),
          ],
        },
        "items.1.productId",
      );
    });
  });
});

describe("UpdateSaleOrderDto", () => {
  describe("I. Partial update semantics", () => {
    it("accepts empty object", async () => {
      const dto = await validateDto(UpdateSaleOrderDto, {});
      expect(dto).toEqual({});
    });

    it("accepts single field update", async () => {
      const dto = await validateDto(UpdateSaleOrderDto, {
        orderDate: "2026-05-01",
      });
      expect(dto.orderDate).toBeInstanceOf(Date);
    });

    it("accepts valid items replacement", async () => {
      const dto = await validateDto(UpdateSaleOrderDto, {
        items: [{ productId: VALID_PRODUCT_ID, quantity: 5 }],
      });
      expect(dto.items?.[0].quantity).toBe(5);
    });
  });

  describe("G. Whitelist / forbidNonWhitelisted", () => {
    it("rejects immutable createdByUserId", async () => {
      await expectValidationErrors(
        UpdateSaleOrderDto,
        { createdByUserId: VALID_USER_ID },
        [/property createdByUserId should not exist/],
      );
    });
  });

  describe("H. Nested validation on update", () => {
    it("rejects empty items array when items is provided", async () => {
      await expectValidationProperty(
        UpdateSaleOrderDto,
        { items: [] },
        "items",
      );
    });
  });
});
