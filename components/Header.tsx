import React, { useState, useRef, useEffect } from 'react';
import { Download, Search, Bell, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { wikiContent } from '../data/wikiContent';

const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // LIVE SEARCH FUNCTION
  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setSearchResults([]);
      return;
    }

    const matches: any[] = [];

    wikiContent.forEach((page) => {
      // Match page title or summary
      if (
        page.title.toLowerCase().includes(query) ||
        page.summary.toLowerCase().includes(query)
      ) {
        matches.push({
          pageId: page.id,
          pageTitle: page.title,
          sectionTitle: page.title,
          preview: page.summary.substring(0, 100) + "..."
        });
      }

      // Match inside sections
      page.sections.forEach((section) => {
        let text = "";
        if (Array.isArray(section.content)) {
          text = section.content.map(item => {
            if (typeof item === 'string') return item;
            return item.label;
          }).join(" ").toLowerCase();
        } else {
          text = String(section.content).toLowerCase();
        }

        if (
          section.title.toLowerCase().includes(query) ||
          text.includes(query)
        ) {
          let preview = "";
          if (Array.isArray(section.content)) {
             const firstItem = section.content[0];
             if (typeof firstItem === 'string') {
               preview = firstItem;
             } else if (firstItem && typeof firstItem === 'object') {
               preview = firstItem.label;
             }
          } else {
             preview = String(section.content);
          }

          matches.push({
            pageId: page.id,
            pageTitle: page.title,
            sectionTitle: section.title,
            preview: preview.substring(0, 100) + "..."
          });
        }
      });
    });

    setSearchResults(matches.slice(0, 10)); // limit results
    setShowDropdown(matches.length > 0);

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
            {searchResults.length > 0 ? (
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

                    <p className="text-sm text-slate-700 group-hover:text-blue-600">
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

      {/* NOTIFICATIONS + DOWNLOAD */}
      <div className="flex items-center gap-4">

        <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500 relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="h-8 w-px bg-slate-200" />

        <button
          onClick={handleDownload}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg"
        >
          <Download size={16} />
          <span>Download Policy PDF</span>
        </button>

      </div>
    </header>
  );
};

export default Header;