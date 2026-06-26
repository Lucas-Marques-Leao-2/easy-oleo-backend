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

import { SaleOrderLineDto } from "./sale-order-line.dto";

const CUID_PATTERN = /^c[a-z0-9]+$/;

export class CreateSaleOrderDto {
  @ApiPropertyOptional({
    description: "Data do pedido; default agora.",
    type: String,
    format: "date-time",
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  orderDate?: Date;

  @ApiProperty({ example: "cm8cust01abcd" })
  @IsString()
  @IsNotEmpty()
  @Matches(CUID_PATTERN, { message: "ID de cliente inválido." })
  customerId!: string;

  @ApiProperty({ example: "cm8user01abcd" })
  @IsString()
  @IsNotEmpty()
  @Matches(CUID_PATTERN, { message: "ID de usuário inválido." })
  createdByUserId!: string;

  @ApiProperty({
    description: "Itens; preço unitário é o salePrice do produto na criação.",
    type: [SaleOrderLineDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleOrderLineDto)
  items!: SaleOrderLineDto[];
}
