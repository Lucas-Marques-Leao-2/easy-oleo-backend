import { ApiPropertyOptional, OmitType, PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  ValidateNested,
} from "class-validator";

import { CreateSaleOrderDto } from "./create-sale-order.dto";
import { SaleOrderLineDto } from "./sale-order-line.dto";

export class UpdateSaleOrderDto extends PartialType(
  OmitType(CreateSaleOrderDto, ["createdByUserId"] as const),
) {
  @ApiPropertyOptional({
    type: [SaleOrderLineDto],
    description: "Substitui todos os itens do pedido.",
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleOrderLineDto)
  declare items?: SaleOrderLineDto[];
}
