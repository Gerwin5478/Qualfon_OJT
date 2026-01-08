
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session, RealtimeChannel } from '@supabase/supabase-js';

interface ProfileData {
  id: string;
  avatar_url: string | null;
  role: string;
  account_status: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: ProfileData | null;
  loading: boolean;
  isAdmin: boolean;
  adminMode: boolean;
  isEditLocked: boolean;
  lockedBy: string | null;
  toggleAdminMode: () => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children?: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [adminMode, setAdminMode] = useState(false);
  const [isEditLocked, setIsEditLocked] = useState(false);
  const [lockedBy, setLockedBy] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const clearAuthAndReload = async () => {
    console.warn("Session error detected. Clearing local auth data...");
    // Clear all possible supabase-related storage
    for (const key in localStorage) {
      if (key.includes('supabase.auth.token')) {
        localStorage.removeItem(key);
      }
    }
    await supabase.auth.signOut();
    window.location.href = window.location.pathname + '#/auth';
    window.location.reload();
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, avatar_url, role, account_status, first_name, middle_name, last_name')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code === '401' || error.message.includes('JWT')) {
          await clearAuthAndReload();
          return null;
        }
        console.warn("Profile fetch error:", error.message);
        return null;
      }

      if (data) {
        setProfile(data as ProfileData);
        return data;
      }
      return null;
    } catch (err) {
      console.error("Critical error in fetchProfile:", err);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          // Catch the 400 error seen in console
          if (sessionError.status === 400 || sessionError.message.includes('refresh_token_not_found')) {
            await clearAuthAndReload();
            return;
          }
          throw sessionError;
        }

        if (currentSession?.user) {
          const profileData = await fetchProfile(currentSession.user.id);
          if (profileData && profileData.account_status === 'pending_approval') {
            await supabase.auth.signOut();
            setUser(null);
            setSession(null);
            setProfile(null);
          } else {
            setSession(currentSession);
            setUser(currentSession.user);
          }
        }
      } catch (e) {
        console.error("Session init error:", e);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Fix: Cast event to any to handle potentially missing type definition for 'TOKEN_REFRESH_FAILED' in TS union
      if ((event as any) === 'TOKEN_REFRESH_FAILED') {
        await clearAuthAndReload();
        return;
      }

      if (session?.user) {
        if (event === 'SIGNED_IN') {
          const profileData = await fetchProfile(session.user.id);
          if (profileData?.account_status === 'pending_approval') {
            await supabase.auth.signOut();
            return;
          }
        }
        setUser(session.user);
        setSession(session);
      } else {
        setUser(null);
        setSession(null);
        setProfile(null);
        setAdminMode(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = profile?.role === 'admin' || user?.email === 'gerwinthepro@gmail.com';

  useEffect(() => {
    if (!user || !isAdmin) return;

    const channel = supabase.channel('admin_coordination', {
      config: { presence: { key: user.id } },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        let locked = false;
        let lockerName = null;

        for (const key in newState) {
          const presenceState = newState[key];
          if (presenceState && presenceState.length > 0) {
            const presence = presenceState[0] as any;
            if (presence.isEditing && key !== user.id) {
              locked = true;
              lockerName = presence.email;
              break;
            }
          }
        }
        
        setIsEditLocked(locked);
        setLockedBy(lockerName);

        if (locked && adminMode) {
           setAdminMode(false);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ 
            email: user.email, 
            isEditing: adminMode 
          });
        }
      });

    return () => { channel.unsubscribe(); };
  }, [user, isAdmin, adminMode]);

  const signOut = async () => {
    if (channelRef.current) {
        await channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
    }
    await supabase.auth.signOut();
  };

  const toggleAdminMode = () => {
    if (!isAdmin) return;
    if (isEditLocked && !adminMode) {
      alert(`Editing is currently locked by ${lockedBy}`);
      return;
    }
    setAdminMode(prev => !prev);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      profile,
      loading, 
      isAdmin, 
      adminMode, 
      isEditLocked, 
      lockedBy, 
      toggleAdminMode, 
      refreshProfile,
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
