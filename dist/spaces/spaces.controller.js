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
exports.SpacesController = void 0;
const common_1 = require("@nestjs/common");
const spaces_service_1 = require("./spaces.service");
const auth_guard_1 = require("../common/guards/auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const dto_1 = require("./dto");
const swagger_1 = require("@nestjs/swagger");
let SpacesController = class SpacesController {
    spacesService;
    constructor(spacesService) {
        this.spacesService = spacesService;
    }
    async getPosts() {
        return this.spacesService.getPosts();
    }
    async createPost(user, dto) {
        return this.spacesService.createPost(user, dto);
    }
    async updatePost(user, id, dto) {
        return this.spacesService.updatePost(user, id, dto);
    }
    async deletePost(user, id) {
        return this.spacesService.deletePost(user, id);
    }
    async toggleReaction(user, id, dto) {
        return this.spacesService.toggleReaction(user, id, dto);
    }
    async addReply(user, id, dto) {
        return this.spacesService.addReply(user, id, dto);
    }
    async getReplies(id) {
        return this.spacesService.getReplies(id);
    }
};
exports.SpacesController = SpacesController;
__decorate([
    (0, common_1.Get)('posts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "getPosts", null);
__decorate([
    (0, common_1.Post)('posts'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreatePostDto]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "createPost", null);
__decorate([
    (0, common_1.Patch)('posts/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.UpdatePostDto]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "updatePost", null);
__decorate([
    (0, common_1.Delete)('posts/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "deletePost", null);
__decorate([
    (0, common_1.Post)('posts/:id/reactions'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.AddReactionDto]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "toggleReaction", null);
__decorate([
    (0, common_1.Post)('posts/:id/replies'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.AddReplyDto]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "addReply", null);
__decorate([
    (0, common_1.Get)('posts/:id/replies'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SpacesController.prototype, "getReplies", null);
exports.SpacesController = SpacesController = __decorate([
    (0, swagger_1.ApiTags)('Spaces'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('spaces'),
    (0, common_1.UseGuards)(auth_guard_1.FirebaseAuthGuard),
    __metadata("design:paramtypes", [spaces_service_1.SpacesService])
], SpacesController);
//# sourceMappingURL=spaces.controller.js.map