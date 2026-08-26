import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';

export function setupSwagger(app: INestApplication) {
  const swaggerUser = process.env.SWAGGER_USER || 'admin';
  const swaggerPass = process.env.SWAGGER_PASSWORD || 'adminpass';

  // Protect Swagger endpoints with Basic Auth
  app.use(
    ['/docs', '/docs-json', '/docs-html'],
    basicAuth({
      challenge: true,
      users: { [swaggerUser]: swaggerPass },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Serene Flow API')
    .setDescription('The Serene Flow API description and testing endpoints')
    .setVersion('1.0')
    .addServer('/serene-flow-9e7e4/us-central1/api', 'Firebase Local Emulator')
    .addServer('/', 'Local NestJS Server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
