import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';

interface AuthComponentProps {
  onSessionChange: (session: Session | null) => void;
}

const AuthComponent: React.FC<AuthComponentProps> = ({ onSessionChange }) => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      onSessionChange(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      onSessionChange(session);
    });

    return () => subscription.unsubscribe();
  }, [onSessionChange]);

  if (!session) {
    return (
      <div style={{ maxWidth: '420px', margin: '50px auto' }}>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google', 'github']} // Example providers
          socialLayout="horizontal"
        />
      </div>
    );
  }

  // If session exists, perhaps show a message or redirect,
  // or this component simply doesn't render if a session is active (handled by parent).
  // For this example, let's assume the parent component will hide AuthComponent when session is active.
  return null;
};

export default AuthComponent;
