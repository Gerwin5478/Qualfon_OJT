import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, User, Mail, Phone, MapPin, Clock, Shield, MoreHorizontal, X, Loader2, Activity, CheckCircle, Smartphone, Trash2, Edit, AlertCircle, AlertTriangle, UserCheck } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  address: string | null;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  updated_at: string;
  created_at?: string; 
  role?: string; 
  account_status?: 'active' | 'pending_approval' | 'disabled';
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewFilter, setViewFilter] = useState<'all' | 'pending'>('all');

  // Confirmation Modal State
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'change_role' | 'approve';
    user: UserProfile;
    newRole?: string;
  } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use updated_at for sorting as it is more likely to exist/be populated in profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      // improved error extraction
      let errorMessage = "An unexpected error occurred.";
      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err?.error_description) {
         errorMessage = err.error_description;
      } else if (typeof err === 'object') {
         errorMessage = JSON.stringify(err);
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async () => {
    if (!confirmAction) return;
    setIsUpdating(true);

    try {
      if (confirmAction.type === 'delete') {
         // Call the Database Function (RPC) to delete the user
         const { error } = await supabase.rpc('delete_user_by_id', { target_user_id: confirmAction.user.id });
         if (error) throw error;
         
         // If successful
         if (selectedUser?.id === confirmAction.user.id) setSelectedUser(null);
         fetchUsers();
      } 
      else if (confirmAction.type === 'change_role' && confirmAction.newRole) {
         const { error } = await supabase
            .from('profiles')
            .update({ role: confirmAction.newRole })
            .eq('id', confirmAction.user.id);

         if (error) throw error;
         
         // Update local state
         setUsers(users.map(u => u.id === confirmAction.user.id ? { ...u, role: confirmAction.newRole } : u));
         if (selectedUser?.id === confirmAction.user.id) {
             setSelectedUser({ ...selectedUser, role: confirmAction.newRole });
         }
      }
      else if (confirmAction.type === 'approve') {
          const { error } = await supabase
            .from('profiles')
            .update({ account_status: 'active' })
            .eq('id', confirmAction.user.id);
          
          if (error) throw error;
          
          setUsers(users.map(u => u.id === confirmAction.user.id ? { ...u, account_status: 'active' } : u));
          if (selectedUser?.id === confirmAction.user.id) {
             setSelectedUser({ ...selectedUser, account_status: 'active' });
          }
      }

      setConfirmAction(null);
    } catch (err: any) {
       alert("Action failed: " + (err.message || JSON.stringify(err)));
    } finally {
       setIsUpdating(false);
    }
  };

  const pendingCount = users.filter(u => u.account_status === 'pending_approval').length;

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
     (user.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     user.phone?.includes(searchQuery) ||
     user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.address?.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter = viewFilter === 'all' ? true : user.account_status === 'pending_approval';

    return matchesSearch && matchesFilter;
  });

  const getInitials = (user: UserProfile) => {
    if (user.first_name && user.last_name) {
        return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.email ? user.email.substring(0, 2).toUpperCase() : '??';
  };

  const getFullName = (user: UserProfile) => {
      const names = [user.first_name, user.middle_name, user.last_name].filter(Boolean);
      return names.length > 0 ? names.join(' ') : 'No Name Set';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-12">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <User className="text-blue-600" /> User Management
          </h1>
          <p className="text-slate-500">View and monitor registered users and their account status.</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm shadow-sm"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button 
            onClick={() => setViewFilter('all')}
            className={`pb-3 px-1 text-sm font-medium transition-all ${viewFilter === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
            All Users
        </button>
        <button 
            onClick={() => setViewFilter('pending')}
            className={`pb-3 px-1 text-sm font-medium transition-all flex items-center gap-2 ${viewFilter === 'pending' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
            Pending Approvals
            {pendingCount > 0 && <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{pendingCount}</span>}
        </button>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 break-all">
            <AlertCircle size={20} className="shrink-0" />
            <p>{error}</p>
        </div>
      )}

      {/* Users Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-500" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div 
                key={user.id} 
                onClick={() => setSelectedUser(user)}
                className={`rounded-xl border shadow-sm p-6 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group relative overflow-hidden ${user.account_status === 'pending_approval' ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-slate-500 font-bold text-lg">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(user)
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                      {user.account_status === 'pending_approval' ? (
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded-full border border-amber-200 flex items-center gap-1">
                             <AlertCircle size={10} /> Pending Approval
                          </span>
                      ) : (
                          <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase rounded-full border border-green-100 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Active
                          </span>
                      )}
                      
                      {user.role === 'admin' && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold uppercase rounded-full border border-purple-200">
                             Admin
                          </span>
                      )}
                  </div>
                </div>
                
                <h3 className="font-bold text-slate-800 truncate mb-1">
                    {user.first_name || user.last_name ? getFullName(user) : user.email}
                </h3>
                { (user.first_name || user.last_name) && (
                    <p className="text-xs text-slate-400 truncate mb-1">{user.email}</p>
                )}

                <p className="text-xs text-slate-500 mb-4 flex items-center gap-1 mt-2">
                  <Clock size={12} /> Registered: {new Date(user.created_at || user.updated_at).toLocaleDateString()}
                </p>

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                  <span className="text-slate-500">View Details</span>
                  <div className="p-1.5 bg-slate-50 rounded-full text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <MoreHorizontal size={16} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <User size={48} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-500 font-medium">No users found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slideUp flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className={`relative p-6 pb-16 ${selectedUser.account_status === 'pending_approval' ? 'bg-amber-600' : 'bg-slate-800'}`}>
               <button 
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 p-2 bg-white/10 text-white hover:bg-white/20 rounded-full transition-colors"
               >
                 <X size={20} />
               </button>
               <h2 className="text-white text-xl font-bold flex items-center gap-2">
                 <Shield size={20} className="text-white/80" /> User Profile
                 {selectedUser.account_status === 'pending_approval' && <span className="text-xs bg-white text-amber-600 px-2 py-0.5 rounded-full">Pending Approval</span>}
               </h2>
               <p className="text-white/60 text-sm">System ID: {selectedUser.id}</p>
            </div>

            {/* Profile Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
               <div className="px-8 -mt-10 mb-6">
                 <div className="flex flex-col md:flex-row gap-6 items-end md:items-start">
                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg shrink-0">
                        <div className="w-full h-full rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-2xl font-bold text-slate-400">
                            {selectedUser.avatar_url ? (
                                <img src={selectedUser.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                getInitials(selectedUser)
                            )}
                        </div>
                    </div>
                    
                    {/* Main Info */}
                    <div className="flex-1 pt-2 md:pt-10">
                        <h3 className="text-2xl font-bold text-slate-800">{getFullName(selectedUser)}</h3>
                        <p className="text-slate-500 mb-2">{selectedUser.email}</p>
                        
                        {/* Role Selector */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 uppercase">Role:</span>
                            <select 
                                value={selectedUser.role || 'user'} 
                                onChange={(e) => setConfirmAction({ type: 'change_role', user: selectedUser, newRole: e.target.value })}
                                disabled={isUpdating}
                                className="text-xs font-bold bg-slate-100 border border-slate-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="user">Standard User</option>
                                <option value="admin">Administrator</option>
                            </select>
                        </div>
                    </div>
                 </div>
               </div>

               <div className="px-8 pb-8 space-y-6">
                  {/* Approval Action */}
                  {selectedUser.account_status === 'pending_approval' && (
                      <div className="bg-amber-50 p-6 rounded-xl border border-amber-200">
                          <h4 className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                              <AlertCircle size={14} /> Action Required
                          </h4>
                          <p className="text-xs text-amber-800 mb-4">
                              This user registered with a non-Qualfon email and requires approval to access the system.
                          </p>
                          <button 
                            onClick={() => setConfirmAction({ type: 'approve', user: selectedUser })}
                            disabled={isUpdating}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold py-2.5 px-4 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                          >
                             {isUpdating ? <Loader2 className="animate-spin" size={16} /> : <UserCheck size={16} />}
                             Approve User Account
                          </button>
                      </div>
                  )}

                  {/* Contact Info */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <User size={14} /> Personal & Contact Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label className="text-xs text-slate-500 block mb-1">Full Name</label>
                              <div className="text-slate-800 font-medium">
                                  {getFullName(selectedUser)}
                              </div>
                          </div>
                           <div>
                              <label className="text-xs text-slate-500 block mb-1">Phone Number</label>
                              <div className="flex items-center gap-2 text-slate-800 font-medium">
                                  <Phone size={16} className="text-blue-500" /> {selectedUser.phone || 'Not provided'}
                              </div>
                          </div>
                          <div>
                              <label className="text-xs text-slate-500 block mb-1">Email Address</label>
                              <div className="flex items-center gap-2 text-slate-800 font-medium">
                                  <Mail size={16} className="text-blue-500" /> {selectedUser.email}
                              </div>
                          </div>
                         
                          <div className="md:col-span-2">
                              <label className="text-xs text-slate-500 block mb-1">Physical Address</label>
                              <div className="flex items-start gap-2 text-slate-800 font-medium">
                                  <MapPin size={16} className="text-blue-500 mt-0.5 shrink-0" /> 
                                  <span>{selectedUser.address || 'No address registered'}</span>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                      <h4 className="text-sm font-bold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <Trash2 size={14} /> Danger Zone
                      </h4>
                      <p className="text-xs text-red-600 mb-4">
                        Deleting this user is irreversible. All associated data (profile, history) will be removed.
                      </p>
                      <button 
                        onClick={() => setConfirmAction({ type: 'delete', user: selectedUser })}
                        disabled={isUpdating}
                        className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                         <Trash2 size={16} />
                         Delete User Account
                      </button>
                  </div>

               </div>
            </div>

          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-slideUp border border-slate-200">
                <div className="p-6 text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                        confirmAction.type === 'delete' ? 'bg-red-100 text-red-600' : 
                        confirmAction.type === 'approve' ? 'bg-green-100 text-green-600' :
                        'bg-blue-100 text-blue-600'
                    }`}>
                        {confirmAction.type === 'delete' ? <AlertTriangle size={24} /> : 
                         confirmAction.type === 'approve' ? <UserCheck size={24} /> :
                         <Shield size={24} />}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                        {confirmAction.type === 'delete' ? 'Delete User?' : 
                         confirmAction.type === 'approve' ? 'Approve Account?' :
                         'Change Role?'}
                    </h3>
                    <p className="text-sm text-slate-600 mb-4">
                        {confirmAction.type === 'delete' 
                            ? <span>Are you sure you want to delete <span className="font-semibold">{confirmAction.user.email}</span>? This action cannot be undone.</span>
                            : confirmAction.type === 'approve'
                            ? <span>Activate account for <span className="font-semibold">{confirmAction.user.email}</span>? They will be able to log in immediately.</span>
                            : <span>Change role for <span className="font-semibold">{confirmAction.user.email}</span> to <span className="font-bold uppercase">{confirmAction.newRole}</span>?</span>
                        }
                    </p>
                    
                    <div className="flex gap-3 justify-center">
                        <button 
                            onClick={() => setConfirmAction(null)}
                            className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={executeAction}
                            disabled={isUpdating}
                            className={`px-4 py-2 text-white font-medium rounded-lg transition-colors shadow-md flex items-center gap-2 ${
                                confirmAction.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 
                                confirmAction.type === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                                'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {isUpdating && <Loader2 className="animate-spin" size={16} />}
                            {confirmAction.type === 'delete' ? 'Yes, Delete' : 
                             confirmAction.type === 'approve' ? 'Approve' :
                             'Confirm'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default AdminUsers;