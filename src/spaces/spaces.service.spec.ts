jest.mock('../firebase', () => ({ FirebaseService: class {} }));

import { SpacesService } from './spaces.service';

const createService = (posts: Map<string, any>, users: Map<string, any> = new Map()) =>
  new SpacesService(
    {
      getCollection: jest.fn((name: string) => name === 'posts' ? posts : users),
    } as any,
    { checkContent: jest.fn() } as any,
    { get: jest.fn(() => 'ceo@example.com') } as any,
  );

describe('SpacesService reactions', () => {
  it('updates Firestore reactions within a transaction', async () => {
    const storedPost: any = { reactions: { '❤️': 2 }, replies: [] };
    const docRef = {};
    const transaction = {
      get: jest.fn(async () => ({ exists: true, data: () => storedPost })),
      update: jest.fn((_ref: any, updates: Record<string, any>) => Object.assign(storedPost, updates)),
    };
    const firestore = {
      collection: jest.fn(() => ({ doc: jest.fn(() => docRef) })),
      runTransaction: jest.fn(async (callback: (tx: any) => Promise<any>) => callback(transaction)),
    };
    const service = new SpacesService(
      { firestore } as any,
      { checkContent: jest.fn() } as any,
      { get: jest.fn(() => 'ceo@example.com') } as any,
    );

    const result = await service.toggleReaction(
      { email: 'person@example.com' },
      'post-1',
      { reactionType: '❤️' } as any,
    );

    expect(firestore.runTransaction).toHaveBeenCalledTimes(1);
    expect(transaction.update).toHaveBeenCalledWith(docRef, expect.objectContaining({
      reactions: { '❤️': 3 },
      legacyReactionCounts: { '❤️': 2 },
    }));
    expect(result.reactions).toEqual({ '❤️': 3 });
  });

  it('preserves legacy counts while adding and removing current-user reactions', async () => {
    const posts = new Map<string, any>([
      ['post-1', { id: 'post-1', reactions: { '❤️': 4 }, replies: [] }],
    ]);
    const service = createService(posts);

    const first = await service.toggleReaction(
      { email: 'person@example.com' },
      'post-1',
      { reactionType: '❤️' } as any,
    );
    expect(first.reactions).toEqual({ '❤️': 5 });
    expect(first.myReactions).toEqual(['❤️']);

    const secondUser = await service.toggleReaction(
      { email: 'other@example.com' },
      'post-1',
      { reactionType: '❤️' } as any,
    );
    expect(secondUser.reactions).toEqual({ '❤️': 6 });

    const removed = await service.toggleReaction(
      { email: 'person@example.com' },
      'post-1',
      { reactionType: '❤️' } as any,
    );
    expect(removed.reactions).toEqual({ '❤️': 5 });
    expect(removed.myReactions).toEqual([]);
    expect(posts.get('post-1').legacyReactionCounts).toEqual({ '❤️': 4 });
  });
});

describe('SpacesService post ownership', () => {
  it('allows a post owner to delete their post and preserves CEO deletion', async () => {
    const posts = new Map<string, any>([
      ['post-1', {
        id: 'post-1',
        authorEmail: 'owner@example.com',
        authorUid: 'owner-uid',
      }],
    ]);
    const service = createService(posts);

    await expect(service.deletePost({ email: 'owner@example.com', uid: 'owner-uid' }, 'post-1')).resolves.toBeDefined();
    expect(posts.has('post-1')).toBe(false);

    posts.set('post-2', {
      id: 'post-2',
      authorEmail: 'other@example.com',
      authorUid: 'other-uid',
    });
    await expect(service.deletePost({ email: 'ceo@example.com', uid: 'ceo-uid' }, 'post-2')).resolves.toBeDefined();
    expect(posts.has('post-2')).toBe(false);

    posts.set('post-3', {
      id: 'post-3',
      authorEmail: 'other@example.com',
      authorUid: 'other-uid',
    });
    await expect(
      service.deletePost({ email: 'unrelated@example.com', uid: 'unrelated-uid' }, 'post-3'),
    ).rejects.toThrow('Only the post author or CEO can delete this community post');
    expect(posts.has('post-3')).toBe(true);
  });

  it('uses the saved user profile name for post display', async () => {
    const posts = new Map<string, any>([
      ['post-1', {
        id: 'post-1',
        text: 'Hello',
        time: new Date().toISOString(),
        authorName: 'email-prefix',
        authorEmail: 'user@example.com',
        authorUid: 'user-uid',
        replies: [],
        reactions: {},
      }],
    ]);
    const users = new Map<string, any>([
      ['user@example.com', { name: 'Saved Username', avatar: null, role: 'user' }],
    ]);
    const service = createService(posts, users);

    const result = await service.getPosts({ email: 'other@example.com', uid: 'other-uid' });

    expect(result[0].authorName).toBe('Saved Username');
  });

  it('stores the saved profile name on new posts', async () => {
    const posts = new Map<string, any>();
    const users = new Map<string, any>([
      ['user@example.com', { name: 'Saved Username', avatar: null, role: 'user' }],
    ]);
    const service = createService(posts, users);
    const moderation = { checkContent: jest.fn().mockResolvedValue(undefined) };
    const serviceWithModeration = new SpacesService(
      service['firebaseService'],
      moderation as any,
      { get: jest.fn(() => 'ceo@example.com') } as any,
    );

    const result = await serviceWithModeration.createPost(
      { email: 'user@example.com', uid: 'user-uid', name: 'Old Name' },
      { text: 'Hello', anonymous: false },
    );

    expect(result.authorName).toBe('Saved Username');
    expect(posts.size).toBe(1);
    expect(Array.from(posts.values())[0].authorName).toBe('Saved Username');
  });
});
