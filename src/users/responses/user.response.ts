import { ApiProperty } from '@nestjs/swagger';

export class UserPhoneResponse {
  @ApiProperty({ example: 'cm8uph01abcd' })
  id: string;

  @ApiProperty({ example: '82991112233' })
  number: string;
}

export class UserResponse {
  @ApiProperty({ example: 'cm8user01abcd' })
  id: string;

  @ApiProperty({ example: 'Carla Administradora' })
  name: string;

  @ApiProperty({
    description: 'CPF com 11 dígitos e dígitos verificadores válidos.',
    example: '52998224725',
  })
  cpf: string;

  @ApiProperty({ example: 'Rua Principal' })
  street: string;

  @ApiProperty({ example: '100' })
  number: string;

  @ApiProperty({ required: false, nullable: true, example: null })
  complement: string | null;

  @ApiProperty({ required: false, nullable: true, example: 'Centro' })
  district: string | null;

  @ApiProperty({ example: 'Maceió' })
  city: string;

  @ApiProperty({ example: 'AL' })
  state: string;

  @ApiProperty({ example: '57020000' })
  zipCode: string;

  @ApiProperty({ example: 'carla@easyoleo.local' })
  email: string;

  @ApiProperty({ enum: ['ATTENDANT', 'SELLER', 'ADMIN'], example: 'ADMIN' })
  role: string;

  @ApiProperty({ type: [UserPhoneResponse] })
  phones: UserPhoneResponse[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
