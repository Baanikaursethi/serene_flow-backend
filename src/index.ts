import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './swagger';

let nestServer: express.Express;

export const createNestServer = async (expressInstance: express.Express) => {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );

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
      forbidNonWhitelisted: false,
    }),
  );

  setupSwagger(app);

  await app.init();
};

// Export Firebase Cloud Function 'api' with lazy loading to prevent discovery timeouts
export const api = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 60,
  },
  async (req, res) => {
    if (!nestServer) {
      nestServer = express();
      await createNestServer(nestServer);
    }
    return nestServer(req, res);
  },
);
