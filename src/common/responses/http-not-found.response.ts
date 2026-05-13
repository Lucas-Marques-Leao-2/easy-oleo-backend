import { ApiProperty } from "@nestjs/swagger";

export class HttpNotFoundResponse {
  @ApiProperty({ example: 404, description: "Código HTTP." })
  statusCode: number;

  @ApiProperty({
    example: "Recurso não encontrado.",
    description: "Mensagem explicando o recurso ausente.",
  })
  message: string;

  @ApiProperty({ example: "Not Found", description: "Rótulo do erro HTTP." })
  error: string;
}
