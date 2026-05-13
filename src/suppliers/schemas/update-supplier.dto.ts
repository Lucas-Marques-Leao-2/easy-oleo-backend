import { nestZodDto } from "../../lib/nest-zod-dto";

import { createSupplierDtoBase } from "./create-supplier.dto";

export const updateSupplierDto = createSupplierDtoBase
  .omit({ cnpj: true })
  .partial()
  .openapi("UpdateSupplierDto", {
    example: {
      legalName: "Distribuidora Lubrificantes Nordeste S.A. — CD Maceió",
      street: "Av. Menino Marcelo",
      number: "5001",
      complement: "Bloco C",
      district: "Serraria",
      city: "Maceió",
      state: "AL",
      zipCode: "57046000",
      email: "comercial.novo@lubnordeste.com.br",
      phones: ["82981112233"],
    } as any,
  });

export interface UpdateSupplierDto {
  [key: string]: any;
}

export class UpdateSupplierDto extends nestZodDto(updateSupplierDto) {}
