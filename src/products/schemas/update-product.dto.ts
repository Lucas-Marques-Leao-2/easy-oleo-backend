import { nestZodDto } from "../../lib/nest-zod-dto";

import { createProductDtoBase } from "./create-product.dto";

export const updateProductDto = createProductDtoBase
  .partial()
  .openapi("UpdateProductDto", {
    example: {
      salePrice: 42.5,
      stockQuantity: 80,
      minStock: 20,
    } as any,
  });

export interface UpdateProductDto {
  [key: string]: any;
}

export class UpdateProductDto extends nestZodDto(updateProductDto) {}
