
'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase/client';

type Role = 'super-admin' | 'admin' | 'editor' | 'user';

export type ProfileRow = {
  id: string;
  display_name: string | null;
  role: Role;
  disabled: boolean;
  created_at?: string;
  // add updated_at etc if you have them
};

type Ctx = {
  user: User | null;
  profile: ProfileRow | null;
  role: Role;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const UserContext = createContext<Ctx | undefined>(undefined);

export function UserProvider({ children, initialUser = null, initialProfile = null }: {
  children: React.ReactNode;
  initialUser?: User | null;
  initialProfile?: ProfileRow | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [profile, setProfile] = useState<ProfileRow | null>(initialProfile);
  const [loading, setLoading] = useState<boolean>(!initialUser);

  const load = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user ?? null);

      if (user) {
        const { data: p, error } = await supabase
          .from('profiles')
          .select('id, display_name, role, disabled, created_at')
          .eq('id', user.id)
          .single();
        if (!error) setProfile(p as ProfileRow);
        else setProfile(null);
      } else {
        setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial fetch (if no server-provided user)
    if (!initialUser) load();

    // keep in sync on auth changes
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data: p } = await supabase
          .from('profiles')
          .select('id, display_name, role, disabled, created_at')
          .eq('id', session.user.id)
          .single();
        setProfile((p as ProfileRow) ?? null);
      } else {
        setProfile(null);
      }
    });

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const role: Role = useMemo(() => {
    // prefer DB role; fall back to app_metadata
    const metaRole = (user?.app_metadata?.role as Role | undefined) ?? 'user';
    return (profile?.role ?? metaRole) as Role;
  }, [profile?.role, user?.app_metadata]);

  const value = useMemo<Ctx>(() => ({
    user,
    profile,
    role,
    loading,
    refresh: load,
    signOut: async () => { await supabase.auth.signOut(); },
  }), [user, profile, role, loading]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within <UserProvider>');
  return ctx;
}
