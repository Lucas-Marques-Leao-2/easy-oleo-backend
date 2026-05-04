import { createZodDto } from '@wahyubucil/nestjs-zod-openapi';

import { createProductDtoBase } from './create-product.dto';

export const updateProductDto = createProductDtoBase.partial().openapi(
  'UpdateProductDto',
  {
    example: {
      salePrice: 42.5,
      stockQuantity: 80,
      minStock: 20,
    },
  },
);

export class UpdateProductDto extends createZodDto(updateProductDto) {}
