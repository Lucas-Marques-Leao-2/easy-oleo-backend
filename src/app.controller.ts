import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { AppService } from "./app.service";

@ApiTags("App")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: "Health check" })
  @ApiResponse({
    status: 200,
    description: "Serviço ativo.",
    schema: {
      type: "string",
      example: "Easy Óleo API — ok",
    },
  })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
