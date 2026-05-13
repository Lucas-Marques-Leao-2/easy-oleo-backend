import { z } from "zod";

import { nestZodDto } from "../../lib/nest-zod-dto";

export const saleOrderLineBase = z.object({
  productId: z.string().min(1).openapi({ example: "cm8prod01abcd" }),
  quantity: z.coerce.number().positive().openapi({ example: 2 }),
});

export const createSaleOrderDtoBase = z.object({
  orderDate: z.coerce.date().optional().openapi({
    description: "Data do pedido; default agora.",
  }),
  customerId: z.string().min(1).openapi({ example: "cm8cust01abcd" }),
  createdByUserId: z.string().min(1).openapi({ example: "cm8user01abcd" }),
  items: z.array(saleOrderLineBase).min(1).openapi({
    description: "Itens; preço unitário é o salePrice do produto na criação.",
  }),
});

export const createSaleOrderDto = createSaleOrderDtoBase.openapi(
  "CreateSaleOrderDto",
  {
    example: {
      customerId: "cm8cust01abcd",
      createdByUserId: "cm8user01abcd",
      items: [{ productId: "cm8prod01abcd", quantity: 2 }],
    } as any,
  },
);

export interface CreateSaleOrderDto {
  [key: string]: any;
}

export class CreateSaleOrderDto extends nestZodDto(createSaleOrderDto) {}
