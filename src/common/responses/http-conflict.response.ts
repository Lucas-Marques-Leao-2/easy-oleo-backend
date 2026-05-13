import { ApiProperty } from "@nestjs/swagger";

export class HttpConflictResponse {
  @ApiProperty({ example: 409, description: "Código HTTP." })
  statusCode: number;

  @ApiProperty({
    example: "Recurso já está em uso.",
    description: "Mensagem explicando o conflito.",
  })
  message: string | string[];

  @ApiProperty({ example: "Conflict", description: "Rótulo do erro HTTP." })
  error: string;
}
