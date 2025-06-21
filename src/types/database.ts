// Corresponds to the 'group_role' enum in the database
export type GroupRole = 'admin' | 'member';

// Corresponds to the 'public.profiles' table
export interface Profile {
  id: string; // UUID, references auth.users(id)
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  updated_at: string; // TIMESTAMPTZ
  created_at: string; // TIMESTAMPTZ
}

// Corresponds to the 'public.groups' table
export interface Group {
  id: string; // UUID
  name: string;
  description?: string | null;
  created_by_user_id?: string | null; // UUID, references profiles(id)
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

// Corresponds to the 'public.group_memberships' table
export interface GroupMembership {
  id: string; // UUID
  group_id: string; // UUID, references groups(id)
  user_id: string; // UUID, references profiles(id)
  role: GroupRole;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

// Corresponds to the 'public.question_banks' table
export interface QuestionBank {
  id: string; // UUID
  name: string;
  description?: string | null;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

// Corresponds to the 'public.user_progress' table
export interface UserProgress {
  id: string; // UUID
  user_id: string; // UUID, references profiles(id)
  question_bank_id: string; // UUID, references question_banks(id)
  date: string; // DATE (YYYY-MM-DD)
  completed_count: number;
  correct_count: number;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

// Corresponds to the 'public.activity_logs' table
export interface ActivityLog {
  id: string; // UUID
  user_id: string; // UUID, references profiles(id)
  question_bank_id: string; // UUID, references question_banks(id)
  completed_delta: number;
  correct_delta: number;
  timestamp: string; // TIMESTAMPTZ
  created_at: string; // TIMESTAMPTZ
}

// It can also be beneficial to define types for Supabase function arguments or API payloads
// For example, when creating a new group:
export type NewGroupPayload = Omit<Group, 'id' | 'created_at' | 'updated_at' | 'created_by_user_id'> & {
  created_by_user_id: string; // Explicitly require on creation if not defaulted by DB/RLS
};

// For example, when adding a user to a group:
export type NewGroupMembershipPayload = Omit<GroupMembership, 'id' | 'created_at' | 'updated_at'>;

// For submitting new progress:
export type NewUserProgressPayload = Pick<UserProgress, 'user_id' | 'question_bank_id' | 'date' | 'completed_count' | 'correct_count'>;
// Or if it's an update to an existing day's progress (upsert logic)
export type UpdateUserProgressPayload = Pick<UserProgress, 'user_id' | 'question_bank_id' | 'date'> & {
  completed_increment: number;
  correct_increment: number;
};


export type NewActivityLogPayload = Pick<ActivityLog, 'user_id' | 'question_bank_id' | 'completed_delta' | 'correct_delta'>;

// It's often useful to have a helper type for Supabase responses that include joined data.
// For example, a group membership that also includes the group name and user name:
export interface GroupMembershipWithDetails extends GroupMembership {
  groups: Pick<Group, 'name' | 'description'> | null; // Supabase might return null if join fails or RLS restricts
  profiles: Pick<Profile, 'username' | 'full_name' | 'avatar_url'> | null;
}

// Type for user stats that might be derived or aggregated, similar to existing UserStats
// This will likely evolve as we refactor QBankTracker.tsx
export interface UserStatsSummary {
  userId: string;
  totalCompleted: number;
  totalCorrect: number;
  accuracy: number; // Percentage
  // Other aggregated metrics like streaks, points, etc.
}
