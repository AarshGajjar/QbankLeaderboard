import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ActivityLog, NewActivityLogPayload } from '@/types/database';

export function useActivityLogs(userId?: string, questionBankId?: string, limit: number = 100) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivityLogs = useCallback(async () => {
    if (!userId || !questionBankId) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('question_bank_id', questionBankId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;
      setLogs(data || []);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to fetch activity logs.';
      console.error('Error fetching activity logs:', e);
      setError(errorMessage);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [userId, questionBankId, limit]);

  useEffect(() => {
    fetchActivityLogs();
  }, [fetchActivityLogs]);

  const addActivityLog = async (logPayload: NewActivityLogPayload) => {
    setLoading(true); // Or a specific submitting state
    try {
      const { data, error: insertError } = await supabase
        .from('activity_logs')
        .insert(logPayload)
        .select()
        .single();

      if (insertError) throw insertError;
      if (data) {
        // Refetch or update state optimistically
        // Adding to the top of the list if ordered by timestamp desc
        setLogs(prevLogs => [data as ActivityLog, ...prevLogs].slice(0, limit));
      }
      return data;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to add activity log.';
      setError(errorMessage); // Consider how to handle error state for add vs fetch
      throw e;
    } finally {
      setLoading(false); // Reset general loading, or use specific submitting state
    }
  };

  return { logs, loading, error, refetch: fetchActivityLogs, addActivityLog };
}
