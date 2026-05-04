import { isValidCNPJ, isValidCPF } from '@cosmixclub/docsafe-br';
import { z } from 'zod';

export function zCpfDigitsString(params?: z.RawCreateParams) {
  return z
    .string(params)
    .regex(/^\d{11}$/, { message: 'CPF deve ter 11 dígitos numéricos.' })
    .refine((s) => isValidCPF(s), { message: 'CPF inválido.' });
}

export function zCnpjDigitsString(params?: z.RawCreateParams) {
  return z
    .string(params)
    .regex(/^\d{14}$/, { message: 'CNPJ deve ter 14 dígitos numéricos.' })
    .refine((s) => isValidCNPJ(s), { message: 'CNPJ inválido.' });
}

export function zCustomerDocumentDigitsString() {
  return z
    .string({ required_error: 'CPF ou CNPJ é obrigatório.' })
    .regex(/^(?:\d{11}|\d{14})$/, {
      message: 'Informe CPF (11 dígitos) ou CNPJ (14 dígitos), só números.',
    })
    .superRefine((val, ctx) => {
      const d = val.replace(/\D/g, '');
      if (d.length === 11) {
        if (!isValidCPF(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'CPF inválido.',
          });
        }
      } else if (d.length === 14) {
        if (!isValidCNPJ(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'CNPJ inválido.',
          });
        }
      }
    });
}
