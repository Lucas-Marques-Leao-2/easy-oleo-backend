import { z } from "zod";

import { nestZodDto } from "../../lib/nest-zod-dto";

export const purchaseOrderLineBase = z.object({
  productId: z.string().min(1).openapi({ example: "cm8prod01abcd" }),
  quantity: z.coerce.number().positive().openapi({ example: 48 }),
  unitCost: z.coerce.number().nonnegative().openapi({ example: 32.5 }),
});

export const createPurchaseOrderDtoBase = z.object({
  purchaseDate: z.coerce.date().optional(),
  supplierId: z.string().min(1).openapi({ example: "cm8sup01abcd" }),
  registeredByUserId: z.string().min(1).openapi({ example: "cm8user01abcd" }),
  items: z.array(purchaseOrderLineBase).min(1).openapi({
    description:
      "Ao registrar a compra, o estoque dos produtos é incrementado.",
  }),
});

export const createPurchaseOrderDto = createPurchaseOrderDtoBase.openapi(
  "CreatePurchaseOrderDto",
  {
    example: {
      supplierId: "cm8sup01abcd",
      registeredByUserId: "cm8user01abcd",
      items: [{ productId: "cm8prod01abcd", quantity: 48, unitCost: 32.5 }],
    } as any,
  },
);

export interface CreatePurchaseOrderDto {
  [key: string]: any;
}

export class CreatePurchaseOrderDto extends nestZodDto(
  createPurchaseOrderDto,
) {}
