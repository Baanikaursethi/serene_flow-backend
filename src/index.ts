import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import express from 'express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { setupSwagger } from './swagger';

const startupLogger = new Logger('CloudFunction');
const jwtSecret = defineSecret('JWT_SECRET');
const smtpPassword = defineSecret('SMTP_PASS_LOCAL');
const swaggerPassword = defineSecret('SWAGGER_PASSWORD');

let nestServer: express.Express;

export const createNestServer = async (expressInstance: express.Express) => {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );

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

  await app.init();
};

// Export Firebase Cloud Function 'api' with lazy loading to prevent discovery timeouts
export const api = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 60,
    secrets: [jwtSecret, smtpPassword, swaggerPassword],
  },
  async (req, res) => {
    // Firebase Functions only exposes bound secrets during invocation. Load it
    // before Nest ConfigModule initializes, and never start without it.
    try {
      const requiredSecrets = [
        ['JWT_SECRET', jwtSecret.value()],
        ['SMTP_PASS_LOCAL', smtpPassword.value()],
        ['SWAGGER_PASSWORD', swaggerPassword.value()],
      ] as const;
      for (const [name, value] of requiredSecrets) {
        if (!value) throw new Error(`${name} is empty`);
        process.env[name] = value;
      }
    } catch {
      startupLogger.error(
        '[SECURITY] A required Firebase secret is unavailable. Refusing to start the API.',
      );
      res.status(500).send('Server configuration error.');
      return;
    }

    if (!nestServer) {
      nestServer = express();
      await createNestServer(nestServer);
    }
    // Handle both /api prefix and direct path requests seamlessly
    if (req.url.startsWith('/api/') || req.url === '/api') {
      req.url = req.url.replace(/^\/api/, '') || '/';
    }
    return nestServer(req, res);
  },
);
