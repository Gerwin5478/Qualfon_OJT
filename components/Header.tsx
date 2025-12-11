import React, { useState, useRef, useEffect } from 'react';
import { Download, Search, Bell, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { wikiContent } from '../data/wikiContent';

const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    pageId: string;
    pageTitle: string;
    sectionTitle: string;
    preview: string;
  }>>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search function
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    const normalizedQuery = searchQuery.toLowerCase().trim();
    
    const results = wikiContent.flatMap(page => {
      const pageResults = [];
      
      // Check page title and summary
      if (page.title.toLowerCase().includes(normalizedQuery) || 
          page.summary.toLowerCase().includes(normalizedQuery)) {
        pageResults.push({
          pageId: page.id,
          pageTitle: page.title,
          sectionTitle: page.title,
          preview: page.summary
        });
      }
      
      // Check sections
      page.sections.forEach(section => {
        let contentText = '';
        if (Array.isArray(section.content)) {
          contentText = section.content.join(' ').toLowerCase();
        } else {
          contentText = String(section.content).toLowerCase();
        }
        
        if (section.title.toLowerCase().includes(normalizedQuery) || 
            contentText.includes(normalizedQuery)) {
          pageResults.push({
            pageId: page.id,
            pageTitle: page.title,
            sectionTitle: section.title,
            preview: Array.isArray(section.content) 
              ? section.content[0]?.substring(0, 80) + '...' 
              : String(section.content).substring(0, 80) + '...'
          });
        }
      });
      
      return pageResults;
    });

    setSearchResults(results.slice(0, 8)); // Limit to 8 results
    setShowDropdown(results.length > 0);
    setIsSearching(false);
  }, [searchQuery]);

  const handleResultClick = (pageId: string) => {
    navigate(`/policy/${pageId}`, { state: { searchQuery } });
    setShowDropdown(false);
    setSearchQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim() && searchResults.length > 0) {
      handleResultClick(searchResults[0].pageId);
    }
    if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = 'https://qualfon-my.sharepoint.com/personal/francis_tadena_qualfon_com/SiteAssets/SitePages/KPI-Creation-Process-&-Guidelines/FD-06-Fixed-Asset-Policy-v4_e-signed.pdf';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = 'FD-06_Fixed_Asset_Policy.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center flex-1">
        <div className="relative w-full max-w-md" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => searchQuery.trim() && setShowDropdown(true)}
              placeholder="Search for procedures, forms, or codes..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-700"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {/* Dropdown Results */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute top-full mt-1 w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50 animate-fadeIn">
              <div className="py-2 max-h-96 overflow-y-auto">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-medium text-slate-500">
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                
                {searchResults.map((result, index) => (
                  <button
                    key={`${result.pageId}-${index}`}
                    onClick={() => handleResultClick(result.pageId)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 group"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                          <span className="font-medium">{result.pageTitle}</span>
                          <ChevronRight size={12} />
                          <span>{result.sectionTitle}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-800 group-hover:text-blue-600">
                          {result.preview}
                        </p>
                      </div>
                      <Search size={16} className="text-slate-300 group-hover:text-blue-500 flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
              
              {searchResults.length === 8 && (
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
                  <p className="text-xs text-slate-500 text-center">
                    Type more to refine search results
                  </p>
                </div>
              )}
            </div>
          )}

          {/* No Results Found */}
          {showDropdown && searchQuery.trim() && searchResults.length === 0 && !isSearching && (
            <div className="absolute top-full mt-1 w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
              <div className="p-4 text-center">
                <Search size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-600 font-medium">No results found for</p>
                <p className="text-sm text-slate-800 font-bold mt-1">"{searchQuery}"</p>
                <p className="text-xs text-slate-500 mt-2">Try different keywords</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative" title="Notifications">
          <Bell size={20} />
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        <div className="h-8 w-px bg-slate-200 mx-2"></div>

        <button
          onClick={handleDownload}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <Download size={16} />
          <span>Download Policy PDF</span>
        </button>
      </div>
    </header>
  );
};

export default Header;