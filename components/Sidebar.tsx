import React from 'react';
import { NavLink } from 'react-router-dom';
import { wikiContent } from '../data/wikiContent';
import { LayoutDashboard } from 'lucide-react';

const Sidebar: React.FC = () => {
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
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive
                ? 'bg-blue-600 text-white shadow-md'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`
          }
        >
          <LayoutDashboard size={20} />
          <span className="font-medium">Dashboard</span>
        </NavLink>

        <div className="pt-4 pb-2 px-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Procedures
          </p>
        </div>

        {wikiContent.map((page) => {
          const Icon = page.icon;
          return (
            <NavLink
              key={page.id}
              to={`/policy/${page.id}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors mb-1 ${
                  isActive
                    ? 'bg-slate-800 text-white border-l-4 border-blue-500'
                    : 'hover:bg-slate-800/50 text-slate-400 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{page.title}</span>
            </NavLink>
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