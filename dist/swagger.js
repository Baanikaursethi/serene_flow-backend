"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = setupSwagger;
const swagger_1 = require("@nestjs/swagger");
const express_basic_auth_1 = __importDefault(require("express-basic-auth"));
function setupSwagger(app) {
    const swaggerUser = process.env.SWAGGER_USER || 'admin';
    const swaggerPass = process.env.SWAGGER_PASSWORD || 'adminpass';
    app.use(['/docs', '/docs-json', '/docs-html'], (0, express_basic_auth_1.default)({
        challenge: true,
        users: { [swaggerUser]: swaggerPass },
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Serene Flow API')
        .setDescription('The Serene Flow API description and testing endpoints')
        .setVersion('1.0')
        .addServer('/serene-flow-9e7e4/us-central1/api', 'Firebase Local Emulator')
        .addServer('/', 'Local NestJS Server')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
    }, 'JWT-auth')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });
}
//# sourceMappingURL=swagger.js.map