import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Matches,
  Min,
} from "class-validator";

const CUID_PATTERN = /^c[a-z0-9]+$/;

export class PurchaseOrderLineDto {
  @ApiProperty({ example: "cm8prod01abcd" })
  @IsString()
  @IsNotEmpty()
  @Matches(CUID_PATTERN, { message: "ID de produto inválido." })
  productId!: string;

  @ApiProperty({ example: 48 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantity!: number;

  @ApiProperty({ example: 32.5 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitCost!: number;
}
