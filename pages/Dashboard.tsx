import React from 'react';
import { Link } from 'react-router-dom';
import { wikiContent } from '../data/wikiContent';
import { FileText, ArrowRight, AlertTriangle, CheckCircle, Download } from 'lucide-react';

const Dashboard: React.FC = () => {
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
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Facilities & Security Asset Portal</h1>
          <p className="text-blue-100 max-w-2xl mb-6">
            Welcome to the centralized knowledge base for Fixed Asset Policies (FD-06). 
            Access guidelines on how assets are properly received, used, tagged, stored, transferred, and disposed.
          </p>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 bg-white text-blue-900 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-md active:scale-95"
            >
              <Download size={18} />
              Download PDF Policy
            </button>
            <Link 
              to="/policy/tagging"
              className="flex items-center gap-2 bg-blue-600 border border-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-500 transition-colors shadow-md active:scale-95"
            >
              View Receiving & Tagging Steps
            </Link>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-12 translate-y-12">
          <FileText size={200} />
        </div>
      </div>

      {/* Topics Grid */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4">Browse Topics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wikiContent.map((page) => {
            const Icon = page.icon;
            return (
              <Link
                key={page.id}
                to={`/policy/${page.id}`}
                className="group bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
              >
                <div className="flex items-start justify-between">
                  <div className="bg-slate-50 text-slate-600 p-3 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Icon size={24} />
                  </div>
                  <ArrowRight size={20} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mt-4 group-hover:text-blue-700">
                  {page.title}
                </h3>
                <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                  {page.summary}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="text-center pt-8 pb-4">
        <p className="text-xs text-slate-400">
          Based on QUALFON Standard Operating Policies & Procedures | Document No. FD-06 | Version 004
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
