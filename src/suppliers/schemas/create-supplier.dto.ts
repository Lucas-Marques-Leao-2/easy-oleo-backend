import { z } from 'zod';

import { createZodDto } from '@wahyubucil/nestjs-zod-openapi';

import { zCnpjDigitsString } from '../../lib/zod-brazilian-doc';

const phoneRegex = /^\d{11}$/;

export const createSupplierDtoBase = z.object({
  legalName: z
    .string({ required_error: 'Razão social é obrigatória.' })
    .min(1)
    .max(300)
    .openapi({
      description: 'Razão social do fornecedor.',
      example: 'Distribuidora Lubrificantes Nordeste S.A.',
    }),
  cnpj: zCnpjDigitsString({ required_error: 'CNPJ é obrigatório.' }).openapi({
    description:
      'CNPJ com 14 dígitos e dígitos verificadores válidos, só números.',
    example: '11222333000181',
  }),
  street: z
    .string()
    .min(1)
    .openapi({ description: 'Logradouro.', example: 'Rodovia BR-104' }),
  number: z
    .string()
    .min(1)
    .openapi({ description: 'Número ou referência.', example: 'Km 12' }),
  complement: z
    .string()
    .optional()
    .openapi({ description: 'Complemento.', example: 'Anexo expedição' }),
  district: z
    .string()
    .optional()
    .openapi({
      description: 'Bairro ou distrito.',
      example: 'Tabuleiro do Martins',
    }),
  city: z
    .string()
    .min(1)
    .openapi({ description: 'Cidade.', example: 'Maceió' }),
  state: z
    .string()
    .min(2)
    .max(2)
    .openapi({ description: 'UF (2 letras).', example: 'AL' }),
  zipCode: z
    .string()
    .min(8)
    .max(9)
    .openapi({ description: 'CEP.', example: '57081065' }),
  email: z
    .string()
    .email({ message: 'E-mail inválido.' })
    .openapi({
      description: 'E-mail comercial.',
      example: 'vendas@lubnordeste.com.br',
    }),
  phones: z
    .array(
      z
        .string()
        .regex(phoneRegex, { message: 'Telefone: 11 dígitos com DDD.' }),
    )
    .optional()
    .openapi({
      description: 'Telefones com DDD (11 dígitos).',
      example: ['82988887777', '82334567890'],
    }),
});

export const createSupplierDto = createSupplierDtoBase.openapi(
  'CreateSupplierDto',
  {
    example: {
      legalName: 'Distribuidora Lubrificantes Nordeste S.A.',
      cnpj: '11222333000181',
      street: 'Rodovia BR-104',
      number: 'Km 12',
      complement: 'Anexo expedição',
      district: 'Tabuleiro do Martins',
      city: 'Maceió',
      state: 'AL',
      zipCode: '57081065',
      email: 'vendas@lubnordeste.com.br',
      phones: ['82988887777', '82334567890'],
    },
  },
);

export class CreateSupplierDto extends createZodDto(createSupplierDto) {}
