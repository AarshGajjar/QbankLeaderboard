import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import QBankTracker from './components/QBankTracker';
import AuthComponent from './components/AuthComponent';
import DashboardLayout from './components/functionality/DashboardLayout';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>; // Or a proper spinner component
  }

  return (
    <DashboardLayout>
      <div className="lg:col-span-12">
        {!session ? (
          <AuthComponent onSessionChange={setSession} />
        ) : (
          // Pass the session or user ID to QBankTracker if needed
          // For now, QBankTracker will fetch its own data based on the authenticated user
          <QBankTracker key={session.user.id} /> // key prop to re-mount QBankTracker on user change
        )}
      </div>
    </DashboardLayout>
  );
}

export default App;
