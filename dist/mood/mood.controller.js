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
exports.MoodController = void 0;
const common_1 = require("@nestjs/common");
const mood_service_1 = require("./mood.service");
const auth_guard_1 = require("../common/guards/auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const create_mood_dto_1 = require("./dto/create-mood.dto");
const swagger_1 = require("@nestjs/swagger");
let MoodController = class MoodController {
    moodService;
    constructor(moodService) {
        this.moodService = moodService;
    }
    async getMoodHistory(user) {
        return this.moodService.getMoodHistory(user);
    }
    async createMood(user, dto) {
        return this.moodService.createMood(user, dto);
    }
    async getLatestMood(user) {
        return this.moodService.getLatestMood(user);
    }
    async getMoodTrends(user) {
        return this.moodService.getMoodTrends(user);
    }
};
exports.MoodController = MoodController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MoodController.prototype, "getMoodHistory", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_mood_dto_1.CreateMoodDto]),
    __metadata("design:returntype", Promise)
], MoodController.prototype, "createMood", null);
__decorate([
    (0, common_1.Get)('latest'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MoodController.prototype, "getLatestMood", null);
__decorate([
    (0, common_1.Get)('trends'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MoodController.prototype, "getMoodTrends", null);
exports.MoodController = MoodController = __decorate([
    (0, swagger_1.ApiTags)('Moods'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('moods'),
    (0, common_1.UseGuards)(auth_guard_1.FirebaseAuthGuard),
    __metadata("design:paramtypes", [mood_service_1.MoodService])
], MoodController);
//# sourceMappingURL=mood.controller.js.map