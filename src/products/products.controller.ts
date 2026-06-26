import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";

import { ClerkAuthGuard } from "../auth/clerk-auth.guard";
import { CuidParamDto } from "../common/dto/cuid-param.dto";
import { HttpConflictResponse } from "../common/responses/http-conflict.response";
import { HttpNotFoundResponse } from "../common/responses/http-not-found.response";
import { ProductResponse } from "./responses/product.response";
import { CreateProductDto } from "./schemas/create-product.dto";
import { UpdateProductDto } from "./schemas/update-product.dto";
import { ProductsService } from "./products.service";

@ApiTags("Products")
@Controller("products")
@UseGuards(ClerkAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiOperation({
    summary: "Cadastra produto",
    description: "Código único; estoque e preço de venda obrigatórios.",
  })
  @ApiResponse({ status: 201, type: ProductResponse })
  @ApiResponse({ status: 400, description: "Corpo inválido." })
  @ApiResponse({ status: 409, type: HttpConflictResponse })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProductDto): Promise<ProductResponse> {
    return this.productsService.create(dto);
  }

  @ApiOperation({ summary: "Lista produtos" })
  @ApiResponse({ status: 200, type: ProductResponse, isArray: true })
  @Get()
  findAll(): Promise<ProductResponse[]> {
    return this.productsService.findAll();
  }

  @ApiOperation({ summary: "Obtém produto por id" })
  @ApiParam({ name: "id", description: "CUID" })
  @ApiResponse({ status: 200, type: ProductResponse })
  @ApiResponse({ status: 404, type: HttpNotFoundResponse })
  @Get(":id")
  findOne(@Param() params: CuidParamDto): Promise<ProductResponse> {
    return this.productsService.findOne(params.id);
  }

  @ApiOperation({ summary: "Atualiza produto" })
  @ApiParam({ name: "id", description: "CUID" })
  @ApiResponse({ status: 200, type: ProductResponse })
  @ApiResponse({ status: 404, type: HttpNotFoundResponse })
  @ApiResponse({ status: 409, type: HttpConflictResponse })
  @Patch(":id")
  update(
    @Param() params: CuidParamDto,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponse> {
    return this.productsService.update(params.id, dto);
  }

  @ApiOperation({ summary: "Remove produto" })
  @ApiParam({ name: "id", description: "CUID" })
  @ApiResponse({ status: 200, type: ProductResponse })
  @ApiResponse({ status: 404, type: HttpNotFoundResponse })
  @Delete(":id")
  remove(@Param() params: CuidParamDto): Promise<ProductResponse> {
    return this.productsService.remove(params.id);
  }
}
