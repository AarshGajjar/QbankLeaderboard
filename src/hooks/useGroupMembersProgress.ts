import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile, UserProgress as UserProgressType } from '@/types/database'; // Removed GroupMembership

export interface GroupMemberProgress {
  profile: Profile;
  progress: UserProgressType[];
  // Optionally, add aggregated stats here later if computed in the hook
  totalCompleted?: number;
  totalCorrect?: number;
  overallAccuracy?: number;
}

export function useGroupMembersProgress(groupId?: string, questionBankId?: string) {
  const [membersProgress, setMembersProgress] = useState<GroupMemberProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroupMembersProgress = useCallback(async () => {
    if (!groupId || !questionBankId) {
      setMembersProgress([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Get group members with their profiles
      const { data: memberships, error: memberError } = await supabase
        .from('group_memberships')
        .select(`
          user_id,
          profiles (*)
        `)
        .eq('group_id', groupId);

      if (memberError) throw memberError;
      if (!memberships) {
        setMembersProgress([]);
        setLoading(false);
        return;
      }

      // Filter out memberships where profile might be null (though ideally FK constraint prevents this)
      const validMembers = memberships.filter(m => m.profiles !== null) as Array<{ user_id: string, profiles: Profile }>;

      // 2. For each member, fetch their progress for the specified question bank
      const progressPromises = validMembers.map(async (member) => {
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', member.user_id)
          .eq('question_bank_id', questionBankId)
          .order('date', { ascending: true }); // Fetch in ascending for easier processing later if needed

        if (progressError) {
          console.error(`Failed to get progress for user ${member.user_id} in group ${groupId}:`, progressError);
          // Return member with empty progress or handle error more gracefully
          return { profile: member.profiles, progress: [] };
        }
        return { profile: member.profiles, progress: progressData || [] };
      });

      const results = await Promise.all(progressPromises);
      setMembersProgress(results.filter(r => r !== null) as GroupMemberProgress[]);

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Error fetching group members progress.';
      console.error('Error fetching group members progress:', e);
      setError(errorMessage);
      setMembersProgress([]);
    } finally {
      setLoading(false);
    }
  }, [groupId, questionBankId]);

  useEffect(() => {
    fetchGroupMembersProgress();
  }, [fetchGroupMembersProgress]);

  return { membersProgress, loading, error, refetch: fetchGroupMembersProgress };
}
