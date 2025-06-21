import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Group, Profile, GroupMembership } from '@/types/database';

export interface GroupMemberView extends Profile {
  role: GroupMembership['role'];
}

export interface GroupDetails extends Group {
  members: GroupMemberView[];
}

export function useGroupDetails(groupId?: string) {
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroupDetails = useCallback(async () => {
    if (!groupId) {
      setGroupDetails(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Fetch group information
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single<Group>();

      if (groupError) throw groupError;
      if (!groupData) throw new Error("Group not found.");

      // 2. Fetch group members
      const { data: memberData, error: memberError } = await supabase
        .from('group_memberships')
        .select(`
          role,
          profiles (id, username, full_name, avatar_url, created_at, updated_at)
        `)
        .eq('group_id', groupId);

      if (memberError) throw memberError;

      const members: GroupMemberView[] = memberData
        ?.map(gm => {
          if (!gm.profiles) return null;
          return {
            ...(gm.profiles as Profile),
            role: gm.role as GroupMembership['role'],
          };
        })
        .filter((m): m is GroupMemberView => m !== null) || [];

      setGroupDetails({ ...groupData, members });

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : `Error fetching details for group ${groupId}`;
      console.error(`Error fetching details for group ${groupId}:`, e);
      setError(errorMessage);
      setGroupDetails(null);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroupDetails();
  }, [fetchGroupDetails]);

  // Add functions for adding/removing members, changing roles if needed by components using this hook.
  // Example:
  const addMember = async (userId: string, role: GroupMembership['role'] = 'member') => {
    if (!groupId) throw new Error("Group ID not specified.");
    setLoading(true); // Or specific 'isUpdatingMembers' state
    try {
        const { error: addError } = await supabase
            .from('group_memberships')
            .insert({ group_id: groupId, user_id: userId, role: role });
        if (addError) throw addError;
        await fetchGroupDetails(); // Refetch to update member list
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Failed to add member.';
        setError(errorMessage); // Consider specific error handling
        throw e;
    } finally {
        setLoading(false);
    }
  };

  const removeMember = async (userId: string) => {
    if (!groupId) throw new Error("Group ID not specified.");
    setLoading(true);
     try {
        const { error: removeError } = await supabase
            .from('group_memberships')
            .delete()
            .eq('group_id', groupId)
            .eq('user_id', userId);
        if (removeError) throw removeError;
        await fetchGroupDetails();
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Failed to remove member.';
        setError(errorMessage);
        throw e;
    } finally {
        setLoading(false);
    }
  };

  const updateMemberRole = async (userId: string, role: GroupMembership['role']) => {
     if (!groupId) throw new Error("Group ID not specified.");
     setLoading(true);
     try {
        const { error: updateError } = await supabase
            .from('group_memberships')
            .update({ role })
            .eq('group_id', groupId)
            .eq('user_id', userId);
        if (updateError) throw updateError;
        await fetchGroupDetails();
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Failed to update member role.';
        setError(errorMessage);
        throw e;
    } finally {
        setLoading(false);
    }
  };


  return { groupDetails, loading, error, refetch: fetchGroupDetails, addMember, removeMember, updateMemberRole };
}
