"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = exports.createNestServer = void 0;
const core_1 = require("@nestjs/core");
const platform_express_1 = require("@nestjs/platform-express");
const app_module_1 = require("./app.module");
const https_1 = require("firebase-functions/v2/https");
const express_1 = __importDefault(require("express"));
const common_1 = require("@nestjs/common");
const swagger_1 = require("./swagger");
const server = (0, express_1.default)();
const createNestServer = async (expressInstance) => {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(expressInstance));
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
    await app.init();
};
exports.createNestServer = createNestServer;
(0, exports.createNestServer)(server);
exports.api = (0, https_1.onRequest)({ region: 'us-central1' }, server);
//# sourceMappingURL=index.js.map