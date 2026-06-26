import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from "class-validator";

export class CreateProductDto {
  @ApiProperty({
    description: "Código único do produto.",
    example: "OLEO-5W30-1L",
  })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: "Óleo motor sintético 5W30" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: "Mobil" })
  @IsString()
  @IsNotEmpty()
  brand!: string;

  @ApiProperty({ example: "óleo lubrificante" })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiPropertyOptional({ example: "5W-30" })
  @IsOptional()
  @IsString()
  viscosity?: string;

  @ApiProperty({ example: "L" })
  @IsString()
  @IsNotEmpty()
  unit!: string;

  @ApiProperty({ example: 45.9 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  salePrice!: number;

  @ApiProperty({ example: 120 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stockQuantity!: number;

  @ApiProperty({ example: 24 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minStock!: number;
}
