import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Body,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ZodValidationPipe } from '@wahyubucil/nestjs-zod-openapi';

import { HttpBadRequestResponse } from '../common/responses/http-bad-request.response';
import { HttpNotFoundResponse } from '../common/responses/http-not-found.response';
import { PurchaseOrderResponse } from './responses/purchase-order.response';
import { CreatePurchaseOrderDto } from './schemas/create-purchase-order.dto';
import { PurchaseOrdersService } from './purchase-orders.service';

@ApiTags('Purchase orders')
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @ApiOperation({
    summary: 'Registra compra de reposição',
    description:
      'Incrementa estoque dos produtos na mesma transação do cadastro.',
  })
  @ApiResponse({
    status: 201,
    description: 'Pedido criado.',
    type: PurchaseOrderResponse,
  })
  @ApiResponse({ status: 400, description: 'Corpo inválido.' })
  @ApiResponse({
    status: 404,
    description: 'Fornecedor, usuário ou produto não encontrado.',
    type: HttpNotFoundResponse,
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(ZodValidationPipe) dto: CreatePurchaseOrderDto,
  ): Promise<PurchaseOrderResponse> {
    return this.purchaseOrdersService.create(dto);
  }

  @ApiOperation({ summary: 'Lista pedidos de compra' })
  @ApiResponse({
    status: 200,
    type: PurchaseOrderResponse,
    isArray: true,
  })
  @Get()
  findAll(): Promise<PurchaseOrderResponse[]> {
    return this.purchaseOrdersService.findAll();
  }

  @ApiOperation({ summary: 'Obtém pedido de compra por id' })
  @ApiParam({ name: 'id', description: 'CUID do pedido' })
  @ApiResponse({ status: 200, type: PurchaseOrderResponse })
  @ApiResponse({ status: 404, type: HttpNotFoundResponse })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<PurchaseOrderResponse> {
    return this.purchaseOrdersService.findOne(id);
  }

  @ApiOperation({
    summary: 'Remove pedido de compra',
    description:
      'Estorna a entrada de estoque vinculada ao pedido (transação única).',
  })
  @ApiParam({ name: 'id', description: 'CUID do pedido' })
  @ApiResponse({ status: 200, type: PurchaseOrderResponse })
  @ApiResponse({ status: 400, type: HttpBadRequestResponse })
  @ApiResponse({ status: 404, type: HttpNotFoundResponse })
  @Delete(':id')
  remove(@Param('id') id: string): Promise<PurchaseOrderResponse> {
    return this.purchaseOrdersService.remove(id);
  }
}
