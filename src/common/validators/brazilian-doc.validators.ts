import { isValidCNPJ, isValidCPF } from "@cosmixclub/docsafe-br";
import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from "class-validator";

@ValidatorConstraint({ name: "isCpf", async: false })
export class IsCpfConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== "string") return false;
    if (!/^\d{11}$/.test(value)) return false;
    return isValidCPF(value);
  }

  defaultMessage(): string {
    return "CPF inválido.";
  }
}

export function IsCpf(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCpfConstraint,
    });
  };
}

@ValidatorConstraint({ name: "isCnpj", async: false })
export class IsCnpjConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== "string") return false;
    if (!/^\d{14}$/.test(value)) return false;
    return isValidCNPJ(value);
  }

  defaultMessage(): string {
    return "CNPJ inválido.";
  }
}

export function IsCnpj(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCnpjConstraint,
    });
  };
}

@ValidatorConstraint({ name: "isCustomerDocument", async: false })
export class IsCustomerDocumentConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== "string") return false;
    const digits = value.replace(/\D/g, "");
    if (digits.length === 11) return isValidCPF(value);
    if (digits.length === 14) return isValidCNPJ(value);
    return false;
  }

  defaultMessage(args: ValidationArguments): string {
    const value = args.value;
    if (typeof value !== "string" || !/^(?:\d{11}|\d{14})$/.test(value)) {
      return "Informe CPF (11 dígitos) ou CNPJ (14 dígitos), só números.";
    }
    const digits = value.replace(/\D/g, "");
    return digits.length === 11 ? "CPF inválido." : "CNPJ inválido.";
  }
}

export function IsCustomerDocument(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCustomerDocumentConstraint,
    });
  };
}
