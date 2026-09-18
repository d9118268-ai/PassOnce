import { localDb } from './db';
import { supabase } from './supabaseClient';

export async function syncOfflineResultsToCloud(userId: string) {
  if (!navigator.onLine) return;

  // Fetch unsynced local test results
  const unsynced = await localDb.examResults
    .where('syncedToCloud')
    .equals(0) // Dexie stores boolean false as 0
    .toArray();

  if (unsynced.length === 0) return;

  for (const item of unsynced) {
    const { error } = await supabase.from('exam_scores').insert({
      user_id: userId,
      exam_type: item.examType,
      score: item.score,
      total_questions: item.totalQuestions,
      created_at: item.completedAt,
    });

    if (!error && item.id) {
      // Mark as synced locally
      await localDb.examResults.update(item.id, { syncedToCloud: true });
    }
  }
}