import { plainToInstance } from "class-transformer";
import { validate, type ValidationError } from "class-validator";

const TRANSFORM_OPTIONS = {
  enableImplicitConversion: true,
} as const;

const VALIDATION_OPTIONS = {
  whitelist: true,
  forbidNonWhitelisted: true,
} as const;

async function validatePlain<T extends object>(
  cls: new () => T,
  plain: object,
): Promise<ValidationError[]> {
  const instance = plainToInstance(cls, plain, TRANSFORM_OPTIONS);
  return validate(instance, VALIDATION_OPTIONS);
}

type FlatValidationError = {
  path: string;
  messages: string[];
};

function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = "",
): FlatValidationError[] {
  const result: FlatValidationError[] = [];

  for (const error of errors) {
    const path = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    if (error.constraints) {
      result.push({
        path,
        messages: Object.values(error.constraints),
      });
    }

    if (error.children?.length) {
      result.push(...flattenValidationErrors(error.children, path));
    }
  }

  return result;
}

export function extractValidationMessages(errors: ValidationError[]): string[] {
  return flattenValidationErrors(errors).flatMap((entry) => entry.messages);
}

export function extractValidationPaths(errors: ValidationError[]): string[] {
  return flattenValidationErrors(errors)
    .filter((entry) => entry.messages.length > 0)
    .map((entry) => entry.path);
}

export async function getValidationErrors<T extends object>(
  cls: new () => T,
  plain: object,
): Promise<string[]> {
  const errors = await validatePlain(cls, plain);
  return extractValidationMessages(errors);
}

export async function expectValidationErrors<T extends object>(
  cls: new () => T,
  plain: object,
  expectedMessages: (string | RegExp)[],
): Promise<void> {
  const messages = await getValidationErrors(cls, plain);
  expect(messages.length).toBeGreaterThan(0);

  for (const expected of expectedMessages) {
    if (typeof expected === "string") {
      expect(messages).toContain(expected);
    } else {
      expect(messages.some((message) => expected.test(message))).toBe(true);
    }
  }
}

export async function expectValidationProperty<T extends object>(
  cls: new () => T,
  plain: object,
  propertyPath: string,
): Promise<void> {
  const errors = await validatePlain(cls, plain);
  const paths = extractValidationPaths(errors);
  expect(paths).toContain(propertyPath);
}

export async function validateDto<T extends object>(
  cls: new () => T,
  plain: object,
): Promise<T> {
  const instance = plainToInstance(cls, plain, TRANSFORM_OPTIONS);
  const errors = await validate(instance, VALIDATION_OPTIONS);
  if (errors.length > 0) {
    const messages = extractValidationMessages(errors);
    throw new Error(messages.join("; "));
  }
  return instance;
}

export async function expectInvalidDto<T extends object>(
  cls: new () => T,
  plain: object,
): Promise<void> {
  const errors = await validatePlain(cls, plain);
  expect(errors.length).toBeGreaterThan(0);
}
