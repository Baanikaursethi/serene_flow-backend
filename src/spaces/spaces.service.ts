import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase';
import { ConfigService } from '@nestjs/config';
import { CreatePostDto, UpdatePostDto, AddReactionDto, AddReplyDto } from './dto';
import { ModerationService } from '../moderation';

@Injectable()
export class SpacesService {
  constructor(
    private firebaseService: FirebaseService,
    private moderationService: ModerationService,
    private configService: ConfigService,
  ) {}

  private get ceoEmail(): string {
    return (this.configService.get<string>('CEO_EMAIL') || 'sereneflow27@gmail.com').toLowerCase();
  }

  private isSameOwner(userPayload: any, authorEmail?: string, authorUid?: string) {
    const email = String(userPayload?.email || '').toLowerCase();
    if (!email) return false;
    const storedEmail = typeof authorEmail === 'string' ? authorEmail.toLowerCase() : null;
    const emailMatch = storedEmail !== null && storedEmail === email;
    const uidMatch = !!authorUid && !!userPayload?.uid && String(authorUid) === String(userPayload.uid);
    return emailMatch || uidMatch;
  }

  private async findPublicAuthor(email?: string) {
    if (!email) return { name: null, avatar: null, role: 'user' };
    const normalized = email.toLowerCase();
    const firestore = this.firebaseService.firestore;
    if (firestore) {
      const doc = await firestore.collection('users').doc(normalized).get();
      const user = doc.exists ? doc.data() : null;
      return {
        name: user?.name || normalized.split('@')[0],
        avatar: user?.avatar || null,
        role: user?.role || 'user',
      };
    }
    const user = this.firebaseService.getCollection('users').get(normalized);
    return {
      name: user?.name || normalized.split('@')[0],
      avatar: user?.avatar || null,
      role: user?.role || 'user',
    };
  }

  private async getStoredProfile(userPayload: any) {
    const email = String(userPayload?.email || '').toLowerCase();
    if (!email) return null;

    const firestore = this.firebaseService.firestore;
    if (firestore) {
      const doc = await firestore.collection('users').doc(email).get();
      return doc.exists ? doc.data() : null;
    }
    return this.firebaseService.getCollection('users').get(email) || null;
  }

  private async decorateReply(reply: any, userPayload: any) {
    const anonymous = !!reply.anonymous;
    if (anonymous) {
      return {
        id: reply.id,
        text: reply.text,
        time: reply.time,
        anonymous: true,
        authorName: null,
        authorAvatar: null,
        authorIsCeo: false,
        isOwner: this.isSameOwner(userPayload, reply.authorEmail, reply.authorUid),
        edited: reply.edited,
      };
    }

    const author = await this.findPublicAuthor(reply.authorEmail);
    return {
      id: reply.id,
      text: reply.text,
      time: reply.time,
      anonymous: false,
      authorName: author.name,
      authorAvatar: reply.authorAvatar ?? author.avatar,
      authorIsCeo: !!(reply.authorEmail?.toLowerCase() === this.ceoEmail),
      isOwner: this.isSameOwner(userPayload, reply.authorEmail, reply.authorUid),
      edited: reply.edited,
    };
  }

  private async decoratePost(post: any, userPayload: any) {
    const anonymous = !!post.anonymous;
    const replies = await Promise.all((post.replies || []).map((reply: any) => this.decorateReply(reply, userPayload)));
    const userEmail = String(userPayload?.email || '').toLowerCase();
    const reactionUsers: Record<string, string[]> = post.reactionUsers || {};

    if (anonymous) {
      return {
        id: post.id,
        text: post.text,
        time: post.time,
        anonymous: true,
        authorName: null,
        authorAvatar: null,
        authorIsCeo: false,
        isOwner: this.isSameOwner(userPayload, post.authorEmail, post.authorUid),
        reactions: post.reactions || this.reactionCountsFromUsers(reactionUsers),
        myReactions: this.reactionsForUser(reactionUsers, userEmail),
        replies,
        edited: post.edited,
      };
    }

    const author = await this.findPublicAuthor(post.authorEmail);
    return {
      id: post.id,
      text: post.text,
      time: post.time,
      anonymous: false,
      authorName: author.name,
      authorAvatar: post.authorAvatar ?? author.avatar,
      authorIsCeo: !!(post.authorEmail?.toLowerCase() === this.ceoEmail),
      isOwner: this.isSameOwner(userPayload, post.authorEmail, post.authorUid),
      reactions: post.reactions || this.reactionCountsFromUsers(reactionUsers),
      myReactions: this.reactionsForUser(reactionUsers, userEmail),
      replies,
      edited: post.edited,
    };
  }

  async getPosts(userPayload: any) {
    const firestore = this.firebaseService.firestore;
    let posts: any[] = [];

    if (firestore) {
      const snap = await firestore.collection('posts').get();
      posts = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } else {
      const postsMap = this.firebaseService.getCollection('posts');
      posts = Array.from(postsMap.values());
    }

    posts.sort(
      (a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime(),
    );
    return Promise.all(posts.map((post) => this.decoratePost(post, userPayload)));
  }

  async createPost(userPayload: any, dto: CreatePostDto) {
    await this.moderationService.checkContent({ text: dto.text });

    const email = userPayload.email.toLowerCase();
    const isAnonymous = !!dto.anonymous;
    const firestore = this.firebaseService.firestore;
    const id = 'post_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();
    const profile = await this.getStoredProfile(userPayload);
    const authorName = isAnonymous ? null : (profile?.name || userPayload.name || email.split('@')[0]);

    const newPost = {
      id,
      text: dto.text,
      time: now,
      anonymous: isAnonymous,
      authorName,
      authorAvatar: isAnonymous ? null : (profile?.avatar || userPayload.avatar || null),
      authorEmail: email,
      authorUid: userPayload.uid,
      reactions: {},
      replies: [],
    };

    if (firestore) {
      await firestore.collection('posts').doc(id).set(newPost);
    } else {
      const postsMap = this.firebaseService.getCollection('posts');
      postsMap.set(id, newPost);
    }

    return this.decoratePost(newPost, userPayload);
  }

  async updatePost(userPayload: any, id: string, dto: UpdatePostDto) {
    await this.moderationService.checkContent({ text: dto.text });

    const firestore = this.firebaseService.firestore;
    let post: any = null;

    if (firestore) {
      const docRef = firestore.collection('posts').doc(id);
      const doc = await docRef.get();
      if (!doc.exists) throw new NotFoundException('Community post not found');
      post = { id, ...doc.data() };

      if (!this.isSameOwner(userPayload, post.authorEmail, post.authorUid)) {
        throw new ForbiddenException('You are not authorized to edit another user\'s post');
      }

      const updates = { text: dto.text, edited: new Date().toISOString() };
      await docRef.update(updates);
      return this.decoratePost({ ...post, ...updates }, userPayload);
    }

    const postsMap = this.firebaseService.getCollection('posts');
    post = postsMap.get(id);
    if (!post) throw new NotFoundException('Community post not found');

    if (!this.isSameOwner(userPayload, post.authorEmail, post.authorUid)) {
      throw new ForbiddenException('You are not authorized to edit another user\'s post');
    }

    post.text = dto.text;
    post.edited = new Date().toISOString();
    postsMap.set(id, post);
    return this.decoratePost(post, userPayload);
  }

  async deletePost(userPayload: any, id: string) {
    const email = userPayload.email.toLowerCase();
    // CEO override is deliberately based on the configured email, not a
    // client-supplied role, so regular users cannot promote themselves.
    const isCeo = email === this.ceoEmail;
    const firestore = this.firebaseService.firestore;

    if (firestore) {
      const docRef = firestore.collection('posts').doc(id);
      const doc = await docRef.get();
      if (!doc.exists) throw new NotFoundException('Community post not found');
      const post = doc.data();

      if (!isCeo && !this.isSameOwner(userPayload, post?.authorEmail, post?.authorUid)) {
        throw new ForbiddenException('Only the post author or CEO can delete this community post');
      }

      await docRef.delete();
    } else {
      const postsMap = this.firebaseService.getCollection('posts');
      const post = postsMap.get(id);
      if (!post) throw new NotFoundException('Community post not found');

      if (!isCeo && !this.isSameOwner(userPayload, post.authorEmail, post.authorUid)) {
        throw new ForbiddenException('Only the post author or CEO can delete this community post');
      }

      postsMap.delete(id);
    }

    return { message: 'Community post deleted successfully', id };
  }

  /**
   * Helper: compute reaction counts from a reactionUsers map.
   * reactionUsers: { [emoji]: string[] } — list of emails that reacted.
   */
  private reactionCountsFromUsers(reactionUsers: Record<string, string[]>): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const [emoji, users] of Object.entries(reactionUsers)) {
      counts[emoji] = users.length;
    }
    return counts;
  }

  /**
   * Helper: return the list of emoji keys that a given user has reacted with.
   */
  private reactionsForUser(reactionUsers: Record<string, string[]>, email: string): string[] {
    const k = email.toLowerCase();
    return Object.entries(reactionUsers)
      .filter(([, users]) => users.includes(k))
      .map(([emoji]) => emoji);
  }

  async toggleReaction(userPayload: any, id: string, dto: AddReactionDto) {
    const firestore = this.firebaseService.firestore;
    const key = dto.reactionType;
    const userEmail = String(userPayload?.email || '').toLowerCase();

    if (firestore) {
      const docRef = firestore.collection('posts').doc(id);
      const doc = await docRef.get();
      if (!doc.exists) throw new NotFoundException('Post not found');
      const post = doc.data()!;

      // Migrate: if stored as counts-only (no reactionUsers), seed reactionUsers from counts
      // so existing posts don't lose their displayed counts.
      const reactionUsers: Record<string, string[]> = post.reactionUsers
        ? { ...post.reactionUsers }
        : {};

      const current: string[] = Array.isArray(reactionUsers[key]) ? reactionUsers[key] : [];
      const has = current.includes(userEmail);
      // Toggle: add if not present, remove if already present
      reactionUsers[key] = has
        ? current.filter((u) => u !== userEmail)
        : [...current, userEmail];
      // Clean up empty arrays
      if (reactionUsers[key].length === 0) delete reactionUsers[key];

      const reactions = this.reactionCountsFromUsers(reactionUsers);
      await docRef.update({ reactionUsers, reactions });
      return { id, reactions, myReactions: this.reactionsForUser(reactionUsers, userEmail) };
    }

    const postsMap = this.firebaseService.getCollection('posts');
    const post = postsMap.get(id);
    if (!post) throw new NotFoundException('Post not found');

    const reactionUsers: Record<string, string[]> = post.reactionUsers
      ? { ...post.reactionUsers }
      : {};

    const current: string[] = Array.isArray(reactionUsers[key]) ? reactionUsers[key] : [];
    const has = current.includes(userEmail);
    reactionUsers[key] = has
      ? current.filter((u) => u !== userEmail)
      : [...current, userEmail];
    if (reactionUsers[key].length === 0) delete reactionUsers[key];

    const reactions = this.reactionCountsFromUsers(reactionUsers);
    post.reactionUsers = reactionUsers;
    post.reactions = reactions;
    postsMap.set(id, post);
    return { id, reactions, myReactions: this.reactionsForUser(reactionUsers, userEmail) };
  }

  async addReply(userPayload: any, id: string, dto: AddReplyDto) {
    await this.moderationService.checkContent({ text: dto.text });

    const email = userPayload.email.toLowerCase();
    const isAnonymous = !!dto.anonymous;
    const firestore = this.firebaseService.firestore;
    const replyId = 'rpl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const profile = await this.getStoredProfile(userPayload);

    const newReply = {
      id: replyId,
      text: dto.text,
      time: new Date().toISOString(),
      anonymous: isAnonymous,
      authorName: isAnonymous ? null : (profile?.name || userPayload.name || email.split('@')[0]),
      authorAvatar: isAnonymous ? null : (profile?.avatar || userPayload.avatar || null),
      authorEmail: email,
      authorUid: userPayload.uid,
    };

    if (firestore) {
      const docRef = firestore.collection('posts').doc(id);
      const doc = await docRef.get();
      if (!doc.exists) throw new NotFoundException('Post not found');
      const post = doc.data()!;

      const replies = [...(post.replies || []), newReply];
      await docRef.update({ replies });
      return this.decorateReply(newReply, userPayload);
    }

    const postsMap = this.firebaseService.getCollection('posts');
    const post = postsMap.get(id);
    if (!post) throw new NotFoundException('Post not found');

    post.replies = [...(post.replies || []), newReply];
    postsMap.set(id, post);
    return this.decorateReply(newReply, userPayload);
  }

  async getReplies(userPayload: any, id: string) {
    const firestore = this.firebaseService.firestore;
    let replies: any[] = [];

    if (firestore) {
      const doc = await firestore.collection('posts').doc(id).get();
      if (!doc.exists) throw new NotFoundException('Post not found');
      replies = doc.data()?.replies || [];
    } else {
      const postsMap = this.firebaseService.getCollection('posts');
      const post = postsMap.get(id);
      if (!post) throw new NotFoundException('Post not found');
      replies = post.replies || [];
    }

    return Promise.all(replies.map((reply) => this.decorateReply(reply, userPayload)));
  }

  async updateReply(userPayload: any, postId: string, replyId: string, text: string) {
    await this.moderationService.checkContent({ text });
    const firestore = this.firebaseService.firestore;

    if (firestore) {
      const docRef = firestore.collection('posts').doc(postId);
      const doc = await docRef.get();
      if (!doc.exists) throw new NotFoundException('Post not found');
      const post = doc.data()!;
      const replies = [...(post.replies || [])];
      const index = replies.findIndex((reply: any) => reply.id === replyId);
      if (index < 0) throw new NotFoundException('Reply not found');
      const reply = replies[index];
      if (!this.isSameOwner(userPayload, reply.authorEmail, reply.authorUid)) {
        throw new ForbiddenException('You are not authorized to edit another user\'s reply');
      }
      replies[index] = { ...reply, text, edited: new Date().toISOString() };
      await docRef.update({ replies });
      return this.decorateReply(replies[index], userPayload);
    }

    const postsMap = this.firebaseService.getCollection('posts');
    const post = postsMap.get(postId);
    if (!post) throw new NotFoundException('Post not found');
    const replies = [...(post.replies || [])];
    const index = replies.findIndex((reply: any) => reply.id === replyId);
    if (index < 0) throw new NotFoundException('Reply not found');
    const reply = replies[index];
    if (!this.isSameOwner(userPayload, reply.authorEmail, reply.authorUid)) {
      throw new ForbiddenException('You are not authorized to edit another user\'s reply');
    }
    replies[index] = { ...reply, text, edited: new Date().toISOString() };
    post.replies = replies;
    postsMap.set(postId, post);
    return this.decorateReply(replies[index], userPayload);
  }

  async deleteReply(userPayload: any, postId: string, replyId: string) {
    const firestore = this.firebaseService.firestore;

    if (firestore) {
      const docRef = firestore.collection('posts').doc(postId);
      const doc = await docRef.get();
      if (!doc.exists) throw new NotFoundException('Post not found');
      const post = doc.data()!;
      const replies = [...(post.replies || [])];
      const reply = replies.find((item: any) => item.id === replyId);
      if (!reply) throw new NotFoundException('Reply not found');
      const isCeo = userPayload.email?.toLowerCase() === this.ceoEmail;
      if (!isCeo && !this.isSameOwner(userPayload, reply.authorEmail, reply.authorUid)) {
        throw new ForbiddenException('Only the reply author or CEO/Admin can delete this reply');
      }
      await docRef.update({ replies: replies.filter((item: any) => item.id !== replyId) });
    } else {
      const postsMap = this.firebaseService.getCollection('posts');
      const post = postsMap.get(postId);
      if (!post) throw new NotFoundException('Post not found');
      const replies = [...(post.replies || [])];
      const reply = replies.find((item: any) => item.id === replyId);
      if (!reply) throw new NotFoundException('Reply not found');
      const isCeo = userPayload.email?.toLowerCase() === this.ceoEmail;
      if (!isCeo && !this.isSameOwner(userPayload, reply.authorEmail, reply.authorUid)) {
        throw new ForbiddenException('Only the reply author or CEO/Admin can delete this reply');
      }
      post.replies = replies.filter((item: any) => item.id !== replyId);
      postsMap.set(postId, post);
    }

    return { message: 'Reply deleted successfully', id: replyId };
  }
}
