import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Phone, MapPin, Lock, Save, Camera, Loader2, CheckCircle, AlertCircle, Smartphone, UserCircle } from 'lucide-react';

const Profile: React.FC = () => {
  const { user } = useAuth();
  // Separate loading states
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingPhone, setLoadingPhone] = useState(false);
  
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Profile State
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');

  // Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Phone State
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);

  useEffect(() => {
    if (user) {
      setAddress(user.user_metadata?.address || '');
      setAvatarUrl(user.user_metadata?.avatar_url || null);
      setPhone(user.phone || '');
      setFirstName(user.user_metadata?.first_name || '');
      setMiddleName(user.user_metadata?.middle_name || '');
      setLastName(user.user_metadata?.last_name || '');
    }
  }, [user]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // --- 1. PROFILE IMAGE & DETAILS ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit size to 100KB for metadata storage (since we aren't using a bucket)
    if (file.size > 100000) {
        showMessage('error', 'Image too large. Please use an image under 100KB.');
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setAvatarUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const updateProfile = async () => {
    setLoadingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
          address: address,
          avatar_url: avatarUrl
        }
      });

      if (error) throw error;
      showMessage('success', 'Profile information updated successfully.');
    } catch (err: any) {
      showMessage('error', err.message);
    } finally {
      setLoadingProfile(false);
    }
  };

  // --- 2. PASSWORD CHANGE ---
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showMessage('error', "New passwords do not match.");
      return;
    }
    if (!oldPassword) {
      showMessage('error', "Please enter your current password to confirm changes.");
      return;
    }

    setLoadingPassword(true);
    try {
      // 1. Verify Old Password by trying to Sign In
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: oldPassword
      });

      if (signInError) {
        throw new Error("Current password is incorrect.");
      }

      // 2. Update to New Password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      showMessage('success', 'Password changed successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showMessage('error', err.message);
    } finally {
      setLoadingPassword(false);
    }
  };

  // --- 3. PHONE NUMBER ---
  const handleUpdatePhone = async () => {
    if (!phone) return;
    setLoadingPhone(true);
    try {
      const { error } = await supabase.auth.updateUser({
        phone: phone
      });
      if (error) throw error;
      
      setIsVerifyingPhone(true);
      showMessage('success', 'Confirmation code sent to your phone.');
    } catch (err: any) {
      showMessage('error', err.message);
    } finally {
      setLoadingPhone(false);
    }
  };

  const handleVerifyPhone = async () => {
    setLoadingPhone(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: otp,
        type: 'phone_change'
      });
      
      if (error) throw error;

      setIsVerifyingPhone(false);
      setOtp('');
      showMessage('success', 'Phone number verified and updated.');
    } catch (err: any) {
      showMessage('error', err.message);
    } finally {
      setLoadingPhone(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 shadow-inner bg-slate-200 flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={64} className="text-slate-400" />
            )}
          </div>
          <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
            <Camera size={18} />
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
          </label>
        </div>
        
        <div className="text-center md:text-left flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Manage Account</h1>
          <p className="text-slate-500 mb-4">Update your profile details and security settings.</p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
             <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
               <Mail size={14} /> {user?.email}
             </div>
             {user?.phone && (
               <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                 <Phone size={14} /> {user.phone}
               </div>
             )}
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: General Info */}
        <div className="space-y-8">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <UserCircle size={18} className="text-blue-600" /> Basic Information
                    </h2>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <input type="text" value={user?.email || ''} disabled className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed" />
                    </div>

                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                            <input 
                                type="text" 
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="John"
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Middle Name</label>
                            <input 
                                type="text" 
                                value={middleName}
                                onChange={(e) => setMiddleName(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="Optional"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                        <input 
                            type="text" 
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                            <textarea 
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                rows={3}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="Enter your full address..."
                            />
                        </div>
                    </div>
                    <button 
                        onClick={updateProfile}
                        disabled={loadingProfile}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {loadingProfile ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <Smartphone size={18} className="text-blue-600" /> Phone Number
                    </h2>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-xs text-slate-500">
                        To change your phone number, you will need to verify the new number via SMS code.
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+1234567890"
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            {!isVerifyingPhone && (
                                <button 
                                    onClick={handleUpdatePhone}
                                    disabled={loadingPhone || phone === user?.phone}
                                    className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium text-sm disabled:opacity-50"
                                >
                                    Update
                                </button>
                            )}
                        </div>
                    </div>

                    {isVerifyingPhone && (
                        <div className="animate-fadeIn p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-3">
                            <label className="block text-sm font-bold text-blue-800">Enter Authentication Code</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="123456"
                                    className="flex-1 px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <button 
                                    onClick={handleVerifyPhone}
                                    disabled={loadingPhone}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                                >
                                    Verify
                                </button>
                            </div>
                            <p className="text-xs text-blue-600 cursor-pointer hover:underline" onClick={() => setIsVerifyingPhone(false)}>Cancel verification</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Right Column: Security */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-fit">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                    <Lock size={18} className="text-blue-600" /> Security
                </h2>
            </div>
            <div className="p-6">
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg mb-4">
                        <p className="text-xs text-yellow-800 flex gap-2">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                            For your security, you must enter your current password to set a new one.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                        <input 
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    <hr className="border-slate-100 my-2" />

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                        <input 
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                        <input 
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={loadingPassword}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 mt-4"
                    >
                        {loadingPassword ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />}
                        Update Password
                    </button>
                </form>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;