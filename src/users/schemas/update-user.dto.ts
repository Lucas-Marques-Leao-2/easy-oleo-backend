import { z } from "zod";

import { nestZodDto } from "../../lib/nest-zod-dto";

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

export class UpdateUserDto extends nestZodDto(updateUserDto) {}
