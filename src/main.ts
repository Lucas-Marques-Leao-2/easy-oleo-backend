import "@wahyubucil/nestjs-zod-openapi/boot";

import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { setupRedoc } from "./lib/redoc.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()) ?? true,
  });

  await setupRedoc(app);

  await app.listen(process.env.PORT ?? 8082);
}

bootstrap();
