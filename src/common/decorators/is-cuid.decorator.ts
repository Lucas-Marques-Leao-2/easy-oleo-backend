import { applyDecorators } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches } from "class-validator";

const CUID_PATTERN = /^c[a-z0-9]+$/;

export function IsCuidField(options?: {
  optional?: boolean;
  example?: string;
}) {
  const decorators = [
    options?.optional
      ? ApiPropertyOptional()
      : ApiProperty({ example: options?.example ?? "cm8abc01xyz" }),
    IsString({ message: "ID inválido." }),
    ...(options?.optional
      ? []
      : [IsNotEmpty({ message: "ID é obrigatório." })]),
    Matches(CUID_PATTERN, { message: "ID inválido." }),
  ];
  return applyDecorators(...decorators);
}
