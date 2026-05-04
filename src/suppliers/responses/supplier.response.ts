import { ApiProperty } from '@nestjs/swagger';

export class SupplierPhoneResponse {
  @ApiProperty({
    description: 'Identificador do telefone.',
    example: 'cm8k2qf3k0001w92v8x9abcde',
  })
  id: string;

  @ApiProperty({
    description: 'Telefone com DDD, 11 dígitos.',
    example: '82988887777',
  })
  number: string;
}

export class SupplierResponse {
  @ApiProperty({
    description: 'Identificador único (CUID).',
    example: 'cm8k2qf3k0000w92v8x9abcd',
  })
  id: string;

  @ApiProperty({
    description: 'Razão social.',
    example: 'Distribuidora Lubrificantes Nordeste S.A.',
  })
  legalName: string;

  @ApiProperty({
    description: 'CNPJ com 14 dígitos e dígitos verificadores válidos.',
    example: '11222333000181',
  })
  cnpj: string;

  @ApiProperty({
    description: 'Logradouro.',
    example: 'Rodovia BR-104',
  })
  street: string;

  @ApiProperty({
    description: 'Número.',
    example: 'Km 12',
  })
  number: string;

  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Complemento.',
    example: 'Anexo expedição',
  })
  complement: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Bairro / distrito.',
    example: 'Tabuleiro do Martins',
  })
  district: string | null;

  @ApiProperty({
    description: 'Município.',
    example: 'Maceió',
  })
  city: string;

  @ApiProperty({
    description: 'UF (2 letras).',
    example: 'AL',
  })
  state: string;

  @ApiProperty({
    description: 'CEP.',
    example: '57081065',
  })
  zipCode: string;

  @ApiProperty({
    format: 'email',
    description: 'E-mail comercial.',
    example: 'vendas@lubnordeste.com.br',
  })
  email: string;

  @ApiProperty({
    type: [SupplierPhoneResponse],
    description: 'Telefones cadastrados.',
    example: [
      { id: 'cm8k2qf3k0001w92v8x9abcde', number: '82988887777' },
      { id: 'cm8k2qf3k0002w92v8x9abcdf', number: '82334567890' },
    ],
  })
  phones: SupplierPhoneResponse[];

  @ApiProperty({
    description: 'Data de criação do registro.',
    example: '2026-04-23T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização.',
    example: '2026-04-23T18:30:00.000Z',
  })
  updatedAt: Date;
}
