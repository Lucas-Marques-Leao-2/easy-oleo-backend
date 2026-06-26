import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from "class-validator";

import { PurchaseOrderLineDto } from "./purchase-order-line.dto";

const CUID_PATTERN = /^c[a-z0-9]+$/;

export class CreatePurchaseOrderDto {
  @ApiPropertyOptional({
    description: "Data da compra; default agora.",
    type: String,
    format: "date-time",
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  purchaseDate?: Date;

  @ApiProperty({ example: "cm8sup01abcd" })
  @IsString()
  @IsNotEmpty()
  @Matches(CUID_PATTERN, { message: "ID de fornecedor inválido." })
  supplierId!: string;

  @ApiProperty({ example: "cm8user01abcd" })
  @IsString()
  @IsNotEmpty()
  @Matches(CUID_PATTERN, { message: "ID de usuário inválido." })
  registeredByUserId!: string;

  @ApiProperty({
    description:
      "Ao registrar a compra, o estoque dos produtos é incrementado.",
    type: [PurchaseOrderLineDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderLineDto)
  items!: PurchaseOrderLineDto[];
}
