import React, { useState, useRef, useEffect } from 'react';
import { Download, Search, Bell, ChevronRight, User, LogOut, LogIn, Loader2, Settings, Send, X, Clock, Briefcase, Info, AlertCircle, Trash2, AlertTriangle, Users, UserCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Notification {
  id: string;
  sender_name: string;
  company_position: string;
  purpose: string;
  content: string;
  created_at: string;
}

const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [deleteNotifConfirm, setDeleteNotifConfirm] = useState<{ id: string, purpose: string } | null>(null);
  const [notifForm, setNotifForm] = useState({
    position: '',
    purpose: '',
    content: ''
  });

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();
  const { user, profile, signOut, isAdmin, adminMode } = useAuth();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setNotifications(data);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSendingNotif(true);

    const userName = profile?.first_name 
      ? `${profile.first_name} ${profile.last_name || ''}`
      : user.email;

    try {
      const { error } = await supabase.from('notifications').insert({
        sender_name: userName,
        sender_email: user.email,
        company_position: notifForm.position,
        purpose: notifForm.purpose,
        content: notifForm.content
      });

      if (error) throw error;
      
      setNotifForm({ position: '', purpose: '', content: '' });
      setShowNotifModal(false);
      await fetchNotifications();
    } catch (err: any) {
      alert("Error sending notification: " + err.message);
    } finally {
      setIsSendingNotif(false);
    }
  };

  const confirmDeleteNotif = async () => {
    if (!deleteNotifConfirm) return;
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', deleteNotifConfirm.id);
      if (error) throw error;
      setDeleteNotifConfirm(null);
      await fetchNotifications();
    } catch (err: any) {
      alert("Error deleting notification: " + err.message);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) {
        setSearchResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      setShowDropdown(true);

      try {
        const { data: pages } = await supabase.from('wiki_pages').select('id, title, summary').ilike('title', `%${query}%`).limit(5);
        const { data: sections } = await supabase.from('wiki_sections').select('page_id, title, content').ilike('title', `%${query}%`).limit(5);
        const results: any[] = [];
        if (pages) pages.forEach(p => results.push({ pageId: p.id, pageTitle: p.title, sectionTitle: 'Page Match', preview: p.summary?.substring(0, 80) + '...' }));
        if (sections) sections.forEach(s => results.push({ pageId: s.page_id, pageTitle: 'Section Match', sectionTitle: s.title, preview: 'Matched in content section' }));
        setSearchResults(results.slice(0, 8));
      } catch (err) { console.error(err); } finally { setSearching(false); }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleDownload = () => {
    window.open('https://qualfon-my.sharepoint.com/personal/francis_tadena_qualfon_com/SiteAssets/SitePages/KPI-Creation-Process-&-Guidelines/FD-06-Fixed-Asset-Policy-v4_e-signed.pdf', '_blank');
  };

  const displayName = profile?.first_name 
      ? `${profile.first_name} ${profile.last_name || ''}`
      : user?.email;

  const initial = profile?.first_name ? profile.first_name[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : <User size={18} />);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-50 shadow-sm">
      <div className="flex-1 max-w-md relative" ref={searchRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          value={searchQuery}
          onFocus={() => searchQuery && setShowDropdown(true)}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for procedures, forms, or codes..."
          className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 text-slate-700"
        />
        {showDropdown && (
          <div className="absolute top-full mt-2 bg-white w-full shadow-xl border border-slate-200 rounded-xl z-50 overflow-hidden">
            {searching ? <div className="p-4 flex justify-center text-slate-400"><Loader2 className="animate-spin" size={20} /></div> : searchResults.length > 0 ? (
              <div className="max-h-72 overflow-y-auto">
                {searchResults.map((result, i) => (
                  <button key={i} onClick={() => { navigate(`/policy/${result.pageId}`); setShowDropdown(false); setSearchQuery(""); }} className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 group">
                    <div className="text-xs text-slate-500 flex items-center gap-1 mb-1"><span className="font-semibold">{result.pageTitle}</span><ChevronRight size={12} /><span>{result.sectionTitle}</span></div>
                    <p className="text-sm text-slate-700 group-hover:text-blue-600 truncate">{result.preview}</p>
                  </button>
                ))}
              </div>
            ) : <div className="p-4 text-center text-slate-500 text-sm">No results found.</div>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={notifRef}>
          <button onClick={() => setShowNotifDropdown(!showNotifDropdown)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 relative transition-colors">
            <Bell size={20} />
            {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />}
          </button>
          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <span className="font-bold text-sm text-slate-800">Notifications</span>
                {adminMode && (
                  <button onClick={() => { setShowNotifModal(true); setShowNotifDropdown(false); }} className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded flex items-center gap-1 transition-all">
                    <Send size={10} /> Broadcast
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? notifications.map(n => (
                  <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">{n.purpose}</span>
                        {adminMode && (
                          <button onClick={(e) => { e.stopPropagation(); setDeleteNotifConfirm({ id: n.id, purpose: n.purpose }); setShowNotifDropdown(false); }} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 flex items-center gap-1"><Clock size={8} /> {new Date(n.created_at).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium mb-2">{n.content}</p>
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold italic">
                      <User size={8} /> {n.sender_name} <span className="text-slate-300">•</span> <Briefcase size={8} /> {n.company_position}
                    </div>
                  </div>
                )) : <div className="p-8 text-center text-slate-400 text-xs italic">No department notices</div>}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200" />

        <button onClick={handleDownload} className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all">
          <Download size={16} /> <span>Policy PDF</span>
        </button>

        <div className="relative" ref={notifRef}>
          {user ? (
            <div>
              <button onClick={() => setShowUserMenu(!showUserMenu)} className="w-9 h-9 bg-slate-800 text-white rounded-full flex items-center justify-center hover:ring-4 hover:ring-slate-100 transition-all overflow-hidden font-bold">
                {initial}
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-fadeIn z-[100]">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs text-slate-400 font-semibold uppercase">Signed in as</p>
                    <p className="text-sm font-medium text-slate-800 truncate">{displayName}</p>
                  </div>
                  <Link to="/profile" onClick={() => setShowUserMenu(false)} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors">
                    <UserCircle size={16} /> Manage Account
                  </Link>
                  {isAdmin && (
                    <Link to="/admin/users" onClick={() => setShowUserMenu(false)} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors">
                      <Users size={16} /> User Management
                    </Link>
                  )}
                  <button onClick={async () => { await signOut(); setShowUserMenu(false); navigate('/'); }} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : <Link to="/auth" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium text-sm px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"><LogIn size={18} /> <span className="hidden sm:inline">Sign In</span></Link>}
        </div>
      </div>

      {showNotifModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
            <form onSubmit={handleSendNotification}>
              <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg"><Send size={20} /></div>
                  <div>
                    <h3 className="font-bold text-lg">Broadcast Notice</h3>
                    <p className="text-[10px] text-blue-100">Message will be visible to all employees</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowNotifModal(false)} className="hover:bg-white/20 p-1 rounded-full"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Company Position</label>
                  <input required type="text" placeholder="e.g. Facilities Manager" value={notifForm.position} onChange={(e) => setNotifForm({...notifForm, position: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Purpose</label>
                  <input required type="text" placeholder="e.g. Emergency Maintenance" value={notifForm.purpose} onChange={(e) => setNotifForm({...notifForm, purpose: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Message Content</label>
                  <textarea required rows={4} placeholder="Describe the update clearly..." value={notifForm.content} onChange={(e) => setNotifForm({...notifForm, content: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                </div>
              </div>
              <div className="bg-slate-50 p-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowNotifModal(false)} className="px-4 py-2 text-sm font-semibold text-slate-500">Cancel</button>
                <button type="submit" disabled={isSendingNotif} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 flex items-center gap-2 transition-all disabled:opacity-50">
                  {isSendingNotif ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Send Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteNotifConfirm && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-slideUp border border-slate-100">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-100">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Notification?</h3>
              <p className="text-sm text-slate-600 mb-6">Are you sure you want to remove this notice? It will disappear for all employees.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setDeleteNotifConfirm(null)} className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors border border-slate-200">Cancel</button>
                <button onClick={confirmDeleteNotif} className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                  <Trash2 size={16} /> Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;