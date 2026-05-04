import { ApiProperty } from '@nestjs/swagger';

export class ProductResponse {
  @ApiProperty({ example: 'cm8prod01abcd' })
  id: string;

  @ApiProperty({ example: 'OLEO-5W30-1L' })
  code: string;

  @ApiProperty({ example: 'Óleo motor sintético 5W30' })
  name: string;

  @ApiProperty({ example: 'Mobil' })
  brand: string;

  @ApiProperty({ example: 'óleo lubrificante' })
  type: string;

  @ApiProperty({ required: false, nullable: true, example: '5W-30' })
  viscosity: string | null;

  @ApiProperty({ example: 'L' })
  unit: string;

  @ApiProperty({ example: 45.9 })
  salePrice: number;

  @ApiProperty({ example: 120 })
  stockQuantity: number;

  @ApiProperty({ example: 24 })
  minStock: number;

  @ApiProperty({ example: '2026-01-01T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-02T12:00:00.000Z' })
  updatedAt: Date;
}
