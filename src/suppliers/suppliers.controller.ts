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
import { SupplierResponse } from "./responses/supplier.response";
import { CreateSupplierDto } from "./schemas/create-supplier.dto";
import { UpdateSupplierDto } from "./schemas/update-supplier.dto";
import { SuppliersService } from "./suppliers.service";

@ApiTags("Suppliers")
@Controller("suppliers")
@UseGuards(ClerkAuthGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @ApiOperation({
    summary: "Cadastra fornecedor",
    description:
      "Razão social, CNPJ, endereço; telefones opcionais (11 dígitos).",
  })
  @ApiResponse({
    status: 201,
    description: "Fornecedor criado.",
    type: SupplierResponse,
  })
  @ApiResponse({ status: 400, description: "Corpo inválido." })
  @ApiResponse({
    status: 409,
    description: "CNPJ já cadastrado.",
    type: HttpConflictResponse,
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateSupplierDto): Promise<SupplierResponse> {
    return this.suppliersService.create(dto);
  }

  @ApiOperation({ summary: "Lista fornecedores" })
  @ApiResponse({
    status: 200,
    description: "Lista obtida com sucesso.",
    type: SupplierResponse,
    isArray: true,
  })
  @Get()
  findAll(): Promise<SupplierResponse[]> {
    return this.suppliersService.findAll();
  }

  @ApiOperation({ summary: "Obtém fornecedor por id" })
  @ApiParam({ name: "id", description: "CUID do fornecedor" })
  @ApiResponse({
    status: 200,
    description: "Fornecedor encontrado.",
    type: SupplierResponse,
  })
  @ApiResponse({
    status: 404,
    description: "Não encontrado.",
    type: HttpNotFoundResponse,
  })
  @Get(":id")
  findOne(@Param() params: CuidParamDto): Promise<SupplierResponse> {
    return this.suppliersService.findOne(params.id);
  }

  @ApiOperation({
    summary: "Atualiza fornecedor",
    description: "CNPJ não pode ser alterado por este endpoint.",
  })
  @ApiParam({ name: "id", description: "CUID do fornecedor" })
  @ApiResponse({
    status: 200,
    description: "Fornecedor atualizado.",
    type: SupplierResponse,
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
    @Body() dto: UpdateSupplierDto,
  ): Promise<SupplierResponse> {
    return this.suppliersService.update(params.id, dto);
  }

  @ApiOperation({ summary: "Remove fornecedor" })
  @ApiParam({ name: "id", description: "CUID do fornecedor" })
  @ApiResponse({
    status: 200,
    description: "Removido; retorna último estado.",
    type: SupplierResponse,
  })
  @ApiResponse({
    status: 404,
    description: "Não encontrado.",
    type: HttpNotFoundResponse,
  })
  @Delete(":id")
  remove(@Param() params: CuidParamDto): Promise<SupplierResponse> {
    return this.suppliersService.remove(params.id);
  }
}
