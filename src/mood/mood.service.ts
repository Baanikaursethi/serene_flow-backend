import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase';
import { CreateMoodDto } from './dto/create-mood.dto';

@Injectable()
export class MoodService {
  constructor(private firebaseService: FirebaseService) {}

  async createMood(userPayload: any, dto: CreateMoodDto) {
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
    } else {
      const moodsMap = this.firebaseService.getCollection('moods');
      moodsMap.set(id, moodEntry);
    }

    return moodEntry;
  }

  async getMoodHistory(userPayload: any) {
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

      return moods.sort(
        (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
    } else {
      const moodsMap = this.firebaseService.getCollection('moods');
      const moods = Array.from(moodsMap.values()).filter(
        (m: any) => m.userEmail === email,
      );
      return moods.sort(
        (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
    }
  }

  async getLatestMood(userPayload: any) {
    const history = await this.getMoodHistory(userPayload);
    return history.length > 0 ? history[0] : null;
  }

  async getMoodTrends(userPayload: any) {
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
    const sumRating = history.reduce((acc, m: any) => acc + (m.rating || 3), 0);
    const averageRating = Number((sumRating / totalCheckIns).toFixed(2));

    const distribution: Record<string, number> = {};
    history.forEach((m: any) => {
      const label = m.moodLabel || 'Neutral';
      distribution[label] = (distribution[label] || 0) + 1;
    });

    // Calculate streak
    let currentStreak = 0;
    const dates: string[] = Array.from(
      new Set(
        history.map((m: any) => new Date(m.timestamp).toISOString().split('T')[0]),
      ),
    ).sort().reverse();

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
        } else {
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
}
