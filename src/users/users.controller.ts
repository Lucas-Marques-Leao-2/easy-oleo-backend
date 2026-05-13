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

import { HttpConflictResponse } from "../common/responses/http-conflict.response";
import { HttpNotFoundResponse } from "../common/responses/http-not-found.response";
import { UserResponse } from "./responses/user.response";
import { CreateUserDto } from "./schemas/create-user.dto";
import { UpdateUserDto } from "./schemas/update-user.dto";
import { UsersService } from "./users.service";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: "Cadastra usuário",
    description:
      "Dados pessoais, endereço, e-mail, hash de senha, telefones; role opcional (default ATTENDANT).",
  })
  @ApiResponse({
    status: 201,
    description: "Usuário criado.",
    type: UserResponse,
  })
  @ApiResponse({ status: 400, description: "Corpo inválido." })
  @ApiResponse({
    status: 409,
    description: "CPF ou e-mail já cadastrado.",
    type: HttpConflictResponse,
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body(ZodValidationPipe) dto: CreateUserDto): Promise<UserResponse> {
    return this.usersService.create(dto);
  }

  @ApiOperation({ summary: "Lista usuários" })
  @ApiResponse({
    status: 200,
    description: "Lista obtida com sucesso.",
    type: UserResponse,
    isArray: true,
  })
  @Get()
  findAll(): Promise<UserResponse[]> {
    return this.usersService.findAll();
  }

  @ApiOperation({ summary: "Obtém usuário por id" })
  @ApiParam({ name: "id", description: "CUID do usuário" })
  @ApiResponse({
    status: 200,
    description: "Usuário encontrado.",
    type: UserResponse,
  })
  @ApiResponse({
    status: 404,
    description: "Não encontrado.",
    type: HttpNotFoundResponse,
  })
  @Get(":id")
  findOne(@Param("id") id: string): Promise<UserResponse> {
    return this.usersService.findOne(id);
  }

  @ApiOperation({
    summary: "Atualiza usuário",
    description: "CPF não pode ser alterado por este endpoint.",
  })
  @ApiParam({ name: "id", description: "CUID do usuário" })
  @ApiResponse({
    status: 200,
    description: "Usuário atualizado.",
    type: UserResponse,
  })
  @ApiResponse({ status: 400, description: "Corpo inválido." })
  @ApiResponse({
    status: 404,
    description: "Não encontrado.",
    type: HttpNotFoundResponse,
  })
  @ApiResponse({
    status: 409,
    description: "E-mail já em uso.",
    type: HttpConflictResponse,
  })
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(ZodValidationPipe) dto: UpdateUserDto,
  ): Promise<UserResponse> {
    return this.usersService.update(id, dto);
  }

  @ApiOperation({ summary: "Remove usuário" })
  @ApiParam({ name: "id", description: "CUID do usuário" })
  @ApiResponse({
    status: 200,
    description: "Removido; retorna último estado.",
    type: UserResponse,
  })
  @ApiResponse({
    status: 404,
    description: "Não encontrado.",
    type: HttpNotFoundResponse,
  })
  @Delete(":id")
  remove(@Param("id") id: string): Promise<UserResponse> {
    return this.usersService.remove(id);
  }
}
