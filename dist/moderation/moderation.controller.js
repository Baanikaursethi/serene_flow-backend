"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationController = void 0;
const common_1 = require("@nestjs/common");
const moderation_service_1 = require("./moderation.service");
const check_content_dto_1 = require("./dto/check-content.dto");
const auth_guard_1 = require("../common/guards/auth.guard");
const swagger_1 = require("@nestjs/swagger");
let ModerationController = class ModerationController {
    moderationService;
    constructor(moderationService) {
        this.moderationService = moderationService;
    }
    async checkSpacesContent(dto) {
        return this.moderationService.checkContent(dto);
    }
};
exports.ModerationController = ModerationController;
__decorate([
    (0, common_1.Post)('spaces'),
    (0, common_1.UseGuards)(auth_guard_1.FirebaseAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [check_content_dto_1.CheckContentDto]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "checkSpacesContent", null);
exports.ModerationController = ModerationController = __decorate([
    (0, swagger_1.ApiTags)('Moderation'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('moderation'),
    __metadata("design:paramtypes", [moderation_service_1.ModerationService])
], ModerationController);
//# sourceMappingURL=moderation.controller.js.map