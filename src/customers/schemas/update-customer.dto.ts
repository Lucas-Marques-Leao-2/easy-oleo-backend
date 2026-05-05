import { createZodDto } from "@wahyubucil/nestjs-zod-openapi";

import { createCustomerDtoBase } from "./create-customer.dto";

export const updateCustomerDto = createCustomerDtoBase
  .omit({ document: true })
  .partial()
  .openapi("UpdateCustomerDto", {
    example: {
      type: "PJ",
      name: "Auto Peças Maceió — filial Sul",
      street: "Rua do Comércio",
      number: "1200",
      complement: "Loja 3",
      district: "Jaraguá",
      city: "Maceió",
      state: "AL",
      zipCode: "57022120",
      email: "sul@autopecasmaceio.com.br",
      phones: ["82987654321"],
    } as any,
  });

export interface UpdateCustomerDto {
  [key: string]: any;
}

// @ts-expect-error createZodDto returns a dynamic constructor used by Nest at runtime.
export class UpdateCustomerDto extends createZodDto(updateCustomerDto) {}
