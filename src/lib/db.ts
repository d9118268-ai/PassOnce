import Dexie, { Table } from 'dexie';

export interface LocalExamResult {
  id?: number;
  examType: string; // e.g., "JAMB_MATH_2024"
  score: number;
  totalQuestions: number;
  completedAt: Date;
  syncedToCloud: boolean;
}

export class AcademixLocalDB extends Dexie {
  examResults!: Table<LocalExamResult>;

  constructor() {
    super('AcademixLocalDB');
    this.version(1).stores({
      examResults: '++id, examType, score, completedAt, syncedToCloud',
    });
  }
}

export const localDb = new AcademixLocalDB();