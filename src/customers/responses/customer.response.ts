import { ApiProperty } from "@nestjs/swagger";

export class CustomerPhoneResponse {
  @ApiProperty({
    description: "Identificador do telefone.",
    example: "cm8k2qf3k0001w92v8x9abcde",
  })
  id: string;

  @ApiProperty({
    description: "Telefone com DDD, 11 dígitos.",
    example: "82999998888",
  })
  number: string;
}

export class CustomerResponse {
  @ApiProperty({
    description: "Identificador único (CUID).",
    example: "cm8k2qf3k0000w92v8x9abcd",
  })
  id: string;

  @ApiProperty({
    enum: ["PF", "PJ"],
    description: "Tipo de pessoa.",
    example: "PJ",
  })
  type: string;

  @ApiProperty({
    description: "Nome (PF) ou razão social (PJ).",
    example: "Auto Peças Maceió Ltda",
  })
  name: string;

  @ApiProperty({
    description:
      "CPF (11 dígitos) ou CNPJ (14 dígitos), só números; dígitos verificadores válidos.",
    example: "11222333000181",
  })
  document: string;

  @ApiProperty({
    description: "Logradouro.",
    example: "Av. Álvaro Otacílio",
  })
  street: string;

  @ApiProperty({
    description: "Número.",
    example: "4512",
  })
  number: string;

  @ApiProperty({
    required: false,
    nullable: true,
    description: "Complemento.",
    example: "Galpão B",
  })
  complement: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
    description: "Bairro.",
    example: "Ponta Verde",
  })
  district: string | null;

  @ApiProperty({
    description: "Município.",
    example: "Maceió",
  })
  city: string;

  @ApiProperty({
    description: "UF (2 letras).",
    example: "AL",
  })
  state: string;

  @ApiProperty({
    description: "CEP (somente números ou formatado conforme cadastro).",
    example: "57035290",
  })
  zipCode: string;

  @ApiProperty({
    format: "email",
    description: "E-mail de contato.",
    example: "compras@autopecasmaceio.com.br",
  })
  email: string;

  @ApiProperty({
    type: [CustomerPhoneResponse],
    description: "Telefones cadastrados.",
    example: [
      {
        id: "cm8k2qf3k0001w92v8x9abcde",
        number: "82999998888",
      },
      {
        id: "cm8k2qf3k0002w92v8x9abcdf",
        number: "82332112345",
      },
    ],
  })
  phones: CustomerPhoneResponse[];

  @ApiProperty({
    description: "Data de criação do registro.",
    example: "2026-04-23T12:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Data da última atualização.",
    example: "2026-04-23T18:30:00.000Z",
  })
  updatedAt: Date;
}
