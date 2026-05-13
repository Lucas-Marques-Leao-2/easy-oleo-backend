import { createZodDto } from "@wahyubucil/nestjs-zod-openapi";

type ZodDtoSchema = Parameters<typeof createZodDto>[0];

type NestDtoConstructor = abstract new (...args: never[]) => object;

export function nestZodDto(schema: ZodDtoSchema): NestDtoConstructor {
  return createZodDto(schema) as NestDtoConstructor;
}
