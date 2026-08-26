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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoodService = void 0;
const common_1 = require("@nestjs/common");
const firebase_1 = require("../firebase");
let MoodService = class MoodService {
    firebaseService;
    constructor(firebaseService) {
        this.firebaseService = firebaseService;
    }
    async createMood(userPayload, dto) {
        const email = userPayload.email.toLowerCase();
        const firestore = this.firebaseService.firestore;
        const id = 'mood_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const now = new Date().toISOString();
        const moodEntry = {
            id,
            userEmail: email,
            userId: userPayload.uid,
            rating: dto.rating,
            moodLabel: dto.moodLabel,
            emotions: dto.emotions || [],
            notes: dto.notes || '',
            recommendedExercise: dto.recommendedExercise || null,
            timestamp: now,
        };
        if (firestore) {
            await firestore.collection('moods').doc(id).set(moodEntry);
        }
        else {
            const moodsMap = this.firebaseService.getCollection('moods');
            moodsMap.set(id, moodEntry);
        }
        return moodEntry;
    }
    async getMoodHistory(userPayload) {
        const email = userPayload.email.toLowerCase();
        const firestore = this.firebaseService.firestore;
        if (firestore) {
            const snap = await firestore
                .collection('moods')
                .where('userEmail', '==', email)
                .get();
            const moods = snap.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            return moods.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
        else {
            const moodsMap = this.firebaseService.getCollection('moods');
            const moods = Array.from(moodsMap.values()).filter((m) => m.userEmail === email);
            return moods.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
    }
    async getLatestMood(userPayload) {
        const history = await this.getMoodHistory(userPayload);
        return history.length > 0 ? history[0] : null;
    }
    async getMoodTrends(userPayload) {
        const history = await this.getMoodHistory(userPayload);
        if (history.length === 0) {
            return {
                totalCheckIns: 0,
                averageRating: 0,
                streak: 0,
                distribution: {},
                recentTimeline: [],
            };
        }
        const totalCheckIns = history.length;
        const sumRating = history.reduce((acc, m) => acc + (m.rating || 3), 0);
        const averageRating = Number((sumRating / totalCheckIns).toFixed(2));
        const distribution = {};
        history.forEach((m) => {
            const label = m.moodLabel || 'Neutral';
            distribution[label] = (distribution[label] || 0) + 1;
        });
        let currentStreak = 0;
        const dates = Array.from(new Set(history.map((m) => new Date(m.timestamp).toISOString().split('T')[0]))).sort().reverse();
        const todayStr = new Date().toISOString().split('T')[0];
        const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (dates.includes(todayStr) || dates.includes(yesterdayStr)) {
            currentStreak = 1;
            let checkDate = new Date(dates[0]);
            for (let i = 1; i < dates.length; i++) {
                const prev = new Date(dates[i]);
                const diffDays = Math.round((checkDate.getTime() - prev.getTime()) / (1000 * 3600 * 24));
                if (diffDays === 1) {
                    currentStreak++;
                    checkDate = prev;
                }
                else {
                    break;
                }
            }
        }
        return {
            totalCheckIns,
            averageRating,
            streak: currentStreak,
            distribution,
            recentTimeline: history.slice(0, 30),
        };
    }
};
exports.MoodService = MoodService;
exports.MoodService = MoodService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_1.FirebaseService])
], MoodService);
//# sourceMappingURL=mood.service.js.map