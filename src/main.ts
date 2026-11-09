import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Fail fast on missing JWT_SECRET — a missing secret means ALL token
  // operations will fail, which is better surfaced at startup than at
  // the first request.
  if (!process.env.JWT_SECRET) {
    logger.error(
      '[SECURITY] JWT_SECRET environment variable is not set. ' +
      'All token signing and verification will fail. ' +
      'Set JWT_SECRET in your .env file or environment before starting the server.',
    );
    // In production (Cloud Run / Firebase Functions), exit to force a restart
    // rather than silently serving 500s on every authenticated request.
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  setupSwagger(app);

  const port = process.env.APP_PORT || 3000;
  await app.listen(port);
  logger.log(`Serene Flow NestJS Backend is running on http://localhost:${port}`);
  logger.log(`Swagger documentation is running on http://localhost:${port}/docs`);
}
bootstrap();
