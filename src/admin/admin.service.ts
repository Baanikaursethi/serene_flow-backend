import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase';

@Injectable()
export class AdminService {
  constructor(private firebaseService: FirebaseService) {}

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
    let activeToday = 0;
    let totalJournals = 0;
    let totalMoods = 0;
    let totalPosts = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    if (firestore) {
      const userSnap = await firestore.collection('users').get();
      totalUsers = userSnap.size;
      activeToday = userSnap.docs.filter(
        (d) => d.data().lastActive && d.data().lastActive.startsWith(todayStr),
      ).length;

      const journalSnap = await firestore.collection('journals').get();
      totalJournals = journalSnap.size;

      const moodSnap = await firestore.collection('moods').get();
      totalMoods = moodSnap.size;

      const postSnap = await firestore.collection('posts').get();
      totalPosts = postSnap.size;
    } else {
      const usersMap = this.firebaseService.getCollection('users');
      totalUsers = usersMap.size;
      activeToday = Array.from(usersMap.values()).filter(
        (u: any) => u.lastActive && u.lastActive.startsWith(todayStr),
      ).length;

      totalJournals = this.firebaseService.getCollection('journals').size;
      totalMoods = this.firebaseService.getCollection('moods').size;
      totalPosts = this.firebaseService.getCollection('posts').size;
    }

    return {
      ceoEmail: 'sereneflow27@gmail.com',
      totalUsers,
      activeToday,
      totalJournals,
      totalMoods,
      totalPosts,
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
