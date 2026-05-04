import { z } from 'zod';

import { createZodDto } from '@wahyubucil/nestjs-zod-openapi';

export const createProductDtoBase = z.object({
  code: z
    .string()
    .min(1)
    .openapi({ description: 'Código único do produto.', example: 'OLEO-5W30-1L' }),
  name: z.string().min(1).openapi({ example: 'Óleo motor sintético 5W30' }),
  brand: z.string().min(1).openapi({ example: 'Mobil' }),
  type: z.string().min(1).openapi({ example: 'óleo lubrificante' }),
  viscosity: z.string().optional().openapi({ example: '5W-30' }),
  unit: z.string().min(1).openapi({ example: 'L' }),
  salePrice: z.coerce.number().positive().openapi({ example: 45.9 }),
  stockQuantity: z.coerce.number().nonnegative().openapi({ example: 120 }),
  minStock: z.coerce.number().nonnegative().openapi({ example: 24 }),
});

export const createProductDto = createProductDtoBase.openapi('CreateProductDto', {
  example: {
    code: 'OLEO-5W30-1L',
    name: 'Óleo motor sintético 5W30',
    brand: 'Mobil',
    type: 'óleo lubrificante',
    viscosity: '5W-30',
    unit: 'L',
    salePrice: 45.9,
    stockQuantity: 120,
    minStock: 24,
  },
});

export class CreateProductDto extends createZodDto(createProductDto) {}
