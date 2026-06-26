import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";

import { CreateCustomerDto } from "../../src/customers/schemas/create-customer.dto";
import { CreateSupplierDto } from "../../src/suppliers/schemas/create-supplier.dto";
import { CreateUserDto } from "../../src/users/schemas/create-user.dto";

describe("Brazilian document validators", () => {
  it("accepts valid CPF and CNPJ digit strings", async () => {
    const user = plainToInstance(CreateUserDto, { cpf: "52998224725" });
    expect(await validate(user, { skipMissingProperties: true })).toEqual([]);

    const supplier = plainToInstance(CreateSupplierDto, {
      cnpj: "11222333000181",
    });
    expect(await validate(supplier, { skipMissingProperties: true })).toEqual(
      [],
    );

    const customerCpf = plainToInstance(CreateCustomerDto, {
      document: "52998224725",
    });
    expect(
      await validate(customerCpf, { skipMissingProperties: true }),
    ).toEqual([]);

    const customerCnpj = plainToInstance(CreateCustomerDto, {
      document: "11222333000181",
    });
    expect(
      await validate(customerCnpj, { skipMissingProperties: true }),
    ).toEqual([]);
  });

  it("rejects invalid length, formatting, and check digits", async () => {
    const shortCpf = plainToInstance(CreateUserDto, { cpf: "5299822472" });
    expect(
      (await validate(shortCpf, { skipMissingProperties: true })).length,
    ).toBeGreaterThan(0);

    const formattedCpf = plainToInstance(CreateUserDto, {
      cpf: "529.982.247-25",
    });
    expect(
      (await validate(formattedCpf, { skipMissingProperties: true })).length,
    ).toBeGreaterThan(0);

    const invalidCpf = plainToInstance(CreateUserDto, { cpf: "11111111111" });
    expect(
      (await validate(invalidCpf, { skipMissingProperties: true })).length,
    ).toBeGreaterThan(0);

    const invalidCnpj = plainToInstance(CreateSupplierDto, {
      cnpj: "11222333000180",
    });
    expect(
      (await validate(invalidCnpj, { skipMissingProperties: true })).length,
    ).toBeGreaterThan(0);

    const shortDoc = plainToInstance(CreateCustomerDto, { document: "123" });
    expect(
      (await validate(shortDoc, { skipMissingProperties: true })).length,
    ).toBeGreaterThan(0);
  });
});
