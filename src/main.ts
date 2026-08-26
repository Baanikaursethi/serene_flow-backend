import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  setupSwagger(app);

  const port = process.env.APP_PORT || 3000;
  await app.listen(port);
  logger.log(`Serene Flow NestJS Backend is running on http://localhost:${port}`);
  logger.log(`Swagger documentation is running on http://localhost:${port}/docs`);
}
bootstrap();
