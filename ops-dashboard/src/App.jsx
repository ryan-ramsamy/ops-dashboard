import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient.js';
import LoginScreen from './components/LoginScreen.jsx';
import Dashboard from './Dashboard.jsx';

// Gates the entire app on a Supabase Auth session. Dashboard (which owns
// useTasks/useSpend, and therefore every Supabase data query) is only
// mounted once `session` is a real session object — so an unauthenticated
// visitor never triggers a single task/spend fetch, not just sees a
// hidden UI.
export default function App() {
  const [session, setSession] = useState(undefined); // undefined = checking, null = signed out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <div className="auth-loading" />;
  }

  if (!session) {
    return <LoginScreen />;
  }

  return <Dashboard />;
}
