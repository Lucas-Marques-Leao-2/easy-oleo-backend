import { z } from "zod";

import { createZodDto } from "@wahyubucil/nestjs-zod-openapi";

import { createUserDtoBase } from "./create-user.dto";

export const updateUserDto = createUserDtoBase
  .omit({ password: true, cpf: true })
  .partial()
  .extend({
    password: z.string().min(8).max(72).optional().openapi({
      description: "Nova senha (opcional).",
      example: "OutraSenha2@",
    }),
  })
  .openapi("UpdateUserDto", {
    example: {
      name: "Carla A. Silva",
      email: "carla.nova@sistema.req",
      password: "OutraSenha2@",
    } as any,
  });

export interface UpdateUserDto {
  [key: string]: any;
}

// @ts-expect-error createZodDto returns a dynamic constructor used by Nest at runtime.
export class UpdateUserDto extends createZodDto(updateUserDto) {}
