import React, { useState, useRef, useEffect } from 'react';
import { Download, Search, Bell, ChevronRight, User, LogOut, LogIn, Loader2, Settings } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Search Debounce & Execution
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

      // Perform Search across Pages and Sections
      try {
        const { data: pages } = await supabase
          .from('wiki_pages')
          .select('id, title, summary')
          .ilike('title', `%${query}%`)
          .limit(5);

        const { data: sections } = await supabase
          .from('wiki_sections')
          .select('page_id, title, content')
          .ilike('title', `%${query}%`)
          .limit(5);

        const results = [];
        
        // Add Page matches
        if (pages) {
          pages.forEach(p => results.push({
            pageId: p.id,
            pageTitle: p.title,
            sectionTitle: 'Page Match',
            preview: p.summary ? p.summary.substring(0, 80) + '...' : ''
          }));
        }

        // Add Section matches
        if (sections) {
          for (const s of sections) {
             // We need the page title for context, fetch it simply or ignore if heavy
             // Ideally join, but let's just use section title
             results.push({
               pageId: s.page_id,
               pageTitle: 'Section Match', // could fetch actual page title if needed
               sectionTitle: s.title,
               preview: 'Matched in content section'
             });
          }
        }

        setSearchResults(results.slice(0, 8));
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleResultClick = (pageId: string) => {
    navigate(`/policy/${pageId}`);
    setShowDropdown(false);
    setSearchQuery("");
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href =
      'https://qualfon-my.sharepoint.com/personal/francis_tadena_qualfon_com/SiteAssets/SitePages/KPI-Creation-Process-&-Guidelines/FD-06-Fixed-Asset-Policy-v4_e-signed.pdf';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = 'FD-06_Fixed_Asset_Policy.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
    navigate('/');
  };

  const userAvatar = user?.user_metadata?.avatar_url;
  const userName = user?.user_metadata?.first_name 
      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`
      : user?.email;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-50 shadow-sm">
      
      {/* SEARCH BAR */}
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

        {/* DROPDOWN */}
        {showDropdown && (
          <div className="absolute top-full mt-2 bg-white w-full shadow-xl border border-slate-200 rounded-xl z-50 overflow-hidden">
            {searching ? (
               <div className="p-4 flex justify-center text-slate-400">
                  <Loader2 className="animate-spin" size={20} />
               </div>
            ) : searchResults.length > 0 ? (
              <div className="max-h-72 overflow-y-auto">
                {searchResults.map((result, i) => (
                  <button
                    key={i}
                    onClick={() => handleResultClick(result.pageId)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 group"
                  >
                    <div className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                      <span className="font-semibold">{result.pageTitle}</span>
                      <ChevronRight size={12} />
                      <span>{result.sectionTitle}</span>
                    </div>

                    <p className="text-sm text-slate-700 group-hover:text-blue-600 truncate">
                      {result.preview}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-slate-500 text-sm">
                No results found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* NOTIFICATIONS + DOWNLOAD + AUTH */}
      <div className="flex items-center gap-4">

        <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500 relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="h-8 w-px bg-slate-200" />

        <button
          onClick={handleDownload}
          className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all"
        >
          <Download size={16} />
          <span>Policy PDF</span>
        </button>

        {/* Auth Button */}
        <div className="relative" ref={userMenuRef}>
          {user ? (
            <div>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-9 h-9 bg-slate-800 text-white rounded-full flex items-center justify-center hover:ring-4 hover:ring-slate-100 transition-all overflow-hidden"
              >
                {userAvatar ? (
                  <img src={userAvatar} alt="User" className="w-full h-full object-cover" />
                ) : (
                   user.email ? user.email[0].toUpperCase() : <User size={18} />
                )}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-fadeIn z-[100]">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs text-slate-400 font-semibold uppercase">Signed in as</p>
                    <p className="text-sm font-medium text-slate-800 truncate">{userName}</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                  >
                    <Settings size={16} />
                    Manage Account
                  </Link>
                  <button 
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium text-sm px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <LogIn size={18} />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;