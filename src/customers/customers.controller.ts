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
import { CustomerResponse } from "./responses/customer.response";
import { CreateCustomerDto } from "./schemas/create-customer.dto";
import { UpdateCustomerDto } from "./schemas/update-customer.dto";
import { CustomersService } from "./customers.service";

@ApiTags("Customers")
@Controller("customers")
@UseGuards(ClerkAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @ApiOperation({
    summary: "Cadastra customer",
    description:
      "Inclui dados cadastrais e telefones opcionais (11 dígitos cada).",
  })
  @ApiResponse({
    status: 201,
    description: "Customer criado.",
    type: CustomerResponse,
  })
  @ApiResponse({ status: 400, description: "Corpo inválido." })
  @ApiResponse({
    status: 409,
    description: "Documento já cadastrado.",
    type: HttpConflictResponse,
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCustomerDto): Promise<CustomerResponse> {
    return this.customersService.create(dto);
  }

  @ApiOperation({ summary: "Lista customers" })
  @ApiResponse({
    status: 200,
    description: "Lista obtida com sucesso.",
    type: CustomerResponse,
    isArray: true,
  })
  @Get()
  findAll(): Promise<CustomerResponse[]> {
    return this.customersService.findAll();
  }

  @ApiOperation({ summary: "Obtém customer por id" })
  @ApiParam({ name: "id", description: "CUID do customer" })
  @ApiResponse({
    status: 200,
    description: "Customer encontrado.",
    type: CustomerResponse,
  })
  @ApiResponse({
    status: 404,
    description: "Não encontrado.",
    type: HttpNotFoundResponse,
  })
  @Get(":id")
  findOne(@Param() params: CuidParamDto): Promise<CustomerResponse> {
    return this.customersService.findOne(params.id);
  }

  @ApiOperation({
    summary: "Atualiza customer",
    description: "Documento não pode ser alterado por este endpoint.",
  })
  @ApiParam({ name: "id", description: "CUID do customer" })
  @ApiResponse({
    status: 200,
    description: "Customer atualizado.",
    type: CustomerResponse,
  })
  @ApiResponse({ status: 400, description: "Corpo inválido." })
  @ApiResponse({
    status: 404,
    description: "Não encontrado.",
    type: HttpNotFoundResponse,
  })
  @Patch(":id")
  update(
    @Param() params: CuidParamDto,
    @Body() dto: UpdateCustomerDto,
  ): Promise<CustomerResponse> {
    return this.customersService.update(params.id, dto);
  }

  @ApiOperation({ summary: "Remove customer" })
  @ApiParam({ name: "id", description: "CUID do customer" })
  @ApiResponse({
    status: 200,
    description: "Removido; retorna último estado.",
    type: CustomerResponse,
  })
  @ApiResponse({
    status: 404,
    description: "Não encontrado.",
    type: HttpNotFoundResponse,
  })
  @Delete(":id")
  remove(@Param() params: CuidParamDto): Promise<CustomerResponse> {
    return this.customersService.remove(params.id);
  }
}
