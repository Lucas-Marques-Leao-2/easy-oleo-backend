import { ApiProperty } from '@nestjs/swagger';

export class HttpBadRequestResponse {
  @ApiProperty({ example: 400, description: 'Código HTTP.' })
  statusCode: number;

  @ApiProperty({
    example: 'Só é possível editar pedido em rascunho (DRAFT).',
    description: 'Mensagem explicando a regra de negócio ou validação.',
  })
  message: string;

  @ApiProperty({
    example: 'Bad Request',
    description: 'Rótulo do erro HTTP.',
  })
  error: string;
}
