import React from 'react';
import { Download, Search, Bell } from 'lucide-react';

const Header: React.FC = () => {
  const handleDownload = () => {
    // In a real app, this would be a link to the actual PDF blob or URL
    // Since we don't have the file hosting, we simulate the action.
    alert("Downloading 'FD-06 Fixed Asset Policy.pdf'...");
    
    // Simulating a download for the user to see the interaction
    const link = document.createElement('a');
    link.href = '#'; // Placeholder
    link.download = 'FD-06_Fixed_Asset_Policy.pdf';
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20 shadow-sm">
      <div className="flex items-center flex-1">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search for procedures, forms, or codes..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-700"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative"
            title="Notifications"
        >
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