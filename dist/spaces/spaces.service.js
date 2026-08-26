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
exports.SpacesService = void 0;
const common_1 = require("@nestjs/common");
const firebase_1 = require("../firebase");
const moderation_1 = require("../moderation");
let SpacesService = class SpacesService {
    firebaseService;
    moderationService;
    constructor(firebaseService, moderationService) {
        this.firebaseService = firebaseService;
        this.moderationService = moderationService;
    }
    async getPosts() {
        const firestore = this.firebaseService.firestore;
        let posts = [];
        if (firestore) {
            const snap = await firestore.collection('posts').get();
            posts = snap.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
        }
        else {
            const postsMap = this.firebaseService.getCollection('posts');
            posts = Array.from(postsMap.values());
        }
        return posts.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    }
    async createPost(userPayload, dto) {
        await this.moderationService.checkContent({ text: dto.text });
        const email = userPayload.email.toLowerCase();
        const isAnonymous = !!dto.anonymous;
        const firestore = this.firebaseService.firestore;
        const id = 'post_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const now = new Date().toISOString();
        const newPost = {
            id,
            text: dto.text,
            time: now,
            anonymous: isAnonymous,
            authorName: isAnonymous ? null : (userPayload.name || email.split('@')[0]),
            authorEmail: email,
            authorUid: userPayload.uid,
            reactions: {},
            replies: [],
        };
        if (firestore) {
            await firestore.collection('posts').doc(id).set(newPost);
        }
        else {
            const postsMap = this.firebaseService.getCollection('posts');
            postsMap.set(id, newPost);
        }
        return newPost;
    }
    async updatePost(userPayload, id, dto) {
        await this.moderationService.checkContent({ text: dto.text });
        const email = userPayload.email.toLowerCase();
        const firestore = this.firebaseService.firestore;
        let post = null;
        if (firestore) {
            const docRef = firestore.collection('posts').doc(id);
            const doc = await docRef.get();
            if (!doc.exists)
                throw new common_1.NotFoundException('Community post not found');
            post = doc.data();
            if (post.authorEmail !== email && post.authorUid !== userPayload.uid) {
                throw new common_1.ForbiddenException('You are not authorized to edit another user\'s post');
            }
            const updates = { text: dto.text, edited: new Date().toISOString() };
            await docRef.update(updates);
            return { ...post, ...updates, id };
        }
        else {
            const postsMap = this.firebaseService.getCollection('posts');
            post = postsMap.get(id);
            if (!post)
                throw new common_1.NotFoundException('Community post not found');
            if (post.authorEmail !== email && post.authorUid !== userPayload.uid) {
                throw new common_1.ForbiddenException('You are not authorized to edit another user\'s post');
            }
            post.text = dto.text;
            post.edited = new Date().toISOString();
            postsMap.set(id, post);
            return post;
        }
    }
    async deletePost(userPayload, id) {
        const email = userPayload.email.toLowerCase();
        const isCeo = userPayload.role === 'ceo' || email === 'sereneflow27@gmail.com';
        const firestore = this.firebaseService.firestore;
        if (firestore) {
            const docRef = firestore.collection('posts').doc(id);
            const doc = await docRef.get();
            if (!doc.exists)
                throw new common_1.NotFoundException('Community post not found');
            const post = doc.data();
            if (!isCeo && post?.authorEmail !== email && post?.authorUid !== userPayload.uid) {
                throw new common_1.ForbiddenException('Only the post author or CEO/Admin can delete this community post');
            }
            await docRef.delete();
        }
        else {
            const postsMap = this.firebaseService.getCollection('posts');
            const post = postsMap.get(id);
            if (!post)
                throw new common_1.NotFoundException('Community post not found');
            if (!isCeo && post.authorEmail !== email && post.authorUid !== userPayload.uid) {
                throw new common_1.ForbiddenException('Only the post author or CEO/Admin can delete this community post');
            }
            postsMap.delete(id);
        }
        return { message: 'Community post deleted successfully', id };
    }
    async toggleReaction(userPayload, id, dto) {
        const firestore = this.firebaseService.firestore;
        const key = dto.reactionType.toLowerCase();
        if (firestore) {
            const docRef = firestore.collection('posts').doc(id);
            const doc = await docRef.get();
            if (!doc.exists)
                throw new common_1.NotFoundException('Post not found');
            const post = doc.data();
            const reactions = post.reactions || {};
            reactions[key] = (reactions[key] || 0) + 1;
            await docRef.update({ reactions });
            return { id, reactions };
        }
        else {
            const postsMap = this.firebaseService.getCollection('posts');
            const post = postsMap.get(id);
            if (!post)
                throw new common_1.NotFoundException('Post not found');
            post.reactions = post.reactions || {};
            post.reactions[key] = (post.reactions[key] || 0) + 1;
            postsMap.set(id, post);
            return { id, reactions: post.reactions };
        }
    }
    async addReply(userPayload, id, dto) {
        await this.moderationService.checkContent({ text: dto.text });
        const email = userPayload.email.toLowerCase();
        const isAnonymous = !!dto.anonymous;
        const firestore = this.firebaseService.firestore;
        const replyId = 'rpl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const newReply = {
            id: replyId,
            text: dto.text,
            time: new Date().toISOString(),
            anonymous: isAnonymous,
            authorName: isAnonymous ? null : (userPayload.name || email.split('@')[0]),
            authorEmail: email,
        };
        if (firestore) {
            const docRef = firestore.collection('posts').doc(id);
            const doc = await docRef.get();
            if (!doc.exists)
                throw new common_1.NotFoundException('Post not found');
            const post = doc.data();
            const replies = [...(post.replies || []), newReply];
            await docRef.update({ replies });
            return newReply;
        }
        else {
            const postsMap = this.firebaseService.getCollection('posts');
            const post = postsMap.get(id);
            if (!post)
                throw new common_1.NotFoundException('Post not found');
            post.replies = [...(post.replies || []), newReply];
            postsMap.set(id, post);
            return newReply;
        }
    }
    async getReplies(id) {
        const firestore = this.firebaseService.firestore;
        if (firestore) {
            const doc = await firestore.collection('posts').doc(id).get();
            if (!doc.exists)
                throw new common_1.NotFoundException('Post not found');
            return doc.data()?.replies || [];
        }
        else {
            const postsMap = this.firebaseService.getCollection('posts');
            const post = postsMap.get(id);
            if (!post)
                throw new common_1.NotFoundException('Post not found');
            return post.replies || [];
        }
    }
};
exports.SpacesService = SpacesService;
exports.SpacesService = SpacesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_1.FirebaseService,
        moderation_1.ModerationService])
], SpacesService);
//# sourceMappingURL=spaces.service.js.map