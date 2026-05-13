import "@wahyubucil/nestjs-zod-openapi/boot";

import { clerkMiddleware } from "@clerk/express";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { setupRedoc } from "./lib/redoc.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const publishableKey = configService.get<string>("CLERK_PUBLISHABLE_KEY");
  const secretKey = configService.get<string>("CLERK_SECRET_KEY");
  if (publishableKey && secretKey) {
    app.use(
      clerkMiddleware({
        publishableKey,
        secretKey,
      }),
    );
  }

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()) ?? true,
  });

  await setupRedoc(app);

  const port = Number(process.env.PORT) || 8082;
  await app.listen(port, "0.0.0.0");
}

bootstrap();
