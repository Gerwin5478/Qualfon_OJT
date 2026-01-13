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

  /**
   * CRITICAL FIX: NUCLEAR STORAGE CLEANER
   * This logic is the only way to stop the reload loop properly.
   * It scans LocalStorage for any Supabase key containing 'data:image' 
   * or exceeding 50KB. If found, it wipes the token to save the app.
   */
  const performNuclearClean = () => {
    try {
      let cleaned = false;
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.includes('supabase.auth.token') || key.startsWith('sb-')) {
          const value = localStorage.getItem(key);
          if (value) {
            // If the value is suspicious (image data or too large)
            if (value.includes('data:image') || value.length > 51200) {
              console.error("Bloated Auth Token Detected. Purging to prevent crash loop.");
              localStorage.removeItem(key);
              cleaned = true;
            }
          }
        }
      }
      if (cleaned) {
        // Hard refresh to a clean state if we caught a bad token
        window.location.reload();
        return true;
      }
    } catch (e) {
      console.error("Cleaner failed", e);
    }
    return false;
  };

  const clearAuthAndReload = async () => {
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.includes('supabase') || key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      }
      await supabase.auth.signOut();
    } catch (e) {
      localStorage.clear();
    }
    window.location.replace(window.location.origin + window.location.pathname + '#/auth');
    window.location.reload();
  };

  const scrubMetadataCloud = async (currentUser: User) => {
    // If the active session still has image data in user_metadata, 
    // we must clear it in the DB so the NEXT login is clean.
    const metadata = currentUser.user_metadata;
    if (metadata?.avatar_url && (metadata.avatar_url.includes('data:image') || metadata.avatar_url.length > 500)) {
      try {
        await supabase.auth.updateUser({
          data: { avatar_url: null }
        });
      } catch (e) {
        console.error("Cloud scrub failed", e);
      }
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, avatar_url, role, account_status, first_name, middle_name, last_name')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
          await clearAuthAndReload();
          return null;
        }
        return null;
      }
      if (data) {
        setProfile(data as ProfileData);
        return data;
      }
      return null;
    } catch (err) {
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    // 1. Run nuclear cleaner first
    if (performNuclearClean()) return;

    const initSession = async () => {
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          if (sessionError.message?.toLowerCase().includes('storage') || sessionError.message?.toLowerCase().includes('quota')) {
            await clearAuthAndReload();
            return;
          }
          throw sessionError;
        }

        if (currentSession?.user) {
          await scrubMetadataCloud(currentSession.user);
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
      } catch (e: any) {
        if (e.name === 'QuotaExceededError' || e.message?.includes('quota')) {
           await clearAuthAndReload();
        }
      } finally {
        setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if ((event as any) === 'TOKEN_REFRESH_FAILED') {
        await clearAuthAndReload();
        return;
      }

      if (newSession?.user) {
        if (event === 'SIGNED_IN') {
          await scrubMetadataCloud(newSession.user);
        }
        setUser(newSession.user);
        setSession(newSession);
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
        if (locked && adminMode) setAdminMode(false);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ email: user.email, isEditing: adminMode });
        }
      });
    return () => { if (channel) channel.unsubscribe(); };
  }, [user, isAdmin, adminMode]);

  const signOut = async () => {
    if (channelRef.current) {
        try {
          await channelRef.current.untrack();
          supabase.removeChannel(channelRef.current);
        } catch (e) {}
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
      user, session, profile, loading, isAdmin, adminMode, 
      isEditLocked, lockedBy, toggleAdminMode, refreshProfile, signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within AuthProvider');
  return context;
};