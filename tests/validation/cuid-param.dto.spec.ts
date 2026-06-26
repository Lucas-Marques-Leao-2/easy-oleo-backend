import { CuidParamDto } from "../../src/common/dto/cuid-param.dto";
import {
  expectInvalidDto,
  expectValidationErrors,
  expectValidationProperty,
  validateDto,
} from "../lib/validate-dto";

const VALID_CUID = "cm8user01abcd";

describe("CuidParamDto", () => {
  describe("A. Happy path", () => {
    it("accepts valid CUID and keeps string type", async () => {
      const dto = await validateDto(CuidParamDto, { id: VALID_CUID });
      expect(dto.id).toBe(VALID_CUID);
      expect(typeof dto.id).toBe("string");
    });
  });

  describe("C. Required field absence", () => {
    it("rejects empty object", async () => {
      await expectInvalidDto(CuidParamDto, {});
    });

    it("rejects missing id", async () => {
      await expectValidationProperty(CuidParamDto, {}, "id");
    });
  });

  describe("D. Invalid types", () => {
    it.each([
      ["null", { id: null }],
      ["number", { id: 12345 }],
      ["array", { id: [VALID_CUID] }],
      ["object", { id: { value: VALID_CUID } }],
    ])("rejects %s id", async (_label, payload) => {
      await expectInvalidDto(CuidParamDto, payload);
    });
  });

  describe("E. Boundary values", () => {
    it("rejects empty string id", async () => {
      await expectValidationErrors(CuidParamDto, { id: "" }, [
        "ID é obrigatório.",
      ]);
    });
  });

  describe("F. Format validation", () => {
    it.each([
      ["missing c prefix", "m8user01abcd"],
      ["uppercase letters", "CM8USER01ABCD"],
      ["UUID format", "550e8400-e29b-41d4-a716-446655440000"],
      ["plain integer", "1234567890123"],
      ["empty after c", "c"],
    ])("rejects %s", async (_label, id) => {
      await expectValidationErrors(CuidParamDto, { id }, ["ID inválido."]);
    });
  });

  describe("G. Whitelist / forbidNonWhitelisted", () => {
    it("rejects unknown extra properties", async () => {
      await expectValidationErrors(
        CuidParamDto,
        { id: VALID_CUID, extra: "x" },
        [/property extra should not exist/],
      );
    });
  });
});
