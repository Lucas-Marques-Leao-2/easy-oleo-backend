import {
  zCnpjDigitsString,
  zCpfDigitsString,
  zCustomerDocumentDigitsString,
} from "../../src/lib/zod-brazilian-doc";

describe("Brazilian document zod helpers", () => {
  it("accepts valid CPF and CNPJ digit strings", () => {
    expect(zCpfDigitsString().parse("52998224725")).toBe("52998224725");
    expect(zCnpjDigitsString().parse("11222333000181")).toBe("11222333000181");
    expect(zCustomerDocumentDigitsString().parse("52998224725")).toBe(
      "52998224725",
    );
    expect(zCustomerDocumentDigitsString().parse("11222333000181")).toBe(
      "11222333000181",
    );
  });

  it("rejects invalid length, formatting, and check digits", () => {
    expect(() => zCpfDigitsString().parse("5299822472")).toThrow();
    expect(() => zCpfDigitsString().parse("529.982.247-25")).toThrow();
    expect(() => zCpfDigitsString().parse("11111111111")).toThrow();
    expect(() => zCnpjDigitsString().parse("11222333000180")).toThrow();
    expect(() => zCustomerDocumentDigitsString().parse("123")).toThrow();
  });
});
