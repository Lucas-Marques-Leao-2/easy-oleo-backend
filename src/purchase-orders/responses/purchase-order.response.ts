import { ApiProperty } from '@nestjs/swagger';

export class PurchaseOrderItemResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  productCode: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitCost: number;

  @ApiProperty()
  subtotal: number;
}

export class PurchaseOrderPartyResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class PurchaseOrderResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  purchaseDate: Date;

  @ApiProperty()
  total: number;

  @ApiProperty({ type: PurchaseOrderPartyResponse })
  supplier: PurchaseOrderPartyResponse;

  @ApiProperty({ type: PurchaseOrderPartyResponse })
  registeredBy: PurchaseOrderPartyResponse;

  @ApiProperty({ type: [PurchaseOrderItemResponse] })
  items: PurchaseOrderItemResponse[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
