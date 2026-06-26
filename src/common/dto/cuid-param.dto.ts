import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches } from "class-validator";

const CUID_PATTERN = /^c[a-z0-9]+$/;

export class CuidParamDto {
  @ApiProperty({ description: "CUID do recurso", example: "cm8user01abcd" })
  @IsString({ message: "ID inválido." })
  @IsNotEmpty({ message: "ID é obrigatório." })
  @Matches(CUID_PATTERN, { message: "ID inválido." })
  id!: string;
}
