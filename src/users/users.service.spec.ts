jest.mock('../firebase', () => ({ FirebaseService: class {} }));

import { UsersService } from './users.service';

describe('UsersService account deletion', () => {
  it('deletes only the account owner posts in the in-memory fallback', async () => {
    const users = new Map<string, any>([
      ['owner@example.com', { email: 'owner@example.com', uid: 'owner-uid' }],
    ]);
    const posts = new Map<string, any>([
      ['post-1', { id: 'post-1', authorEmail: 'owner@example.com', authorUid: 'owner-uid' }],
      ['post-2', { id: 'post-2', authorEmail: 'other@example.com', authorUid: 'other-uid' }],
    ]);
    const service = new UsersService({
      getCollection: jest.fn((name: string) => {
        if (name === 'users') return users;
        if (name === 'posts') return posts;
        return new Map();
      }),
    } as any);

    await service.deleteAccount({ email: 'owner@example.com', uid: 'owner-uid' });

    expect(users.has('owner@example.com')).toBe(false);
    expect(posts.has('post-1')).toBe(false);
    expect(posts.has('post-2')).toBe(true);
  });
});
