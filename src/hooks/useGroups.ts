import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Group, GroupMembership } from '@/types/database'; // Assuming Profile is not directly needed here
import { User } from '@supabase/supabase-js';

export interface UserGroup extends Group {
  role: GroupMembership['role'];
}

export function useGroups(authUser: User | null | undefined) { // Updated type
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserGroups = useCallback(async () => {
    if (!authUser?.id) {
      setGroups([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('group_memberships')
        .select(`
          role,
          groups (id, name, description, created_at, created_by_user_id, updated_at)
        `)
        .eq('user_id', authUser.id);

      if (fetchError) throw fetchError;

      const userGroups: UserGroup[] = data
        ?.map(gm => {
          if (!gm.groups) return null;
          return {
            ...(gm.groups as Group),
            role: gm.role as GroupMembership['role'],
          };
        })
        .filter((g): g is UserGroup => g !== null) || [];

      setGroups(userGroups);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Error fetching user groups.';
      console.error('Error fetching user groups:', e);
      setError(errorMessage);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    fetchUserGroups();
  }, [fetchUserGroups]);

  const createGroup = async (groupData: Omit<Group, 'id' | 'created_at' | 'updated_at' | 'created_by_user_id'> & { description?: string | null }) => {
    if (!authUser) throw new Error("User not authenticated for creating group");
    setLoading(true); // Or a specific 'isCreating' state
    try {
        const payload = { ...groupData, created_by_user_id: authUser.id };
        const { data: newGroup, error: insertError } = await supabase
            .from('groups')
            .insert(payload)
            .select()
            .single<Group>();

        if (insertError) throw insertError;
        if (!newGroup) throw new Error("Group creation failed to return data.");

        // Add creator as admin member
        const { error: membershipError } = await supabase
            .from('group_memberships')
            .insert({ group_id: newGroup.id, user_id: authUser.id, role: 'admin' });

        if (membershipError) {
            // Potentially attempt to delete the group if membership fails
            console.error("Failed to add creator to group as admin:", membershipError);
            // Or just throw the error and let UI handle it
            throw new Error(`Group created, but failed to add creator as admin: ${membershipError.message}`);
        }

        await fetchUserGroups(); // Refetch to include the new group
        return newGroup;

    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Failed to create group.';
        setError(errorMessage);
        throw e;
    } finally {
        setLoading(false);
    }
  };


  return { groups, loading, error, refetch: fetchUserGroups, createGroup };
}
