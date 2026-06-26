import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

import { IsCnpj } from "../../common/validators/brazilian-doc.validators";
import {
  BRAZILIAN_PHONE_MESSAGE,
  BRAZILIAN_PHONE_REGEX,
} from "../../common/validators/phone.validators";

export class CreateSupplierDto {
  @ApiProperty({
    description: "Razão social do fornecedor.",
    example: "Distribuidora Lubrificantes Nordeste S.A.",
  })
  @IsString({ message: "Razão social é obrigatória." })
  @IsNotEmpty()
  @MaxLength(300)
  legalName!: string;

  @ApiProperty({
    description:
      "CNPJ com 14 dígitos e dígitos verificadores válidos, só números.",
    example: "11222333000181",
  })
  @IsCnpj()
  cnpj!: string;

  @ApiProperty({ description: "Logradouro.", example: "Rodovia BR-104" })
  @IsString()
  @IsNotEmpty()
  street!: string;

  @ApiProperty({ description: "Número ou referência.", example: "Km 12" })
  @IsString()
  @IsNotEmpty()
  number!: string;

  @ApiPropertyOptional({
    description: "Complemento.",
    example: "Anexo expedição",
  })
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiPropertyOptional({
    description: "Bairro ou distrito.",
    example: "Tabuleiro do Martins",
  })
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

  @ApiProperty({ description: "CEP.", example: "57081065" })
  @IsString()
  @MinLength(8)
  @MaxLength(9)
  zipCode!: string;

  @ApiProperty({
    description: "E-mail comercial.",
    example: "vendas@lubnordeste.com.br",
  })
  @IsEmail({}, { message: "E-mail inválido." })
  email!: string;

  @ApiPropertyOptional({
    description: "Telefones com DDD (11 dígitos).",
    example: ["82988887777", "82334567890"],
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
