import { z } from 'zod';

import { createZodDto } from '@wahyubucil/nestjs-zod-openapi';

import { zCpfDigitsString } from '../../lib/zod-brazilian-doc';

const phoneRegex = /^\d{11}$/;

export const createUserDtoBase = z.object({
  name: z.string().min(1).openapi({ example: 'Carla Administradora' }),
  cpf: zCpfDigitsString().openapi({
    description: 'CPF com 11 dígitos e dígitos verificadores válidos.',
    example: '52998224725',
  }),
  street: z.string().min(1).openapi({ example: 'Rua Principal' }),
  number: z.string().min(1).openapi({ example: '100' }),
  complement: z.string().optional().openapi({ example: 'Sala 1' }),
  district: z.string().optional().openapi({ example: 'Centro' }),
  city: z.string().min(1).openapi({ example: 'Maceió' }),
  state: z.string().length(2).openapi({ example: 'AL' }),
  zipCode: z.string().min(8).openapi({ example: '57020000' }),
  email: z.string().email().openapi({ example: 'carla@easyoleo.local' }),
  password: z
    .string()
    .min(8)
    .max(72)
    .openapi({
      description: 'Senha em texto; armazenada com hash.',
      example: 'SenhaSegura1!',
    }),
  role: z
    .enum(['ATTENDANT', 'SELLER', 'ADMIN'])
    .optional()
    .openapi({ example: 'ADMIN' }),
  phones: z
    .array(z.string().regex(phoneRegex))
    .optional()
    .openapi({ example: ['82991112233'] }),
});

export const createUserDto = createUserDtoBase.openapi('CreateUserDto', {
  example: {
    name: 'Carla Administradora',
    cpf: '52998224725',
    street: 'Rua Principal',
    number: '100',
    city: 'Maceió',
    state: 'AL',
    zipCode: '57020000',
    email: 'carla@easyoleo.local',
    password: 'SenhaSegura1!',
    role: 'ADMIN',
    phones: ['82991112233'],
  },
});

export class CreateUserDto extends createZodDto(createUserDto) {}
