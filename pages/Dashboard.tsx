import React from 'react';
import { Link } from 'react-router-dom';
import { wikiContent } from '../data/wikiContent';
import { FileText, ArrowRight, AlertTriangle, CheckCircle, Download } from 'lucide-react';

const Dashboard: React.FC = () => {
  const handleDownload = () => {
    alert("Downloading 'FD-06 Fixed Asset Policy.pdf'...");
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

      {/* Quick Stats / Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-700">Capitalization Threshold</h3>
                    <div className="bg-green-100 text-green-700 p-2 rounded-lg">
                        <CheckCircle size={20} />
                    </div>
                </div>
                <p className="text-3xl font-bold text-slate-900">₱50,000</p>
                <p className="text-sm text-slate-500 mt-1">or $1,500 USD per item</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400">IT Equipment is capitalized regardless of cost.</p>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
             <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-700">Physical Count Cycle</h3>
                    <div className="bg-orange-100 text-orange-700 p-2 rounded-lg">
                        <AlertTriangle size={20} />
                    </div>
                </div>
                <p className="text-3xl font-bold text-slate-900">Annually</p>
                <p className="text-sm text-slate-500 mt-1">Minimum requirement</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
                <Link to="/policy/monitoring" className="text-xs text-blue-600 font-medium hover:underline">View count procedures &rarr;</Link>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-700">Reporting Deadline</h3>
                    <div className="bg-blue-100 text-blue-700 p-2 rounded-lg">
                        <FileText size={20} />
                    </div>
                </div>
                <p className="text-3xl font-bold text-slate-900">25th</p>
                <p className="text-sm text-slate-500 mt-1">of every month</p>
            </div>
             <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400">Facilities listing reconciliation with Finance.</p>
            </div>
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
      
      {/* Footer Disclaimer */}
      <div className="text-center pt-8 pb-4">
          <p className="text-xs text-slate-400">
              Based on QUALFON Standard Operating Policies & Procedures | Document No. FD-06 | Version 004
          </p>
      </div>
    </div>
  );
};

export default Dashboard;