import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { CommonModule } from "../common/common.module";
import { ProductsModule } from "../products/products.module";
import { SuppliersModule } from "../suppliers/suppliers.module";
import { UsersModule } from "../users/users.module";
import { PurchaseOrdersController } from "./purchase-orders.controller";
import { PurchaseOrdersRepository } from "./purchase-orders.repository";
import { PurchaseOrdersService } from "./purchase-orders.service";

@Module({
  imports: [
    AuthModule,
    CommonModule,
    ProductsModule,
    SuppliersModule,
    UsersModule,
  ],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService, PurchaseOrdersRepository],
})
export class PurchaseOrdersModule {}
