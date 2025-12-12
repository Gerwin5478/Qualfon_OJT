import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { wikiContent } from '../data/wikiContent';
import { LayoutDashboard, ChevronDown, ChevronRight } from 'lucide-react';

const Sidebar: React.FC = () => {
  const location = useLocation();
  // Extract unique categories from content, defaulting to 'Procedures'
  const categories = Array.from(new Set(wikiContent.map(p => p.category || 'Procedures')));
  
  // State to track expanded categories
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Helper to get pages for a category
  const getPagesByCategory = (cat: string) => wikiContent.filter(p => (p.category || 'Procedures') === cat);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Auto-expand category based on active route
  useEffect(() => {
    const currentPathId = location.pathname.split('/').pop();
    if (currentPathId) {
      const activePage = wikiContent.find(p => p.id === currentPathId);
      if (activePage) {
        const category = activePage.category || 'Procedures';
        setExpandedCategories(prev => ({
          ...prev,
          [category]: true
        }));
      }
    }
  }, [location.pathname]);

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto border-r border-slate-800 z-10 shadow-xl">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm">FA</span>
          Asset Wiki
        </h1>
        <p className="text-xs text-slate-500 mt-2">Facilities & Security Dept.</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-4 ${
              isActive
                ? 'bg-blue-600 text-white shadow-md'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`
          }
        >
          <LayoutDashboard size={20} />
          <span className="font-medium">Dashboard</span>
        </NavLink>

        {categories.map((category) => {
          const isOpen = expandedCategories[category];
          const pages = getPagesByCategory(category);
          const rootPages = pages.filter(p => !p.parentPageId);

          return (
            <div key={category} className="mb-2">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center gap-2 px-4 py-2 mb-1 text-xs font-bold text-slate-500 uppercase tracking-wider hover:bg-slate-800/50 hover:text-slate-200 transition-colors rounded-lg focus:outline-none"
              >
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span className="text-left">{category}</span>
              </button>

              {isOpen && (
                <div className="space-y-1 ml-2 border-l border-slate-700 pl-2 animate-fadeIn">
                  {rootPages.map((page) => {
                    const Icon = page.icon;
                    const children = pages.filter(p => p.parentPageId === page.id);
                    
                    return (
                      <div key={page.id}>
                        <NavLink
                          to={`/policy/${page.id}`}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                              isActive
                                ? 'bg-slate-800 text-white border-l-4 border-blue-500'
                                : 'hover:bg-slate-800/50 text-slate-400 hover:text-white'
                            }`
                          }
                        >
                          <Icon size={18} />
                          <span className="text-sm font-medium">{page.title}</span>
                        </NavLink>
                        
                        {/* Nested Children */}
                        {children.length > 0 && (
                          <div className="ml-4 mt-1 border-l border-slate-700 pl-2 space-y-1">
                            {children.map(child => {
                               const ChildIcon = child.icon;
                               return (
                                 <NavLink
                                   key={child.id}
                                   to={`/policy/${child.id}`}
                                   className={({ isActive }) =>
                                     `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                                       isActive
                                         ? 'bg-slate-800 text-white border-l-4 border-blue-500'
                                         : 'hover:bg-slate-800/50 text-slate-400 hover:text-white'
                                     }`
                                   }
                                 >
                                   <ChildIcon size={16} />
                                   <span className="text-xs font-medium">{child.title}</span>
                                 </NavLink>
                               )
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Need Help?</p>
          <p className="text-xs text-slate-500">Contact Finance Dept at local 204 or Facilities at 205.</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;