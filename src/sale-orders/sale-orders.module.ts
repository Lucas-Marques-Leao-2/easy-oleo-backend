import { Module } from "@nestjs/common";

import { ProductsModule } from "../products/products.module";
import { SaleOrdersController } from "./sale-orders.controller";
import { SaleOrdersRepository } from "./sale-orders.repository";
import { SaleOrdersService } from "./sale-orders.service";

@Module({
  imports: [ProductsModule],
  controllers: [SaleOrdersController],
  providers: [SaleOrdersService, SaleOrdersRepository],
})
export class SaleOrdersModule {}
