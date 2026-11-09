/**
 * spaces-ceo-deletion.spec.ts
 *
 * Tests for CEO deletion privileges and user data isolation in SpacesService:
 * - CEO can delete any post (regardless of authorship)
 * - CEO can delete any reply (regardless of authorship)
 * - Owner can only delete their own post
 * - Non-owner, non-CEO cannot delete another user's post or reply
 * - Post data is isolated: user A cannot see isOwner:true on user B's post
 * - Anonymous posts never expose authorName/authorEmail to other users
 */

jest.mock('../firebase', () => ({ FirebaseService: class {} }));

import { SpacesService } from './spaces.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

const CEO_EMAIL = 'sereneflow27@gmail.com';

function makeService(posts: Map<string, any>, users: Map<string, any> = new Map()) {
  return new SpacesService(
    {
      firestore: null,
      getCollection: jest.fn((name: string) => {
        if (name === 'posts') return posts;
        if (name === 'users') return users;
        return new Map();
      }),
    } as any,
    { checkContent: jest.fn().mockResolvedValue(undefined) } as any,
    { get: jest.fn((key: string) => key === 'CEO_EMAIL' ? CEO_EMAIL : undefined) } as any,
  );
}

const ownerPayload = { email: 'owner@test.com', uid: 'uid-owner' };
const ceoPayload = { email: CEO_EMAIL, uid: 'uid-ceo' };
const otherPayload = { email: 'other@test.com', uid: 'uid-other' };

describe('SpacesService — CEO deletion', () => {
  it('CEO can delete any post they did not author', async () => {
    const posts = new Map<string, any>([
      ['post-1', { id: 'post-1', text: 'Hello', time: new Date().toISOString(), authorEmail: 'owner@test.com', authorUid: 'uid-owner', replies: [] }],
    ]);
    const svc = makeService(posts);

    const result = await svc.deletePost(ceoPayload, 'post-1');

    expect(result).toMatchObject({ id: 'post-1' });
    expect(posts.has('post-1')).toBe(false);
  });

  it('CEO can delete a reply they did not author', async () => {
    const posts = new Map<string, any>([
      ['post-1', {
        id: 'post-1', text: 'Post', time: new Date().toISOString(),
        authorEmail: 'owner@test.com', authorUid: 'uid-owner',
        replies: [
          { id: 'reply-1', text: 'Reply', time: new Date().toISOString(), authorEmail: 'owner@test.com', authorUid: 'uid-owner' },
        ],
      }],
    ]);
    const svc = makeService(posts);

    const result = await svc.deleteReply(ceoPayload, 'post-1', 'reply-1');

    expect(result).toMatchObject({ id: 'reply-1' });
    const updatedPost = posts.get('post-1');
    expect(updatedPost.replies).toHaveLength(0);
  });

  it('post owner can delete their own post', async () => {
    const posts = new Map<string, any>([
      ['post-1', { id: 'post-1', text: 'Hello', time: new Date().toISOString(), authorEmail: 'owner@test.com', authorUid: 'uid-owner', replies: [] }],
    ]);
    const svc = makeService(posts);

    await expect(svc.deletePost(ownerPayload, 'post-1')).resolves.toMatchObject({ id: 'post-1' });
    expect(posts.has('post-1')).toBe(false);
  });

  it('non-owner, non-CEO cannot delete another user\'s post', async () => {
    const posts = new Map<string, any>([
      ['post-1', { id: 'post-1', text: 'Hello', time: new Date().toISOString(), authorEmail: 'owner@test.com', authorUid: 'uid-owner', replies: [] }],
    ]);
    const svc = makeService(posts);

    await expect(svc.deletePost(otherPayload, 'post-1')).rejects.toThrow(ForbiddenException);
    expect(posts.has('post-1')).toBe(true);
  });

  it('non-owner, non-CEO cannot delete another user\'s reply', async () => {
    const posts = new Map<string, any>([
      ['post-1', {
        id: 'post-1', text: 'Post', time: new Date().toISOString(),
        authorEmail: 'owner@test.com', authorUid: 'uid-owner',
        replies: [
          { id: 'reply-1', text: 'Reply', time: new Date().toISOString(), authorEmail: 'owner@test.com', authorUid: 'uid-owner' },
        ],
      }],
    ]);
    const svc = makeService(posts);

    await expect(svc.deleteReply(otherPayload, 'post-1', 'reply-1')).rejects.toThrow(ForbiddenException);
    const p = posts.get('post-1');
    expect(p.replies).toHaveLength(1); // unchanged
  });

  it('deletePost throws NotFoundException for a missing post', async () => {
    const posts = new Map<string, any>();
    const svc = makeService(posts);

    await expect(svc.deletePost(ownerPayload, 'no-such-post')).rejects.toThrow(NotFoundException);
  });
});

describe('SpacesService — user data isolation', () => {
  it('isOwner is true for the post author, false for everyone else', async () => {
    const posts = new Map<string, any>([
      ['post-1', {
        id: 'post-1', text: 'Hello', time: new Date().toISOString(),
        authorEmail: 'owner@test.com', authorUid: 'uid-owner',
        replies: [], reactions: {},
      }],
    ]);
    const svc = makeService(posts);

    const [ownerView] = await svc.getPosts(ownerPayload);
    const [otherView] = await svc.getPosts(otherPayload);

    expect(ownerView.isOwner).toBe(true);
    expect(otherView.isOwner).toBe(false);
  });

  it('anonymous posts never expose authorName to other users', async () => {
    const posts = new Map<string, any>([
      ['post-anon', {
        id: 'post-anon', text: 'Secret', time: new Date().toISOString(),
        anonymous: true,
        authorEmail: 'owner@test.com', authorUid: 'uid-owner',
        replies: [], reactions: {},
      }],
    ]);
    const svc = makeService(posts);

    const [otherView] = await svc.getPosts(otherPayload);

    expect(otherView.authorName).toBeNull();
    expect(otherView.anonymous).toBe(true);
    // The decorated response must not include authorEmail
    expect((otherView as any).authorEmail).toBeUndefined();
  });

  it('anonymous post author can still see isOwner:true for their own anon post', async () => {
    const posts = new Map<string, any>([
      ['post-anon', {
        id: 'post-anon', text: 'Secret', time: new Date().toISOString(),
        anonymous: true,
        authorEmail: 'owner@test.com', authorUid: 'uid-owner',
        replies: [], reactions: {},
      }],
    ]);
    const svc = makeService(posts);

    const [ownerView] = await svc.getPosts(ownerPayload);

    expect(ownerView.isOwner).toBe(true);
    expect(ownerView.authorName).toBeNull(); // still hidden even from owner view
  });

  it('mood history is isolated — user A cannot see user B moods', async () => {
    // Tested via SpacesService getUserPayload email filtering;
    // The mood isolation is validated via the mood service filter in mood.service.spec.ts
    // Here we ensure decoratePost does not leak cross-user data
    const posts = new Map<string, any>([
      ['post-a', { id: 'post-a', text: 'A post', time: new Date().toISOString(), authorEmail: 'usera@test.com', authorUid: 'uid-a', replies: [], reactions: {} }],
      ['post-b', { id: 'post-b', text: 'B post', time: new Date().toISOString(), authorEmail: 'userb@test.com', authorUid: 'uid-b', replies: [], reactions: {} }],
    ]);
    // Users map keyed by lowercase email (as stored by the service)
    const users = new Map<string, any>([
      ['usera@test.com', { name: 'User A', avatar: null }],
      ['userb@test.com', { name: 'User B', avatar: null }],
    ]);
    const svc = makeService(posts, users);

    const resultsAsA = await svc.getPosts({ email: 'usera@test.com', uid: 'uid-a' });
    const aPost = resultsAsA.find((p) => p.id === 'post-a');
    const bPost = resultsAsA.find((p) => p.id === 'post-b');

    expect(aPost!.isOwner).toBe(true);   // A owns post-a
    expect(bPost!.isOwner).toBe(false);  // A does not own post-b
    expect(bPost!.authorName).toBe('User B'); // still shows name (non-anon)
  });
});
