import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";

import { ClerkAuthGuard } from "../auth/clerk-auth.guard";
import { Public } from "../auth/public.decorator";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CuidParamDto } from "../common/dto/cuid-param.dto";
import { HttpConflictResponse } from "../common/responses/http-conflict.response";
import { HttpNotFoundResponse } from "../common/responses/http-not-found.response";
import { ClerkWebhookService } from "./clerk-webhook.service";
import { UserResponse } from "./responses/user.response";
import { CreateUserDto } from "./schemas/create-user.dto";
import { UpdateUserDto } from "./schemas/update-user.dto";
import { UsersService } from "./users.service";

@ApiTags("Users")
@Controller("users")
@UseGuards(ClerkAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly clerkWebhookService: ClerkWebhookService,
  ) {}

  @ApiOperation({
    summary: "Cadastra usuário",
    description:
      "Dados pessoais, endereço, e-mail e telefones; autenticação via Clerk. Role opcional (default ATTENDANT).",
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
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateUserDto): Promise<UserResponse> {
    return this.usersService.create(dto);
  }

  @Public()
  @Post("clerk-webhook")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Webhook Clerk",
    description: "Sincroniza user.created e user.updated (Svix).",
  })
  @ApiResponse({ status: 204, description: "Processado." })
  @ApiResponse({ status: 400, description: "Headers ou assinatura inválidos." })
  async clerkWebhook(
    @Body() body: unknown,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<void> {
    const svixId = headers["svix-id"];
    const svixTimestamp = headers["svix-timestamp"];
    const svixSignature = headers["svix-signature"];
    if (
      typeof svixId !== "string" ||
      typeof svixTimestamp !== "string" ||
      typeof svixSignature !== "string"
    ) {
      throw new BadRequestException("Headers necessários não fornecidos.");
    }
    await this.clerkWebhookService.process(
      body,
      svixId,
      svixTimestamp,
      svixSignature,
    );
  }

  @ApiOperation({ summary: "Lista usuários" })
  @ApiResponse({
    status: 200,
    description: "Lista obtida com sucesso.",
    type: UserResponse,
    isArray: true,
  })
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
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
  findOne(@Param() params: CuidParamDto): Promise<UserResponse> {
    return this.usersService.findOne(params.id);
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
    @Param() params: CuidParamDto,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponse> {
    return this.usersService.update(params.id, dto);
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
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param() params: CuidParamDto): Promise<UserResponse> {
    return this.usersService.remove(params.id);
  }
}
