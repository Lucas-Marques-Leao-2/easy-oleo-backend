import { z } from "zod";

import { nestZodDto } from "../../lib/nest-zod-dto";

import {
  createSaleOrderDtoBase,
  saleOrderLineBase,
} from "./create-sale-order.dto";

export const updateSaleOrderDto = createSaleOrderDtoBase
  .omit({ createdByUserId: true })
  .partial()
  .extend({
    items: z.array(saleOrderLineBase).min(1).optional(),
  })
  .openapi("UpdateSaleOrderDto", {
    example: {
      orderDate: new Date("2026-04-20"),
      customerId: "cm8cust02abcd",
      items: [{ productId: "cm8prod01abcd", quantity: 3 }],
    } as any,
  });

export interface UpdateSaleOrderDto {
  [key: string]: any;
}

export class UpdateSaleOrderDto extends nestZodDto(updateSaleOrderDto) {}
