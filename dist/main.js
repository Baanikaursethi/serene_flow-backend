"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("./swagger");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
    }));
    (0, swagger_1.setupSwagger)(app);
    const port = process.env.APP_PORT || 3000;
    await app.listen(port);
    logger.log(`Serene Flow NestJS Backend is running on http://localhost:${port}`);
    logger.log(`Swagger documentation is running on http://localhost:${port}/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map