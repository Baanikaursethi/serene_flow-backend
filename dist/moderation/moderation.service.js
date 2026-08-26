"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationService = void 0;
const common_1 = require("@nestjs/common");
let ModerationService = class ModerationService {
    forbiddenPatterns = [
        /\b(suicide|self-harm|kill myself|end my life)\b/i,
        /\b(hate|slur|racist)\b/i,
    ];
    async checkContent(dto) {
        const text = dto.text;
        for (const pattern of this.forbiddenPatterns) {
            if (pattern.test(text)) {
                throw new common_1.BadRequestException({
                    approved: false,
                    reason: 'Content contains restricted or inappropriate language.',
                });
            }
        }
        return {
            approved: true,
            reason: 'Content passes moderation checks.',
        };
    }
};
exports.ModerationService = ModerationService;
exports.ModerationService = ModerationService = __decorate([
    (0, common_1.Injectable)()
], ModerationService);
//# sourceMappingURL=moderation.service.js.map