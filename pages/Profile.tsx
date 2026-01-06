
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, Mail, Save, Camera, Loader2, 
  CheckCircle, AlertCircle, UserCircle, 
  Lock, Eye, EyeOff, ShieldCheck 
} from 'lucide-react';

const Profile: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const isMounted = useRef(true);

  // Profile Info States
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');

  // Password Management States
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    isMounted.current = true;
    if (profile) {
      setAvatarUrl(profile.avatar_url || null);
      setFirstName(profile.first_name || '');
      setMiddleName(profile.middle_name || '');
      setLastName(profile.last_name || '');
    }
    return () => { isMounted.current = false; };
  }, [profile]);

  const showGlobalMessage = (type: 'success' | 'error', text: string) => {
    if (!isMounted.current) return;
    setMessage({ type, text });
    setTimeout(() => {
      if (isMounted.current) setMessage(null);
    }, 5000);
  };

  const showPassMessage = (type: 'success' | 'error', text: string) => {
    if (!isMounted.current) return;
    setPasswordMessage({ type, text });
    setTimeout(() => {
      if (isMounted.current) setPasswordMessage(null);
    }, 5000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 153600) { 
        showGlobalMessage('error', 'Image is too heavy. Please use a photo under 150KB.');
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (isMounted.current) setAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const updateProfile = async () => {
    if (!user) return;
    setLoadingProfile(true);
    setMessage(null);

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          middle_name: middleName.trim(),
          last_name: lastName.trim(),
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;
      await refreshProfile();
      showGlobalMessage('success', 'Profile updated successfully.');
    } catch (err: any) {
      console.error("Update Error:", err);
      showGlobalMessage('error', err.message || 'Failed to update profile.');
    } finally {
      if (isMounted.current) setLoadingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!user?.email) return;
    if (!currentPassword || !newPassword) {
      showPassMessage('error', 'Please fill in both password fields.');
      return;
    }
    if (newPassword.length < 6) {
      showPassMessage('error', 'New password must be at least 6 characters.');
      return;
    }

    setLoadingPassword(true);
    setPasswordMessage(null);

    try {
      // 1. Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect.');
      }

      // 2. Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      showPassMessage('success', 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      showPassMessage('error', err.message || 'Failed to update password.');
    } finally {
      if (isMounted.current) setLoadingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn pb-20">
      {/* Header & Avatar Card */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 shadow-inner bg-slate-200 flex items-center justify-center transition-all group-hover:border-blue-100">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={64} className="text-slate-400" />
            )}
          </div>
          <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-all shadow-lg hover:scale-110 active:scale-95">
            <Camera size={18} />
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={loadingProfile} />
          </label>
        </div>
        
        <div className="text-center md:text-left flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Account Management</h1>
          <p className="text-slate-500 mb-4">Manage your identity and security settings.</p>
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 inline-flex">
            <Mail size={14} /> {user?.email}
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border shadow-sm animate-slideDown ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Personal Details Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <UserCircle size={18} className="text-blue-600" /> Personal Details
              </h2>
          </div>
          <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">First Name</label>
                      <input 
                        type="text" 
                        value={firstName} 
                        onChange={(e) => setFirstName(e.target.value)} 
                        disabled={loadingProfile}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50" 
                        placeholder="John"
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Middle Name</label>
                      <input 
                        type="text" 
                        value={middleName} 
                        onChange={(e) => setMiddleName(e.target.value)} 
                        disabled={loadingProfile}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50" 
                        placeholder="Middle"
                      />
                  </div>
                  <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Last Name</label>
                      <input 
                        type="text" 
                        value={lastName} 
                        onChange={(e) => setLastName(e.target.value)} 
                        disabled={loadingProfile}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50" 
                        placeholder="Doe"
                      />
                  </div>
              </div>

              <div className="pt-4">
                  <button 
                      onClick={updateProfile}
                      disabled={loadingProfile}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:bg-slate-400 active:scale-95"
                  >
                      {loadingProfile ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                      Save Profile Changes
                  </button>
              </div>
          </div>
      </div>

      {/* Security Section (Change Password) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <Lock size={18} className="text-red-500" /> Security & Password
              </h2>
          </div>
          <div className="p-8 space-y-6">
              {passwordMessage && (
                <div className={`p-3 rounded-lg text-sm flex items-center gap-2 border ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {passwordMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {passwordMessage.text}
                </div>
              )}

              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Current Password</label>
                  <div className="relative">
                    <input 
                      type={showCurrentPassword ? "text" : "password"} 
                      value={currentPassword} 
                      onChange={(e) => setCurrentPassword(e.target.value)} 
                      disabled={loadingPassword}
                      className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50" 
                      placeholder="Enter current password"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">New Password</label>
                  <div className="relative">
                    <input 
                      type={showNewPassword ? "text" : "password"} 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      disabled={loadingPassword}
                      className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50" 
                      placeholder="Minimum 6 characters"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                  <button 
                      onClick={handleUpdatePassword}
                      disabled={loadingPassword}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:bg-slate-400 active:scale-95"
                  >
                      {loadingPassword ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                      Update Secure Password
                  </button>
              </div>
          </div>
      </div>

      <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center">
          <p className="text-xs text-slate-500 font-medium">Keep your credentials secure. Avoid using passwords from other personal accounts.</p>
      </div>
    </div>
  );
};

export default Profile;
