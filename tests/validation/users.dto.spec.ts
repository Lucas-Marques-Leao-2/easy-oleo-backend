import { UserRole } from "@prisma/client";

import { CreateUserDto } from "../../src/users/schemas/create-user.dto";
import { UpdateUserDto } from "../../src/users/schemas/update-user.dto";
import {
  expectInvalidDto,
  expectValidationErrors,
  expectValidationProperty,
  validateDto,
} from "../lib/validate-dto";

const VALID_CPF = "52998224725";
const VALID_PHONE = "82991112233";

function validCreateUser(overrides: Partial<CreateUserDto> = {}) {
  return {
    name: "Carla Administradora",
    cpf: VALID_CPF,
    street: "Rua Principal",
    number: "100",
    city: "Maceió",
    state: "AL",
    zipCode: "57020000",
    email: "carla@easyoleo.local",
    ...overrides,
  };
}

const REQUIRED_FIELDS = [
  "name",
  "cpf",
  "street",
  "number",
  "city",
  "state",
  "zipCode",
  "email",
] as const;

describe("CreateUserDto", () => {
  describe("A. Happy path", () => {
    it("accepts minimal valid payload", async () => {
      const dto = await validateDto(CreateUserDto, validCreateUser());
      expect(dto.name).toBe("Carla Administradora");
      expect(dto.cpf).toBe(VALID_CPF);
      expect(typeof dto.cpf).toBe("string");
    });

    it("accepts full valid payload with optional fields", async () => {
      const dto = await validateDto(
        CreateUserDto,
        validCreateUser({
          complement: "Sala 1",
          district: "Centro",
          role: UserRole.ADMIN,
          phones: [VALID_PHONE],
        }),
      );
      expect(dto.role).toBe(UserRole.ADMIN);
      expect(dto.phones).toEqual([VALID_PHONE]);
      expect(dto.complement).toBe("Sala 1");
      expect(dto.district).toBe("Centro");
    });
  });

  describe("B. Type coercion", () => {
    it("keeps CPF as string digits after validation", async () => {
      const dto = await validateDto(CreateUserDto, validCreateUser());
      expect(dto.cpf).toBe(VALID_CPF);
      expect(typeof dto.cpf).toBe("string");
    });
  });

  describe("C. Required field absence", () => {
    it("rejects empty object", async () => {
      await expectInvalidDto(CreateUserDto, {});
    });

    it.each(REQUIRED_FIELDS)("rejects when %s is missing", async (field) => {
      const payload = validCreateUser();
      delete (payload as Record<string, unknown>)[field];
      await expectValidationProperty(CreateUserDto, payload, field);
    });
  });

  describe("D. Invalid types", () => {
    it("rejects null name", async () => {
      await expectValidationProperty(
        CreateUserDto,
        validCreateUser({ name: null as unknown as string }),
        "name",
      );
    });

    it("coerces number to string for name via implicit conversion", async () => {
      const dto = await validateDto(
        CreateUserDto,
        validCreateUser({ name: 123 as unknown as string }),
      );
      expect(dto.name).toBe("123");
      expect(typeof dto.name).toBe("string");
    });

    it("rejects array as email", async () => {
      await expectValidationProperty(
        CreateUserDto,
        validCreateUser({ email: ["a@b.com"] as unknown as string }),
        "email",
      );
    });
  });

  describe("E. Boundary values", () => {
    it("rejects empty name", async () => {
      await expectValidationProperty(
        CreateUserDto,
        validCreateUser({ name: "" }),
        "name",
      );
    });

    it.each([
      ["1 char state", "A"],
      ["3 char state", "ALL"],
    ])("rejects %s", async (_label, state) => {
      await expectValidationProperty(
        CreateUserDto,
        validCreateUser({ state }),
        "state",
      );
    });

    it("rejects zipCode shorter than 8 chars", async () => {
      await expectValidationProperty(
        CreateUserDto,
        validCreateUser({ zipCode: "5702000" }),
        "zipCode",
      );
    });
  });

  describe("F. Format validation", () => {
    it.each([
      ["missing @", "carla.easyoleo.local"],
      ["missing domain", "carla@"],
      ["with spaces", "carla @easyoleo.local"],
    ])("rejects email: %s", async (_label, email) => {
      await expectValidationProperty(
        CreateUserDto,
        validCreateUser({ email }),
        "email",
      );
    });

    it("rejects invalid CPF", async () => {
      await expectValidationErrors(
        CreateUserDto,
        validCreateUser({ cpf: "11111111111" }),
        ["CPF inválido."],
      );
    });

    it("rejects invalid role enum", async () => {
      await expectValidationProperty(
        CreateUserDto,
        validCreateUser({ role: "MANAGER" as UserRole }),
        "role",
      );
    });
  });

  describe("G. Whitelist / forbidNonWhitelisted", () => {
    it("rejects unknown extra properties", async () => {
      await expectValidationErrors(
        CreateUserDto,
        { ...validCreateUser(), unknown: true },
        [/property unknown should not exist/],
      );
    });
  });
});

describe("UpdateUserDto", () => {
  describe("A. Happy path", () => {
    it("accepts empty object for partial update", async () => {
      const dto = await validateDto(UpdateUserDto, {});
      expect(dto).toEqual({});
    });

    it("accepts single field update", async () => {
      const dto = await validateDto(UpdateUserDto, { name: "Novo nome" });
      expect(dto.name).toBe("Novo nome");
    });

    it("accepts optional fields with valid values", async () => {
      const dto = await validateDto(UpdateUserDto, {
        role: UserRole.SELLER,
        phones: [VALID_PHONE],
      });
      expect(dto.role).toBe(UserRole.SELLER);
      expect(dto.phones).toEqual([VALID_PHONE]);
    });
  });

  describe("G. Whitelist / forbidNonWhitelisted", () => {
    it("rejects immutable cpf field", async () => {
      await expectValidationErrors(UpdateUserDto, { cpf: VALID_CPF }, [
        /property cpf should not exist/,
      ]);
    });

    it("rejects unknown extra properties", async () => {
      await expectValidationErrors(
        UpdateUserDto,
        { name: "Novo", extra: true },
        [/property extra should not exist/],
      );
    });
  });

  describe("F. Format validation on partial updates", () => {
    it("rejects invalid email on update", async () => {
      await expectValidationProperty(UpdateUserDto, { email: "bad" }, "email");
    });
  });
});
