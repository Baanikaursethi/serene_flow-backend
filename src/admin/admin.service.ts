import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminService {
  constructor(
    private firebaseService: FirebaseService,
    private configService: ConfigService,
  ) {}

  private get ceoEmail(): string {
    return (this.configService.get<string>('CEO_EMAIL') || 'sereneflow27@gmail.com').toLowerCase();
  }

  async getUsers() {
    const firestore = this.firebaseService.firestore;
    let usersList: any[] = [];

    if (firestore) {
      const snap = await firestore.collection('users').get();
      usersList = snap.docs.map((doc) => {
        const data = doc.data();
        delete data.password;
        delete data.resetToken;
        delete data.verificationCode;
        return { id: doc.id, ...data };
      });
    } else {
      const usersMap = this.firebaseService.getCollection('users');
      usersList = Array.from(usersMap.values()).map((u: any) => {
        const { password, resetToken, verificationCode, ...rest } = u;
        return rest;
      });
    }

    return usersList;
  }

  async getLogs() {
    // Generate system & authentication activity logs
    const users = await this.getUsers();
    const logs = users.map((u) => ({
      email: u.email,
      time: u.lastActive || u.createdAt || new Date().toISOString(),
      type: u.logins > 1 ? 'login' : 'signup',
    }));

    return logs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }

  async getStats() {
    const firestore = this.firebaseService.firestore;
    let totalUsers = 0;
    let totalJournals = 0;
    let totalMoods = 0;
    let totalPosts = 0;
    let totalReplies = 0;
    let totalDeletions = 0;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let allUsers: any[] = [];
    let allPosts: any[] = [];

    if (firestore) {
      const userSnap = await firestore.collection('users').get();
      allUsers = userSnap.docs.map((d) => d.data());
      totalUsers = allUsers.length;

      const journalSnap = await firestore.collection('journals').get();
      totalJournals = journalSnap.size;

      const moodSnap = await firestore.collection('moods').get();
      totalMoods = moodSnap.size;

      const postSnap = await firestore.collection('posts').get();
      allPosts = postSnap.docs.map((d) => d.data());
      totalPosts = allPosts.length;
      totalReplies = allPosts.reduce((acc, p) => acc + ((p.replies || []).length), 0);

      // Deletions are tracked on soft-deleted records; if no explicit field exists,
      // derive from a 'deletedAccounts' counter collection if present, else 0.
      try {
        const delSnap = await firestore.collection('deletedAccounts').get();
        totalDeletions = delSnap.size;
      } catch {
        totalDeletions = 0;
      }
    } else {
      const usersMap = this.firebaseService.getCollection('users');
      allUsers = Array.from(usersMap.values());
      totalUsers = allUsers.length;

      totalJournals = this.firebaseService.getCollection('journals').size;
      totalMoods = this.firebaseService.getCollection('moods').size;

      const postsMap = this.firebaseService.getCollection('posts');
      allPosts = Array.from(postsMap.values());
      totalPosts = allPosts.length;
      totalReplies = allPosts.reduce((acc, p) => acc + ((p.replies || []).length), 0);
      totalDeletions = 0;
    }

    // Compute time-bucketed stats from the user list.
    const activeToday = allUsers.filter(
      (u) => u.lastActive && u.lastActive.startsWith(todayStr),
    ).length;

    const activeUsersWeek = allUsers.filter((u) => {
      if (!u.lastActive) return false;
      return new Date(u.lastActive) >= weekAgo;
    }).length;

    const newUsersWeek = allUsers.filter((u) => {
      if (!u.createdAt) return false;
      return new Date(u.createdAt) >= weekAgo;
    }).length;

    // Approximate logins from stored login counts; no per-event log exists yet.
    const totalLogins = allUsers.reduce((acc, u) => acc + (u.logins || 0), 0);

    // loginsToday / loginsWeek: use lastActive as a best-effort proxy since
    // we do not store per-day login event counts.
    const loginsToday = activeToday;
    const loginsWeek = activeUsersWeek;
    const signupsWeek = newUsersWeek;

    // Recent activity log derived from the existing getLogs helper.
    const recentActivity = (await this.getLogs()).slice(0, 12).map((l) => ({
      type: l.type,
      time: l.time,
    }));

    return {
      ceoEmail: this.ceoEmail,
      totalUsers,
      activeToday,
      activeUsersWeek,
      newUsersWeek,
      totalLogins,
      loginsToday,
      loginsWeek,
      signupsWeek,
      totalDeletions,
      deletionsWeek: 0, // requires an event store; placeholder until tracked
      totalPosts,
      totalReplies,
      totalJournals,
      totalMoods,
      recentActivity,
      timestamp: new Date().toISOString(),
    };
  }

  async deletePostAsAdmin(id: string) {
    const firestore = this.firebaseService.firestore;

    if (firestore) {
      const docRef = firestore.collection('posts').doc(id);
      const doc = await docRef.get();
      if (!doc.exists) throw new NotFoundException('Post not found');
      await docRef.delete();
    } else {
      const postsMap = this.firebaseService.getCollection('posts');
      if (!postsMap.has(id)) throw new NotFoundException('Post not found');
      postsMap.delete(id);
    }

    return { message: 'Post permanently removed by Admin/CEO for moderation', id };
  }
}
