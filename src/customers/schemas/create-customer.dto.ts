import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CustomerType } from "@prisma/client";
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

import { IsCustomerDocument } from "../../common/validators/brazilian-doc.validators";
import {
  BRAZILIAN_PHONE_MESSAGE,
  BRAZILIAN_PHONE_REGEX,
} from "../../common/validators/phone.validators";

export class CreateCustomerDto {
  @ApiPropertyOptional({
    description: "Pessoa física ou jurídica. Se omitido, usa PF.",
    enum: CustomerType,
    example: CustomerType.PJ,
  })
  @IsOptional()
  @IsEnum(CustomerType, { message: "Tipo inválido." })
  type?: CustomerType;

  @ApiProperty({
    description: "Nome (PF) ou razão social (PJ).",
    example: "Auto Peças Maceió Ltda",
  })
  @IsString({ message: "Nome ou razão social é obrigatório." })
  @IsNotEmpty({ message: "Nome ou razão social não pode ser vazio." })
  @MaxLength(300)
  name!: string;

  @ApiProperty({
    description:
      "CPF (11 dígitos) ou CNPJ (14 dígitos), só números; dígitos verificadores conferidos.",
    example: "11222333000181",
  })
  @IsCustomerDocument()
  document!: string;

  @ApiProperty({ description: "Logradouro.", example: "Av. Álvaro Otacílio" })
  @IsString()
  @IsNotEmpty()
  street!: string;

  @ApiProperty({ description: "Número.", example: "4512" })
  @IsString()
  @IsNotEmpty()
  number!: string;

  @ApiPropertyOptional({ description: "Complemento.", example: "Galpão B" })
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiPropertyOptional({ description: "Bairro.", example: "Ponta Verde" })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({ description: "Cidade.", example: "Maceió" })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ description: "UF (2 letras).", example: "AL" })
  @IsString()
  @Length(2, 2)
  state!: string;

  @ApiProperty({ description: "CEP.", example: "57035290" })
  @IsString()
  @MinLength(8)
  @MaxLength(9)
  zipCode!: string;

  @ApiProperty({
    description: "E-mail de contato.",
    example: "compras@autopecasmaceio.com.br",
  })
  @IsEmail({}, { message: "E-mail inválido." })
  email!: string;

  @ApiPropertyOptional({
    description: "Telefones com DDD (11 dígitos, somente números).",
    example: ["82999998888", "82332112345"],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Matches(BRAZILIAN_PHONE_REGEX, {
    each: true,
    message: BRAZILIAN_PHONE_MESSAGE,
  })
  phones?: string[];
}
