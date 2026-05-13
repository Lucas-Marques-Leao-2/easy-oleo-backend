import { Module } from "@nestjs/common";

import { ProductsModule } from "../products/products.module";
import { PurchaseOrdersController } from "./purchase-orders.controller";
import { PurchaseOrdersRepository } from "./purchase-orders.repository";
import { PurchaseOrdersService } from "./purchase-orders.service";

@Module({
  imports: [ProductsModule],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService, PurchaseOrdersRepository],
})
export class PurchaseOrdersModule {}
