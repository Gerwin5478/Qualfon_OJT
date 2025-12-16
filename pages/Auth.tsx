import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, AlertCircle, User } from 'lucide-react';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Name Fields
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');

  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // AuthContext handles the 'pending_approval' check via onAuthStateChange
        navigate('/');
      } else {
        if (!firstName || !lastName) {
          throw new Error("First Name and Last Name are required.");
        }

        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              middle_name: middleName,
              last_name: lastName,
            }
          }
        });
        
        if (error) throw error;
        
        // Check email domain for immediate feedback
        const isQualfon = email.toLowerCase().endsWith('@qualfon.com');
        
        if (isQualfon) {
             setMessage('Registration successful! Please check your email to verify your account.');
        } else {
             setMessage('Registration successful! Since you are not using a @qualfon.com email, your account requires Admin Approval. Please check your email to verify, then wait for an admin to activate your account.');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fadeIn">
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 p-6 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-blue-100 text-sm">
            {isLogin 
              ? 'Sign in to access the Facilities & Security Portal' 
              : 'Register for full access to assets and forms'
            }
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-start gap-2 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className={`mb-4 border px-4 py-3 rounded-lg text-sm ${message.includes('Admin Approval') ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-green-50 border-green-200 text-green-600'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            
            {/* Registration Only Fields */}
            {!isLogin && (
              <div className="space-y-3 animate-slideUp">
                 <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        required={!isLogin}
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        required={!isLogin}
                        placeholder="Doe"
                      />
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Middle Name</label>
                    <input
                      type="text"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Optional"
                    />
                 </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  placeholder="name@qualfon.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Please wait...
                </>
              ) : (
                isLogin ? 'Sign In' : 'Sign Up'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setMessage(null);
                }}
                className="ml-1 text-blue-600 font-semibold hover:underline"
              >
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;