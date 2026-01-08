
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { seedDatabase } from '../lib/seed';
import { 
  FileText, ArrowRight, Download, FolderOpen, X, 
  FileSpreadsheet, Search, Database, Loader2, Plus, 
  Trash2, Edit2, Save, ChevronLeft, AlertTriangle, GripVertical, 
  HelpCircle, Settings as SettingsIcon, Link as LinkIcon, 
  ExternalLink, ChevronDown, ChevronUp, Clock, History,
  User as UserIcon, Filter, FileUp, RefreshCw
} from 'lucide-react';
import { getIcon, iconMap } from '../lib/iconMap';
import { useAuth } from '../contexts/AuthContext';
import TutorialOverlay from '../components/TutorialOverlay';
import FormsLibrary from '../components/FormsLibrary';

interface HeaderConfig {
  title: string;
  description: string;
  buttons: {
    label: string;
    url: string;
    type: 'link' | 'download' | 'action';
    icon_name: string;
  }[];
}

interface FormItem {
  id: string;
  title: string;
  url: string;
  description: string;
  category: string;
  sort_order: number;
}

interface FormCategory {
  id?: string;
  title: string;
  sort_order: number;
}

interface PageItem {
  id: string;
  title: string;
  summary: string;
  icon_name: string;
  category: string;
  parent_page_id: string | null;
}

interface RecentEdit {
  id: string;
  page_id: string;
  user_name: string;
  action: string;
  created_at: string;
  wiki_pages: {
    title: string;
    icon_name: string;
  };
}

const Dashboard: React.FC = () => {
  const { adminMode } = useAuth();
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [showAllTopics, setShowAllTopics] = useState(false);
  const formsLibraryRef = useRef<HTMLDivElement>(null);
  
  // Header Config State
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>({
    title: "CDO Facilities, Physical Security, HSE Wiki",
    description: "Welcome to the centralized knowledge base for Fixed Asset Policies (FD-06).",
    buttons: []
  });
  
  // Data State
  const [forms, setForms] = useState<FormItem[]>([]);
  const [formCategories, setFormCategories] = useState<FormCategory[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [recentEdits, setRecentEdits] = useState<RecentEdit[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    fetchHeaderConfig();
    fetchRecentEdits();
  }, []);

  const fetchHeaderConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('dashboard_settings')
        .select('content')
        .eq('key', 'welcome_section')
        .single();
      
      if (data && !error) {
        setHeaderConfig(data.content as HeaderConfig);
      }
    } catch (err) {
      console.error("Error fetching header config", err);
    }
  };

  const fetchRecentEdits = async () => {
    try {
      const { data } = await supabase
        .from('wiki_edit_history')
        .select(`
          id,
          page_id,
          user_name,
          action,
          created_at,
          wiki_pages (
            title,
            icon_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(8);
      
      if (data) setRecentEdits(data as any);
    } catch (err) {
      console.error("Error fetching recent edits", err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
        const [formsRes, catsRes, pagesRes] = await Promise.all([
            supabase.from('forms').select('*').order('sort_order', { ascending: true }),
            supabase.from('form_categories').select('*').order('sort_order', { ascending: true }),
            supabase.from('wiki_pages').select('*').order('sort_order')
        ]);

        if (formsRes.error) throw formsRes.error;

        const fetchedForms = (formsRes.data || []) as FormItem[];
        const fetchedCats = (catsRes.data || []) as FormCategory[];
        
        const existingCatTitles = new Set(fetchedCats.map(c => c.title));
        const usedCategories = Array.from(new Set(fetchedForms.map(f => f.category)));
        
        const newCatsToCreate: FormCategory[] = [];
        usedCategories.forEach((catTitle, idx) => {
            if (catTitle && !existingCatTitles.has(catTitle)) {
                newCatsToCreate.push({ title: catTitle, sort_order: fetchedCats.length + idx });
            }
        });

        let finalCategories = [...fetchedCats];

        if (newCatsToCreate.length > 0) {
           await supabase.from('form_categories').insert(newCatsToCreate);
           finalCategories = [...finalCategories, ...newCatsToCreate];
        }

        setForms(fetchedForms);
        setFormCategories(finalCategories.sort((a, b) => a.sort_order - b.sort_order));
        if (pagesRes.data) setPages(pagesRes.data as PageItem[]);

    } catch (err: any) {
        console.error("Error fetching dashboard data", err);
        setError(err.message || "Failed to connect to the database. Your session may have expired.");
    } finally {
        setLoading(false);
    }
  };

  const handleSeed = async () => {
    if (!confirm("This will populate your database with the default content. Continue?")) return;
    setSeeding(true);
    await seedDatabase();
    await fetchData();
    fetchRecentEdits();
    setSeeding(false);
  };

  const scrollToForms = () => {
    formsLibraryRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
        <p className="font-medium animate-pulse">Syncing with secure server...</p>
      </div>
    );
  }

  if (error && pages.length === 0) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl text-center animate-slideUp">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Connection Problem</h2>
        <p className="text-slate-500 mb-8 leading-relaxed">{error}</p>
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <RefreshCw size={20} /> Refresh Session
          </button>
          <button 
            onClick={() => navigate('/auth')} 
            className="w-full py-4 text-slate-400 font-bold hover:text-slate-600"
          >
            Re-authenticate
          </button>
        </div>
      </div>
    );
  }

  const rootPages = pages.filter(p => !p.parent_page_id);
  const visibleRootPages = showAllTopics ? rootPages : rootPages.slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      {isTutorialOpen && <TutorialOverlay onClose={() => setIsTutorialOpen(false)} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* MAIN CONTENT AREA */}
        <main className="lg:col-span-9 space-y-12 order-1">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden group/header">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{headerConfig.title}</h1>
              </div>
              <p className="text-blue-100 max-w-2xl mb-6">{headerConfig.description}</p>
              <div className="flex flex-wrap gap-3">
                {headerConfig.buttons.map((btn, idx) => {
                  const Icon = getIcon(btn.icon_name);
                  return (
                    <button 
                      key={idx} 
                      onClick={() => {
                        if (btn.type === 'action') {
                          if (btn.url === 'tutorial') setIsTutorialOpen(true);
                          else if (btn.url === 'forms') scrollToForms();
                        } else {
                          window.open(btn.url, '_blank');
                        }
                      }} 
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all shadow-md active:scale-95 ${btn.type === 'download' ? "bg-white text-blue-900 hover:bg-blue-50" : "bg-blue-500/20 border border-blue-400/50 text-white hover:bg-blue-500/30"}`}
                    >
                      <Icon size={18} /> {btn.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-12 translate-y-12"><FileText size={200} /></div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Browse Topics</h2>
              <button 
                onClick={() => setShowAllTopics(!showAllTopics)}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                {showAllTopics ? 'Show Less' : `View All (${rootPages.length})`}
              </button>
            </div>
            
            {rootPages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleRootPages.map((page) => {
                  const Icon = getIcon(page.icon_name);
                  return (
                    <Link key={page.id} to={`/policy/${page.id}`} className="group bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                      <div className="flex items-start justify-between">
                        <div className="bg-slate-50 text-slate-600 p-3 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 border border-slate-100"><Icon size={24} /></div>
                        <ArrowRight size={20} className="text-slate-300 group-hover:text-blue-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800 mt-4 group-hover:text-blue-700">{page.title}</h3>
                      <p className="text-sm text-slate-500 mt-2 line-clamp-2">{page.summary}</p>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <Database className="mx-auto text-slate-200 mb-4" size={48} />
                <p className="text-slate-500 font-bold mb-4">The knowledge base is currently empty.</p>
                {adminMode && (
                  <button onClick={handleSeed} disabled={seeding} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 mx-auto">
                    {seeding ? <Loader2 className="animate-spin" /> : <Database />} Initialize Data
                  </button>
                )}
              </div>
            )}
          </div>

          <hr className="border-slate-200" />

          {/* FORMS LIBRARY SECTION */}
          <div ref={formsLibraryRef}>
            <FormsLibrary 
              forms={forms} 
              categories={formCategories} 
              onRefresh={fetchData} 
            />
          </div>

        </main>

        {/* SIDEBAR ACTIVITY */}
        <aside className="lg:col-span-3 space-y-6 order-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-fit sticky top-24">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><History size={18} className="text-blue-600" /> Recent Activity</h3>
            </div>
            <div className="p-2">
              {recentEdits.length > 0 ? recentEdits.map((edit) => {
                const PageIcon = getIcon(edit.wiki_pages?.icon_name);
                return (
                  <Link key={edit.id} to={`/policy/${edit.page_id}`} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 group">
                    <div className="bg-slate-100 text-slate-500 p-2 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 shrink-0"><PageIcon size={16} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{edit.wiki_pages?.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{edit.action} by <span className="font-semibold">{edit.user_name}</span></p>
                    </div>
                  </Link>
                );
              }) : (
                <div className="p-4 text-center">
                  <p className="text-[10px] text-slate-400 italic">No recent edits recorded.</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
