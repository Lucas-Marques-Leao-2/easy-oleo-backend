import { nestZodDto } from "../../lib/nest-zod-dto";

import { createUserDtoBase } from "./create-user.dto";

export const updateUserDto = createUserDtoBase
  .omit({ cpf: true })
  .partial()
  .openapi("UpdateUserDto", {
    example: {
      name: "Carla A. Silva",
      email: "carla.nova@sistema.req",
    } as any,
  });

export interface UpdateUserDto {
  [key: string]: any;
}

export class UpdateUserDto extends nestZodDto(updateUserDto) {}
