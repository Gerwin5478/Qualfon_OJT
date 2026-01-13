import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { User, Save, Loader2, CheckCircle2, AlertCircle, ArrowLeft, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const isMounted = useRef(true);
  const hasInitialized = useRef(false);

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');

  const [loadingPassword, setLoadingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [globalMessage, setGlobalMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    isMounted.current = true;
    if (profile && !hasInitialized.current) {
      setFirstName(profile.first_name || '');
      setMiddleName(profile.middle_name || '');
      setLastName(profile.last_name || '');
      hasInitialized.current = true;
    }
    return () => { isMounted.current = false; };
  }, [profile]);

  const showGlobalMessage = (type: 'success' | 'error', text: string) => {
    setGlobalMessage({ type, text });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { if (isMounted.current) setGlobalMessage(null); }, 5000);
  };

  const updateProfile = async () => {
    if (!user) return;
    setLoadingProfile(true);
    
    try {
      // Update the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: firstName.trim(),
          middle_name: middleName.trim(),
          last_name: lastName.trim(),
          avatar_url: null, // Forcefully nullify
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      // Update Auth Metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim(),
          middle_name: middleName.trim(),
          last_name: lastName.trim(),
          avatar_url: null // Ensure auth token stays small
        }
      });

      if (authError) throw authError;

      hasInitialized.current = false;
      await refreshProfile();
      
      showGlobalMessage('success', 'Profile updated successfully.');
    } catch (err: any) {
      console.error("Save Error:", err);
      showGlobalMessage('error', err.message || 'Failed to update profile.');
    } finally {
      if (isMounted.current) setLoadingProfile(false);
    }
  };

  const updatePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      showGlobalMessage('error', 'Passwords do not match.');
      return;
    }
    setLoadingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      showGlobalMessage('success', 'Password updated.');
    } catch (err: any) {
      showGlobalMessage('error', err.message || 'Failed to update password.');
    } finally {
      if (isMounted.current) setLoadingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 animate-fadeIn">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-8 transition-colors font-medium">
        <ArrowLeft size={18} /> Back to Dashboard
      </Link>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 px-8 py-12 text-white text-center relative">
          <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
          <p className="text-blue-100 opacity-80">Update your information and security preferences</p>
        </div>

        <div className="px-8 pb-12 -mt-10 relative z-20">
          <div className="flex flex-col items-center mb-10">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-slate-100 shadow-xl overflow-hidden flex items-center justify-center text-slate-400 font-bold text-4xl">
                {firstName ? firstName[0].toUpperCase() : <User size={48} />}
              </div>
            </div>
            <div className="mt-4 text-center">
              <h2 className="text-xl font-bold text-slate-800">{firstName} {lastName}</h2>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>

          {globalMessage && (
            <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 animate-slideDown ${globalMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              {globalMessage.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="font-medium">{globalMessage.text}</span>
            </div>
          )}

          <div className="space-y-12">
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Identity</h3>
                <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="text" placeholder="Middle Name" value={middleName} onChange={(e) => setMiddleName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex flex-col justify-end">
                <button onClick={updateProfile} disabled={loadingProfile} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all">
                  {loadingProfile ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save Changes
                </button>
              </div>
            </section>

            <section className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Lock size={14}/> Security</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none" />
                <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none" />
                <button onClick={updatePassword} disabled={loadingPassword} className="w-full py-3 bg-slate-800 text-white font-bold rounded-2xl">Update Password</button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;