import { ApiProperty } from '@nestjs/swagger';

export class SaleOrderItemResponse {
  @ApiProperty({ example: 'cm8item01abcd' })
  id: string;

  @ApiProperty({ example: 'cm8prod01abcd' })
  productId: string;

  @ApiProperty({ example: 'OLEO-5W30-1L' })
  productCode: string;

  @ApiProperty({ example: 'Óleo motor 5W30' })
  productName: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 45.9 })
  unitPrice: number;

  @ApiProperty({ example: 91.8 })
  subtotal: number;
}

export class SaleOrderPartyResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class SaleOrderResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderDate: Date;

  @ApiProperty({ example: 191.8 })
  total: number;

  @ApiProperty({ enum: ['DRAFT', 'CONFIRMED', 'CANCELLED'] })
  status: string;

  @ApiProperty({ type: SaleOrderPartyResponse })
  customer: SaleOrderPartyResponse;

  @ApiProperty({ type: SaleOrderPartyResponse })
  createdBy: SaleOrderPartyResponse;

  @ApiProperty({ type: [SaleOrderItemResponse] })
  items: SaleOrderItemResponse[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
