import { Module } from "@nestjs/common";

import { ProductsModule } from "../products/products.module";
import { OrderLinesService } from "./services/order-lines.service";

@Module({
  imports: [ProductsModule],
  providers: [OrderLinesService],
  exports: [OrderLinesService],
})
export class CommonModule {}
