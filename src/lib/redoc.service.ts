import { NestjsRedoxModule, type RedocOptions } from "nestjs-redox";

import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { patchNestjsSwagger } from "@wahyubucil/nestjs-zod-openapi";

export async function setupRedoc(app: INestApplication) {
  const builder = new DocumentBuilder()
    .setTitle("Easy Óleo API")
    .setDescription(
      "Distribuição de óleo automotivo. Os schemas gerados a partir dos DTOs são consumidos no frontend via Orval/OpenAPI.",
    )
    .setVersion("1.0")
    .addBearerAuth(
      {
        bearerFormat: "JWT",
        scheme: "bearer",
        type: "http",
      },
      "access-token",
    );

  patchNestjsSwagger({ schemasSort: "alpha" });

  const document = SwaggerModule.createDocument(app, builder.build());

  const redocOptions: RedocOptions = {
    hideHostname: false,
    logo: {
      altText: "NestJS",
      backgroundColor: "#f0f2f5",
      url: "https://nestjs.com/img/logo-small.svg",
    },
    pathInMiddlePanel: true,
    requiredPropsFirst: true,
    sortPropsAlphabetically: true,
    theme: {
      logo: {
        gutter: "10px",
        maxHeight: "50px",
        maxWidth: "50px",
      },
      rightPanel: {
        backgroundColor: "#545659",
      },
      sidebar: {
        backgroundColor: "#f0f2f5",
      },
      typography: {
        fontFamily: "Roboto, sans-serif",
        fontSize: "16px",
        fontWeightBold: "900",
        headings: {
          fontFamily: "Montserrat, sans-serif",
          fontWeight: "700",
          lineHeight: "1.6em",
        },
        optimizeSpeed: true,
        smoothing: "antialiased",
      },
    },
  };

  NestjsRedoxModule.setup(
    "/docs",
    app,
    document,
    {
      useGlobalPrefix: true,
      standalone: true,
    },
    redocOptions,
  );

  SwaggerModule.setup("swagger", app, document);
}
