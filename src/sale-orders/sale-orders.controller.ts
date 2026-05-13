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
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ZodValidationPipe } from "@wahyubucil/nestjs-zod-openapi";

import { HttpBadRequestResponse } from "../common/responses/http-bad-request.response";
import { HttpNotFoundResponse } from "../common/responses/http-not-found.response";
import { SaleOrderResponse } from "./responses/sale-order.response";
import { CreateSaleOrderDto } from "./schemas/create-sale-order.dto";
import { UpdateSaleOrderDto } from "./schemas/update-sale-order.dto";
import { SaleOrdersService } from "./sale-orders.service";

@ApiTags("Sale orders")
@Controller("sale-orders")
export class SaleOrdersController {
  constructor(private readonly saleOrdersService: SaleOrdersService) {}

  @ApiOperation({
    summary: "Cadastra pedido de venda",
    description:
      "Status inicial DRAFT. Preço unitário de cada linha é o salePrice atual do produto.",
  })
  @ApiResponse({
    status: 201,
    description: "Pedido criado.",
    type: SaleOrderResponse,
  })
  @ApiResponse({ status: 400, description: "Corpo inválido." })
  @ApiResponse({
    status: 404,
    description: "Cliente, usuário ou produto não encontrado.",
    type: HttpNotFoundResponse,
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(ZodValidationPipe) dto: CreateSaleOrderDto,
  ): Promise<SaleOrderResponse> {
    return this.saleOrdersService.create(dto);
  }

  @ApiOperation({ summary: "Lista pedidos de venda" })
  @ApiResponse({
    status: 200,
    type: SaleOrderResponse,
    isArray: true,
  })
  @Get()
  findAll(): Promise<SaleOrderResponse[]> {
    return this.saleOrdersService.findAll();
  }

  @ApiOperation({ summary: "Obtém pedido por id" })
  @ApiParam({ name: "id", description: "CUID do pedido" })
  @ApiResponse({ status: 200, type: SaleOrderResponse })
  @ApiResponse({ status: 404, type: HttpNotFoundResponse })
  @Get(":id")
  findOne(@Param("id") id: string): Promise<SaleOrderResponse> {
    return this.saleOrdersService.findOne(id);
  }

  @ApiOperation({
    summary: "Atualiza pedido (somente DRAFT)",
    description:
      "Se enviar items, substitui todos os itens e recalcula o total.",
  })
  @ApiParam({ name: "id", description: "CUID do pedido" })
  @ApiResponse({ status: 200, type: SaleOrderResponse })
  @ApiResponse({ status: 400, type: HttpBadRequestResponse })
  @ApiResponse({ status: 404, type: HttpNotFoundResponse })
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(ZodValidationPipe) dto: UpdateSaleOrderDto,
  ): Promise<SaleOrderResponse> {
    return this.saleOrdersService.update(id, dto);
  }

  @ApiOperation({
    summary: "Remove pedido (somente DRAFT)",
  })
  @ApiParam({ name: "id", description: "CUID do pedido" })
  @ApiResponse({ status: 200, type: SaleOrderResponse })
  @ApiResponse({ status: 400, type: HttpBadRequestResponse })
  @ApiResponse({ status: 404, type: HttpNotFoundResponse })
  @Delete(":id")
  remove(@Param("id") id: string): Promise<SaleOrderResponse> {
    return this.saleOrdersService.remove(id);
  }

  @ApiOperation({
    summary: "Confirma pedido (DRAFT → CONFIRMED)",
    description: "Baixa estoque conforme quantidades dos itens.",
  })
  @ApiParam({ name: "id", description: "CUID do pedido" })
  @ApiResponse({ status: 200, type: SaleOrderResponse })
  @ApiResponse({ status: 400, type: HttpBadRequestResponse })
  @ApiResponse({ status: 404, type: HttpNotFoundResponse })
  @Post(":id/confirm")
  @HttpCode(HttpStatus.OK)
  confirm(@Param("id") id: string): Promise<SaleOrderResponse> {
    return this.saleOrdersService.confirm(id);
  }

  @ApiOperation({
    summary: "Cancela pedido",
    description:
      "DRAFT: apenas marca cancelado. CONFIRMED: devolve estoque e marca cancelado.",
  })
  @ApiParam({ name: "id", description: "CUID do pedido" })
  @ApiResponse({ status: 200, type: SaleOrderResponse })
  @ApiResponse({ status: 400, type: HttpBadRequestResponse })
  @ApiResponse({ status: 404, type: HttpNotFoundResponse })
  @Post(":id/cancel")
  @HttpCode(HttpStatus.OK)
  cancel(@Param("id") id: string): Promise<SaleOrderResponse> {
    return this.saleOrdersService.cancel(id);
  }
}
