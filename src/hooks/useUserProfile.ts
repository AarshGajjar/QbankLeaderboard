import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';
import { User } from '@supabase/supabase-js';

export function useUserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function fetchProfile() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user && isMounted) {
          setProfile(null);
          setAuthUser(null);
          setLoading(false);
          return;
        }
        if (user && isMounted) setAuthUser(user);

        if (user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single<Profile>();

          if (profileError) throw profileError;
          if (isMounted) setProfile(profileData);
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Error fetching user profile.";
        console.error("Error fetching user profile:", e);
        if (isMounted) setError(errorMessage);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchProfile();

    // Listen for auth changes to refetch profile if user logs in/out
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (isMounted) {
            setAuthUser(session?.user ?? null);
            if (session?.user) {
                await fetchProfile(); // Refetch profile on auth change
            } else {
                setProfile(null); // Clear profile on logout
            }
        }
      }
    );

    return () => {
      isMounted = false;
      authListener.subscription?.unsubscribe();
    };
  }, []);

  const updateProfile = async (updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>) => {
    if (!authUser) throw new Error("User not authenticated");
    setLoading(true);
    try {
        const { data, error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', authUser.id)
            .select()
            .single<Profile>();
        if (updateError) throw updateError;
        if (data) setProfile(data);
        return data;
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to update profile.";
        setError(errorMessage);
        throw e;
    } finally {
        setLoading(false);
    }
  }


  return { profile, authUser, loading, error, updateProfile, refetch: fetchProfile }; // Added refetch
}
