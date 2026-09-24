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

  const isEmulator = process.env.FIRESTORE_EMULATOR_HOST || process.env.FUNCTIONS_EMULATOR;

  const builder = new DocumentBuilder()
    .setTitle('Serene Flow API')
    .setDescription('The Serene Flow API description and testing endpoints')
    .setVersion('1.0');

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    'sereneflow-prod-bb1c6';

  if (isEmulator) {
    builder.addServer(`/${projectId}/us-central1/api`, 'Firebase Local Emulator');
    builder.addServer('/', 'Production / Direct Local NestJS');
  } else {
    builder.addServer('/', 'Production / Direct Local NestJS (Default)');
    builder.addServer(`/${projectId}/us-central1/api`, 'Firebase Cloud Function');
  }

  const config = builder
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
