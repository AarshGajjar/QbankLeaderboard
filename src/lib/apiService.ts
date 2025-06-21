import { supabase } from './supabase';
import {
  Group,
  Profile,
  GroupMembership,
  QuestionBank,
  UserProgress,
  // ActivityLog, // Removed unused import
  NewGroupPayload,
  NewGroupMembershipPayload,
} from '@/types/database';

// --- Profiles ---
// Profiles are largely managed by auth triggers and RLS.
// Example: Get current user's profile
export const getCurrentUserProfile = async () => {
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser) throw authError || new Error('User not authenticated.');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single<Profile>();
  if (error) throw error;
  return data;
};

// Example: Update current user's profile
export const updateUserProfile = async (profileUpdates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>) => {
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser) throw authError || new Error('User not authenticated.');

  const { data, error } = await supabase
    .from('profiles')
    .update(profileUpdates)
    .eq('id', authUser.id)
    .select()
    .single<Profile>();
  if (error) throw error;
  return data;
};

// --- Groups ---
export const createGroup = async (groupData: NewGroupPayload) => {
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser) throw authError || new Error('User not authenticated.');

  const payload = { ...groupData, created_by_user_id: authUser.id };
  const { data, error } = await supabase
    .from('groups')
    .insert(payload)
    .select()
    .single<Group>();
  if (error) throw error;
  return data;
};

export const getGroupById = async (groupId: string) => {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single<Group>();
  if (error) throw error;
  return data;
};

export const updateGroup = async (groupId: string, updates: Partial<Omit<Group, 'id' | 'created_at' | 'updated_at' | 'created_by_user_id'>>) => {
  const { data, error } = await supabase
    .from('groups')
    .update(updates)
    .eq('id', groupId)
    .select()
    .single<Group>();
  if (error) throw error;
  return data;
};

export const deleteGroup = async (groupId: string) => {
  const { error } = await supabase.from('groups').delete().eq('id', groupId);
  if (error) throw error;
};

export const listUserGroups = async (userId: string) => {
    const { data, error } = await supabase
    .from('group_memberships')
    .select(`
      role,
      groups (*)
    `)
    .eq('user_id', userId);

  if (error) throw error;
  return data?.map(gm => ({ ...gm.groups, role: gm.role })) as (Group & {role: GroupMembership['role']})[] | null;
}


// --- Group Memberships ---
export const addGroupMember = async (membershipData: NewGroupMembershipPayload) => {
  const { data, error } = await supabase
    .from('group_memberships')
    .insert(membershipData)
    .select()
    .single<GroupMembership>();
  if (error) throw error;
  return data;
};

export const getGroupMembers = async (groupId: string) => {
  const { data, error } = await supabase
    .from('group_memberships')
    .select(`
      role,
      profiles (id, username, full_name, avatar_url)
    `)
    .eq('group_id', groupId);

  if (error) throw error;
  return data; // Array of { role, profiles: Profile }
};

export const removeGroupMember = async (groupId: string, userId: string) => {
  const { error } = await supabase
    .from('group_memberships')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);
  if (error) throw error;
};

export const updateGroupMemberRole = async (groupId: string, userId: string, role: GroupMembership['role']) => {
  const { data, error } = await supabase
    .from('group_memberships')
    .update({ role })
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .select()
    .single<GroupMembership>();
  if (error) throw error;
  return data;
}

// --- Question Banks ---
// Typically, question banks might be managed by admins or seeded.
export const getDefaultQuestionBank = async () => {
  const { data, error } = await supabase
    .from('question_banks')
    .select('*')
    .eq('name', 'Default QBank') // Assuming this is the seeded name
    .single<QuestionBank>();
  if (error) {
    console.warn("Default Question Bank not found. Ensure it's seeded or create one.");
    return null;
  }
  return data;
};

export const listQuestionBanks = async () => {
  const { data, error } = await supabase
    .from('question_banks')
    .select('*');
  if (error) throw error;
  return data as QuestionBank[];
}


// --- User Progress and Activity Logs ---
// These are mostly handled within QBankTracker.tsx for the current user.
// The functions there (fetchDataForUser, handleSubmitProgress) serve as examples.
// For analytics or admin views, you might have more generalized functions.

// Example: Get another user's progress (if RLS allows, e.g., for group members)
export const getUserProgressForAnalytics = async (userId: string, questionBankId: string) => {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('question_bank_id', questionBankId)
    .order('date', { ascending: true });
  if (error) throw error;
  return data as UserProgress[];
};
