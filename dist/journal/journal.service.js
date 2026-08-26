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
exports.JournalService = void 0;
const common_1 = require("@nestjs/common");
const firebase_1 = require("../firebase");
let JournalService = class JournalService {
    firebaseService;
    constructor(firebaseService) {
        this.firebaseService = firebaseService;
    }
    async getUserEntries(userPayload) {
        const email = userPayload.email.toLowerCase();
        const firestore = this.firebaseService.firestore;
        if (firestore) {
            const snap = await firestore
                .collection('journals')
                .where('userEmail', '==', email)
                .get();
            const entries = snap.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            return entries.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
        }
        else {
            const journalsMap = this.firebaseService.getCollection('journals');
            const entries = Array.from(journalsMap.values()).filter((j) => j.userEmail === email);
            return entries.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
        }
    }
    async createEntry(userPayload, dto) {
        const email = userPayload.email.toLowerCase();
        const firestore = this.firebaseService.firestore;
        const existingEntries = await this.getUserEntries(userPayload);
        const recentDuplicate = existingEntries.find((e) => e.title === dto.title &&
            e.content === dto.content &&
            Math.abs(Date.now() - new Date(e.created).getTime()) < 5000);
        if (recentDuplicate) {
            return recentDuplicate;
        }
        const id = 'jrn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const now = new Date().toISOString();
        const newEntry = {
            id,
            userEmail: email,
            userId: userPayload.uid,
            title: dto.title,
            content: dto.content,
            created: now,
        };
        if (firestore) {
            await firestore.collection('journals').doc(id).set(newEntry);
        }
        else {
            const journalsMap = this.firebaseService.getCollection('journals');
            journalsMap.set(id, newEntry);
        }
        return newEntry;
    }
    async updateEntry(userPayload, id, dto) {
        const email = userPayload.email.toLowerCase();
        const firestore = this.firebaseService.firestore;
        let entry = null;
        if (firestore) {
            const docRef = firestore.collection('journals').doc(id);
            const doc = await docRef.get();
            if (!doc.exists)
                throw new common_1.NotFoundException('Journal entry not found');
            entry = doc.data();
            if (entry.userEmail !== email) {
                throw new common_1.ForbiddenException('You do not have permission to edit this journal entry');
            }
            const updates = {
                ...(dto.title !== undefined ? { title: dto.title } : {}),
                ...(dto.content !== undefined ? { content: dto.content } : {}),
                edited: new Date().toISOString(),
            };
            await docRef.update(updates);
            return { ...entry, ...updates, id };
        }
        else {
            const journalsMap = this.firebaseService.getCollection('journals');
            entry = journalsMap.get(id);
            if (!entry)
                throw new common_1.NotFoundException('Journal entry not found');
            if (entry.userEmail !== email) {
                throw new common_1.ForbiddenException('You do not have permission to edit this journal entry');
            }
            if (dto.title !== undefined)
                entry.title = dto.title;
            if (dto.content !== undefined)
                entry.content = dto.content;
            entry.edited = new Date().toISOString();
            journalsMap.set(id, entry);
            return entry;
        }
    }
    async deleteEntry(userPayload, id) {
        const email = userPayload.email.toLowerCase();
        const firestore = this.firebaseService.firestore;
        if (firestore) {
            const docRef = firestore.collection('journals').doc(id);
            const doc = await docRef.get();
            if (!doc.exists)
                throw new common_1.NotFoundException('Journal entry not found');
            const entry = doc.data();
            if (entry?.userEmail !== email) {
                throw new common_1.ForbiddenException('You do not have permission to delete this journal entry');
            }
            await docRef.delete();
        }
        else {
            const journalsMap = this.firebaseService.getCollection('journals');
            const entry = journalsMap.get(id);
            if (!entry)
                throw new common_1.NotFoundException('Journal entry not found');
            if (entry.userEmail !== email) {
                throw new common_1.ForbiddenException('You do not have permission to delete this journal entry');
            }
            journalsMap.delete(id);
        }
        return { message: 'Journal entry deleted successfully', id };
    }
};
exports.JournalService = JournalService;
exports.JournalService = JournalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_1.FirebaseService])
], JournalService);
//# sourceMappingURL=journal.service.js.map