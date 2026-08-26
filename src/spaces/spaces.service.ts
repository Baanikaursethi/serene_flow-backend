import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase';
import { CreatePostDto, UpdatePostDto, AddReactionDto, AddReplyDto } from './dto';
import { ModerationService } from '../moderation';

@Injectable()
export class SpacesService {
  constructor(
    private firebaseService: FirebaseService,
    private moderationService: ModerationService,
  ) {}

  async getPosts() {
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

    return posts.sort(
      (a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime(),
    );
  }

  async createPost(userPayload: any, dto: CreatePostDto) {
    // Content moderation check
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
    } else {
      const postsMap = this.firebaseService.getCollection('posts');
      postsMap.set(id, newPost);
    }

    return newPost;
  }

  async updatePost(userPayload: any, id: string, dto: UpdatePostDto) {
    await this.moderationService.checkContent({ text: dto.text });

    const email = userPayload.email.toLowerCase();
    const firestore = this.firebaseService.firestore;
    let post: any = null;

    if (firestore) {
      const docRef = firestore.collection('posts').doc(id);
      const doc = await docRef.get();
      if (!doc.exists) throw new NotFoundException('Community post not found');
      post = doc.data();

      if (post.authorEmail !== email && post.authorUid !== userPayload.uid) {
        throw new ForbiddenException('You are not authorized to edit another user\'s post');
      }

      const updates = { text: dto.text, edited: new Date().toISOString() };
      await docRef.update(updates);
      return { ...post, ...updates, id };
    } else {
      const postsMap = this.firebaseService.getCollection('posts');
      post = postsMap.get(id);
      if (!post) throw new NotFoundException('Community post not found');

      if (post.authorEmail !== email && post.authorUid !== userPayload.uid) {
        throw new ForbiddenException('You are not authorized to edit another user\'s post');
      }

      post.text = dto.text;
      post.edited = new Date().toISOString();
      postsMap.set(id, post);
      return post;
    }
  }

  async deletePost(userPayload: any, id: string) {
    const email = userPayload.email.toLowerCase();
    const isCeo = userPayload.role === 'ceo' || email === 'sereneflow27@gmail.com';
    const firestore = this.firebaseService.firestore;

    if (firestore) {
      const docRef = firestore.collection('posts').doc(id);
      const doc = await docRef.get();
      if (!doc.exists) throw new NotFoundException('Community post not found');
      const post = doc.data();

      if (!isCeo && post?.authorEmail !== email && post?.authorUid !== userPayload.uid) {
        throw new ForbiddenException('Only the post author or CEO/Admin can delete this community post');
      }

      await docRef.delete();
    } else {
      const postsMap = this.firebaseService.getCollection('posts');
      const post = postsMap.get(id);
      if (!post) throw new NotFoundException('Community post not found');

      if (!isCeo && post.authorEmail !== email && post.authorUid !== userPayload.uid) {
        throw new ForbiddenException('Only the post author or CEO/Admin can delete this community post');
      }

      postsMap.delete(id);
    }

    return { message: 'Community post deleted successfully', id };
  }

  async toggleReaction(userPayload: any, id: string, dto: AddReactionDto) {
    const firestore = this.firebaseService.firestore;
    const key = dto.reactionType.toLowerCase();

    if (firestore) {
      const docRef = firestore.collection('posts').doc(id);
      const doc = await docRef.get();
      if (!doc.exists) throw new NotFoundException('Post not found');
      const post = doc.data()!;

      const reactions = post.reactions || {};
      reactions[key] = (reactions[key] || 0) + 1;

      await docRef.update({ reactions });
      return { id, reactions };
    } else {
      const postsMap = this.firebaseService.getCollection('posts');
      const post = postsMap.get(id);
      if (!post) throw new NotFoundException('Post not found');

      post.reactions = post.reactions || {};
      post.reactions[key] = (post.reactions[key] || 0) + 1;

      postsMap.set(id, post);
      return { id, reactions: post.reactions };
    }
  }

  async addReply(userPayload: any, id: string, dto: AddReplyDto) {
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
      if (!doc.exists) throw new NotFoundException('Post not found');
      const post = doc.data()!;

      const replies = [...(post.replies || []), newReply];
      await docRef.update({ replies });
      return newReply;
    } else {
      const postsMap = this.firebaseService.getCollection('posts');
      const post = postsMap.get(id);
      if (!post) throw new NotFoundException('Post not found');

      post.replies = [...(post.replies || []), newReply];
      postsMap.set(id, post);
      return newReply;
    }
  }

  async getReplies(id: string) {
    const firestore = this.firebaseService.firestore;

    if (firestore) {
      const doc = await firestore.collection('posts').doc(id).get();
      if (!doc.exists) throw new NotFoundException('Post not found');
      return doc.data()?.replies || [];
    } else {
      const postsMap = this.firebaseService.getCollection('posts');
      const post = postsMap.get(id);
      if (!post) throw new NotFoundException('Post not found');
      return post.replies || [];
    }
  }
}
