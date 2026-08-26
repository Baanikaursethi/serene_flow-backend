import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase';
import { CreateJournalDto, UpdateJournalDto } from './dto/create-journal.dto';

@Injectable()
export class JournalService {
  constructor(private firebaseService: FirebaseService) {}

  async getUserEntries(userPayload: any) {
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

      // Sort by creation date descending
      return entries.sort(
        (a: any, b: any) => new Date(b.created).getTime() - new Date(a.created).getTime(),
      );
    } else {
      const journalsMap = this.firebaseService.getCollection('journals');
      const entries = Array.from(journalsMap.values()).filter(
        (j: any) => j.userEmail === email,
      );
      return entries.sort(
        (a: any, b: any) => new Date(b.created).getTime() - new Date(a.created).getTime(),
      );
    }
  }

  async createEntry(userPayload: any, dto: CreateJournalDto) {
    const email = userPayload.email.toLowerCase();
    const firestore = this.firebaseService.firestore;

    // Deduplication check: prevent saving identical entry twice within 5 seconds
    const existingEntries = await this.getUserEntries(userPayload);
    const recentDuplicate = existingEntries.find(
      (e: any) =>
        e.title === dto.title &&
        e.content === dto.content &&
        Math.abs(Date.now() - new Date(e.created).getTime()) < 5000,
    );

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
    } else {
      const journalsMap = this.firebaseService.getCollection('journals');
      journalsMap.set(id, newEntry);
    }

    return newEntry;
  }

  async updateEntry(userPayload: any, id: string, dto: UpdateJournalDto) {
    const email = userPayload.email.toLowerCase();
    const firestore = this.firebaseService.firestore;
    let entry: any = null;

    if (firestore) {
      const docRef = firestore.collection('journals').doc(id);
      const doc = await docRef.get();
      if (!doc.exists) throw new NotFoundException('Journal entry not found');
      entry = doc.data();

      if (entry.userEmail !== email) {
        throw new ForbiddenException('You do not have permission to edit this journal entry');
      }

      const updates = {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        edited: new Date().toISOString(),
      };

      await docRef.update(updates);
      return { ...entry, ...updates, id };
    } else {
      const journalsMap = this.firebaseService.getCollection('journals');
      entry = journalsMap.get(id);
      if (!entry) throw new NotFoundException('Journal entry not found');

      if (entry.userEmail !== email) {
        throw new ForbiddenException('You do not have permission to edit this journal entry');
      }

      if (dto.title !== undefined) entry.title = dto.title;
      if (dto.content !== undefined) entry.content = dto.content;
      entry.edited = new Date().toISOString();

      journalsMap.set(id, entry);
      return entry;
    }
  }

  async deleteEntry(userPayload: any, id: string) {
    const email = userPayload.email.toLowerCase();
    const firestore = this.firebaseService.firestore;

    if (firestore) {
      const docRef = firestore.collection('journals').doc(id);
      const doc = await docRef.get();
      if (!doc.exists) throw new NotFoundException('Journal entry not found');

      const entry = doc.data();
      if (entry?.userEmail !== email) {
        throw new ForbiddenException('You do not have permission to delete this journal entry');
      }

      await docRef.delete();
    } else {
      const journalsMap = this.firebaseService.getCollection('journals');
      const entry = journalsMap.get(id);
      if (!entry) throw new NotFoundException('Journal entry not found');

      if (entry.userEmail !== email) {
        throw new ForbiddenException('You do not have permission to delete this journal entry');
      }

      journalsMap.delete(id);
    }

    return { message: 'Journal entry deleted successfully', id };
  }
}
