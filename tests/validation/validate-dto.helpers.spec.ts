import "reflect-metadata";
import { Type } from "class-transformer";
import { IsNotEmpty, IsString, ValidateNested } from "class-validator";

import {
  expectInvalidDto,
  expectValidationErrors,
  expectValidationProperty,
  getValidationErrors,
  validateDto,
} from "../lib/validate-dto";

class SampleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

class NestedItemDto {
  @IsString()
  @IsNotEmpty()
  value!: string;
}

class NestedParentDto {
  @ValidateNested({ each: true })
  @Type(() => NestedItemDto)
  items!: NestedItemDto[];
}

describe("validate-dto helpers", () => {
  it("validateDto returns transformed instance on success", async () => {
    const result = await validateDto(SampleDto, { name: "ok" });
    expect(result).toBeInstanceOf(SampleDto);
    expect(result.name).toBe("ok");
  });

  it("expectInvalidDto passes when validation fails", async () => {
    await expectInvalidDto(SampleDto, { name: "" });
  });

  it("getValidationErrors returns flat constraint messages", async () => {
    const messages = await getValidationErrors(SampleDto, { name: "" });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages.some((message) => message.length > 0)).toBe(true);
  });

  it("getValidationErrors includes nested children messages", async () => {
    const messages = await getValidationErrors(NestedParentDto, {
      items: [{ value: "" }],
    });
    expect(messages.length).toBeGreaterThan(0);
  });

  it("expectValidationErrors matches exact messages", async () => {
    await expectValidationErrors(SampleDto, { name: "" }, [
      "name should not be empty",
    ]);
  });

  it("expectValidationErrors matches RegExp patterns", async () => {
    await expectValidationErrors(SampleDto, { name: "" }, [
      /should not be empty/,
    ]);
  });

  it("expectValidationProperty asserts failing property path", async () => {
    await expectValidationProperty(SampleDto, { name: "" }, "name");
  });

  it("expectValidationProperty finds nested property paths", async () => {
    await expectValidationProperty(
      NestedParentDto,
      {
        items: [{ value: "" }],
      },
      "items.0.value",
    );
  });

  it("forbidNonWhitelisted surfaces unknown property errors", async () => {
    await expectValidationErrors(
      SampleDto,
      { name: "ok", unknownField: true },
      [/property unknownField should not exist/],
    );
  });
});
