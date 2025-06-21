import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProgress } from '@/types/database';

export function useUserProgress(userId?: string, questionBankId?: string) {
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProgress = useCallback(async () => {
    if (!userId || !questionBankId) {
      setProgress([]); // Clear progress if IDs are not available
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('question_bank_id', questionBankId)
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;
      setProgress(data || []);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Error fetching user progress.';
      console.error('Error fetching user progress:', e);
      setError(errorMessage);
      setProgress([]); // Clear progress on error
    } finally {
      setLoading(false);
    }
  }, [userId, questionBankId]);

  useEffect(() => {
    fetchUserProgress();
  }, [fetchUserProgress]);

  const addProgressEntry = async (entry: Omit<UserProgress, 'id' | 'created_at' | 'updated_at'>) => {
    // This is a simplified add. QBankTracker uses a more complex upsert logic for daily summary.
    // This hook might be more for reading or specific types of additions.
    // For the QBankTracker's main functionality, its internal handleSubmitProgress is more tailored.
    setLoading(true);
    try {
      const { data, error: insertError } = await supabase
        .from('user_progress')
        .insert(entry)
        .select()
        .single();

      if (insertError) throw insertError;
      if (data) {
        // Refetch or update state optimistically
        await fetchUserProgress();
      }
      return data;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to add progress entry.';
      setError(errorMessage);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // The upsert logic from QBankTracker is quite specific.
  // If needed universally, it could be moved into this hook or a service function.
  // For now, QBankTracker will retain its specific upsert for daily totals.

  return { progress, loading, error, refetch: fetchUserProgress, addProgressEntry };
}
