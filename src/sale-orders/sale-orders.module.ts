import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { CommonModule } from "../common/common.module";
import { CustomersModule } from "../customers/customers.module";
import { ProductsModule } from "../products/products.module";
import { UsersModule } from "../users/users.module";
import { SaleOrdersController } from "./sale-orders.controller";
import { SaleOrdersRepository } from "./sale-orders.repository";
import { SaleOrdersService } from "./sale-orders.service";

@Module({
  imports: [
    AuthModule,
    CommonModule,
    ProductsModule,
    CustomersModule,
    UsersModule,
  ],
  controllers: [SaleOrdersController],
  providers: [SaleOrdersService, SaleOrdersRepository],
})
export class SaleOrdersModule {}
