import { z } from "zod";

import { createZodDto } from "@wahyubucil/nestjs-zod-openapi";

import { zCustomerDocumentDigitsString } from "../../lib/zod-brazilian-doc";

const phoneRegex = /^\d{11}$/;

export const createCustomerDtoBase = z.object({
  type: z
    .enum(["PF", "PJ"], {
      required_error: "Informe PF ou PJ.",
      invalid_type_error: "Tipo inválido.",
    })
    .optional()
    .openapi({
      description: "Pessoa física ou jurídica. Se omitido, usa PF.",
      example: "PJ",
    }),
  name: z
    .string({ required_error: "Nome ou razão social é obrigatório." })
    .min(1, { message: "Nome ou razão social não pode ser vazio." })
    .max(300)
    .openapi({
      description: "Nome (PF) ou razão social (PJ).",
      example: "Auto Peças Maceió Ltda",
    }),
  document: zCustomerDocumentDigitsString().openapi({
    description:
      "CPF (11 dígitos) ou CNPJ (14 dígitos), só números; dígitos verificadores conferidos.",
    example: "11222333000181",
  }),
  street: z
    .string()
    .min(1)
    .openapi({ description: "Logradouro.", example: "Av. Álvaro Otacílio" }),
  number: z
    .string()
    .min(1)
    .openapi({ description: "Número.", example: "4512" }),
  complement: z
    .string()
    .optional()
    .openapi({ description: "Complemento.", example: "Galpão B" }),
  district: z
    .string()
    .optional()
    .openapi({ description: "Bairro.", example: "Ponta Verde" }),
  city: z
    .string()
    .min(1)
    .openapi({ description: "Cidade.", example: "Maceió" }),
  state: z
    .string()
    .min(2)
    .max(2)
    .openapi({ description: "UF (2 letras).", example: "AL" }),
  zipCode: z
    .string()
    .min(8)
    .max(9)
    .openapi({ description: "CEP.", example: "57035290" }),
  email: z.string().email({ message: "E-mail inválido." }).openapi({
    description: "E-mail de contato.",
    example: "compras@autopecasmaceio.com.br",
  }),
  phones: z
    .array(
      z
        .string()
        .regex(phoneRegex, { message: "Telefone: 11 dígitos com DDD." }),
    )
    .optional()
    .openapi({
      description: "Telefones com DDD (11 dígitos, somente números).",
      example: ["82999998888", "82332112345"],
    }),
});

export const createCustomerDto = createCustomerDtoBase.openapi(
  "CreateCustomerDto",
  {
    example: {
      type: "PJ",
      name: "Auto Peças Maceió Ltda",
      document: "11222333000181",
      street: "Av. Álvaro Otacílio",
      number: "4512",
      complement: "Galpão B",
      district: "Ponta Verde",
      city: "Maceió",
      state: "AL",
      zipCode: "57035290",
      email: "compras@autopecasmaceio.com.br",
      phones: ["82999998888", "82332112345"],
    } as any,
  },
);

export interface CreateCustomerDto {
  [key: string]: any;
}

// @ts-expect-error createZodDto returns a dynamic constructor used by Nest at runtime.
export class CreateCustomerDto extends createZodDto(createCustomerDto) {}
