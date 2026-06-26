import { BadRequestException } from "@nestjs/common";

export class InsufficientStockException extends BadRequestException {
  constructor(message = "Estoque insuficiente.") {
    super(message);
  }
}
