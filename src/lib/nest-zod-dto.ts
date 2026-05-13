import { createZodDto } from "@wahyubucil/nestjs-zod-openapi";

type ZodDtoSchema = Parameters<typeof createZodDto>[0];

/**
 * `createZodDto` infers a base type TS rejects in `class X extends …` (TS2509) when schemas use
 * `.openapi()`. This wrapper asserts a plain constructor so DTO classes compile without suppressing TS2509 on each file.
 */
type NestDtoConstructor = abstract new (...args: never[]) => object;

export function nestZodDto(schema: ZodDtoSchema): NestDtoConstructor {
  return createZodDto(schema) as NestDtoConstructor;
}
