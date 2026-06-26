import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from "class-validator";

import { IsCpf } from "../../common/validators/brazilian-doc.validators";
import {
  BRAZILIAN_PHONE_MESSAGE,
  BRAZILIAN_PHONE_REGEX,
} from "../../common/validators/phone.validators";

export class CreateUserDto {
  @ApiProperty({ example: "Carla Administradora" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: "CPF com 11 dígitos e dígitos verificadores válidos.",
    example: "52998224725",
  })
  @IsCpf()
  cpf!: string;

  @ApiProperty({ example: "Rua Principal" })
  @IsString()
  @IsNotEmpty()
  street!: string;

  @ApiProperty({ example: "100" })
  @IsString()
  @IsNotEmpty()
  number!: string;

  @ApiPropertyOptional({ example: "Sala 1" })
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiPropertyOptional({ example: "Centro" })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({ example: "Maceió" })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ example: "AL" })
  @IsString()
  @Length(2, 2)
  state!: string;

  @ApiProperty({ example: "57020000" })
  @IsString()
  @MinLength(8)
  zipCode!: string;

  @ApiProperty({ example: "carla@easyoleo.local" })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.ADMIN })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: ["82991112233"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Matches(BRAZILIAN_PHONE_REGEX, {
    each: true,
    message: BRAZILIAN_PHONE_MESSAGE,
  })
  phones?: string[];
}
