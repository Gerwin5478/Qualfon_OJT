import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session, RealtimeChannel } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  adminMode: boolean;
  isEditLocked: boolean;
  lockedBy: string | null;
  toggleAdminMode: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);
  
  // Admin Mode & Locking State
  const [adminMode, setAdminMode] = useState(false);
  const [isEditLocked, setIsEditLocked] = useState(false);
  const [lockedBy, setLockedBy] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Check active session
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const hasAccess = await checkUserStatus(session.user.id);
        if (hasAccess) {
          setSession(session);
          setUser(session.user);
          await fetchUserRole(session.user.id);
        } else {
          // If pending approval, force signout logic is handled inside checkUserStatus
          setSession(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initSession();

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const hasAccess = await checkUserStatus(session.user.id);
        if (!hasAccess) return; // checkUserStatus handles the signOut
      }

      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserRole(session.user.id);
      } else {
        setUserRole('user');
        setAdminMode(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserStatus = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('account_status')
        .eq('id', userId)
        .single();
      
      // If no profile found (race condition in creation), allow for now, or default to pending
      if (error && error.code !== 'PGRST116') console.error(error);
      
      if (data && data.account_status === 'pending_approval') {
        await supabase.auth.signOut();
        alert("Your account is pending approval from an administrator. Please wait for confirmation.");
        return false;
      }
      return true;
    } catch (err) {
      console.error("Error checking account status", err);
      return true; // Fail open or closed depending on security preference. keeping open to avoid locking out on network error
    }
  };

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (data && !error) {
        setUserRole(data.role || 'user');
      }
    } catch (err) {
      console.error("Error fetching role", err);
    }
  };

  // Check if admin (Hardcoded fallback + Database Role)
  const isAdmin = user?.email === 'gerwinthepro@gmail.com' || userRole === 'admin';

  // --- REALTIME PRESENCE FOR EDIT LOCKING ---
  useEffect(() => {
    if (!user || !isAdmin) return;

    // Join a room to track admin presence
    const channel = supabase.channel('admin_coordination', {
      config: {
        presence: {
          key: user.id,
        },
      },
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
            // If someone ELSE is editing, lock it for us
            if (presence.isEditing && key !== user.id) {
              locked = true;
              lockerName = presence.email;
              break;
            }
          }
        }
        
        setIsEditLocked(locked);
        setLockedBy(lockerName);

        // If system becomes locked while we are editing (rare race condition), force disable
        if (locked && adminMode) {
           setAdminMode(false);
           alert(`Edit mode disabled. User ${lockerName} has started editing.`);
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

    return () => {
      channel.unsubscribe();
    };
  }, [user, isAdmin]); // Re-run if user changes

  // Update presence when local adminMode changes
  useEffect(() => {
    if (channelRef.current && user && isAdmin) {
      channelRef.current.track({
        email: user.email,
        isEditing: adminMode
      });
    }
  }, [adminMode, user, isAdmin]);

  const signOut = async () => {
    if (channelRef.current) {
        await channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
    }
    await supabase.auth.signOut();
    setAdminMode(false);
    setUserRole('user');
  };

  const toggleAdminMode = () => {
    if (!isAdmin) return;
    
    if (isEditLocked && !adminMode) {
      alert(`Edit mode is currently locked by ${lockedBy}. Please wait for them to finish.`);
      return;
    }
    
    setAdminMode(prev => !prev);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      isAdmin, 
      adminMode, 
      isEditLocked, 
      lockedBy, 
      toggleAdminMode, 
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