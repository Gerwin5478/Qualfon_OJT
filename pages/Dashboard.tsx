
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
  User as UserIcon, Filter, FileUp, RefreshCw, Type, Settings
} from 'lucide-react';
import { getIcon, iconMap } from '../lib/iconMap';
import { useAuth } from '../contexts/AuthContext';
import TutorialOverlay from '../components/TutorialOverlay';
import FormsLibrary from '../components/FormsLibrary';

interface HeaderButton {
  label: string;
  url: string;
  type: 'link' | 'download' | 'action';
  icon_name: string;
}

interface HeaderConfig {
  title: string;
  description: string;
  buttons: HeaderButton[];
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
  const [isHeaderEditOpen, setIsHeaderEditOpen] = useState(false);
  const [showAllTopics, setShowAllTopics] = useState(false);
  const formsLibraryRef = useRef<HTMLDivElement>(null);
  
  // Header Config State
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>({
    title: "CDO Facilities, Physical Security, HSE Wiki",
    description: "Welcome to the centralized knowledge base for Fixed Asset Policies (FD-06).",
    buttons: []
  });
  
  const [tempHeaderConfig, setTempHeaderConfig] = useState<HeaderConfig>(headerConfig);
  
  // Data State
  const [forms, setForms] = useState<FormItem[]>([]);
  const [formCategories, setFormCategories] = useState<FormCategory[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [recentEdits, setRecentEdits] = useState<RecentEdit[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [savingHeader, setSavingHeader] = useState(false);
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
        setTempHeaderConfig(data.content as HeaderConfig);
      }
    } catch (err) {
      console.error("Error fetching header config", err);
    }
  };

  const saveHeaderConfig = async () => {
    setSavingHeader(true);
    try {
      const { error } = await supabase
        .from('dashboard_settings')
        .upsert({ 
          key: 'welcome_section', 
          content: tempHeaderConfig 
        }, { onConflict: 'key' });
      
      if (error) throw error;
      
      setHeaderConfig(tempHeaderConfig);
      setIsHeaderEditOpen(false);
    } catch (err: any) {
      alert("Failed to save header configuration: " + err.message);
    } finally {
      setSavingHeader(false);
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

  const addButton = () => {
    const newBtn: HeaderButton = { label: 'New Button', url: '', type: 'link', icon_name: 'Link' };
    setTempHeaderConfig({ ...tempHeaderConfig, buttons: [...tempHeaderConfig.buttons, newBtn] });
  };

  const removeButton = (index: number) => {
    const newBtns = tempHeaderConfig.buttons.filter((_, i) => i !== index);
    setTempHeaderConfig({ ...tempHeaderConfig, buttons: newBtns });
  };

  const updateButton = (index: number, field: keyof HeaderButton, value: string) => {
    const newBtns = [...tempHeaderConfig.buttons];
    newBtns[index] = { ...newBtns[index], [field]: value };
    setTempHeaderConfig({ ...tempHeaderConfig, buttons: newBtns });
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
            {adminMode && (
              <button 
                onClick={() => { setTempHeaderConfig(headerConfig); setIsHeaderEditOpen(true); }}
                className="absolute top-4 right-4 z-20 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white border border-white/20 flex items-center gap-2 text-xs font-bold transition-all"
              >
                <Settings size={14} /> Edit Header
              </button>
            )}
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

      {/* HEADER EDIT MODAL */}
      {isHeaderEditOpen && (
        <div className="fixed inset-0 z-[250] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-slideUp border border-slate-100">
            <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-2xl">
                  <Settings size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Header Configuration</h3>
                  <p className="text-xs text-slate-500 font-medium">Modify the welcome section layout and buttons</p>
                </div>
              </div>
              <button onClick={() => setIsHeaderEditOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-8">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Wiki Title</label>
                  <input 
                    type="text" 
                    value={tempHeaderConfig.title}
                    onChange={(e) => setTempHeaderConfig({...tempHeaderConfig, title: e.target.value})}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Welcome Message</label>
                  <textarea 
                    rows={3}
                    value={tempHeaderConfig.description}
                    onChange={(e) => setTempHeaderConfig({...tempHeaderConfig, description: e.target.value})}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-sm leading-relaxed focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {/* Button Manager */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quick Action Buttons</label>
                  <button 
                    onClick={addButton}
                    className="text-[10px] font-black text-blue-600 flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
                  >
                    <Plus size={12} /> Add Button
                  </button>
                </div>

                <div className="space-y-3">
                  {tempHeaderConfig.buttons.map((btn, idx) => (
                    <div key={idx} className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4 relative group">
                      <button 
                        onClick={() => removeButton(idx)}
                        className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Label</label>
                          <input 
                            type="text" 
                            value={btn.label}
                            onChange={(e) => updateButton(idx, 'label', e.target.value)}
                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Action/URL</label>
                          <select 
                            value={btn.url}
                            onChange={(e) => updateButton(idx, 'url', e.target.value)}
                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Action...</option>
                            <option value="tutorial">Internal: Open Tutorial</option>
                            <option value="forms">Internal: Scroll to Forms</option>
                            <option value="https://qualfon-my.sharepoint.com/...">SharePoint Policy Link</option>
                            {/* Allow custom manual input by making it a combo if needed, but select is cleaner for common actions */}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Icon</label>
                          <div className="flex gap-2">
                             <div className="p-2 bg-white border border-slate-200 rounded-xl text-blue-600">
                               {React.createElement(getIcon(btn.icon_name), { size: 20 })}
                             </div>
                             <select 
                                value={btn.icon_name}
                                onChange={(e) => updateButton(idx, 'icon_name', e.target.value)}
                                className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {Object.keys(iconMap).map(key => (
                                  <option key={key} value={key}>{key}</option>
                                ))}
                              </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Button Theme</label>
                          <select 
                            value={btn.type}
                            onChange={(e) => updateButton(idx, 'type', e.target.value as any)}
                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="link">Secondary (Transparent)</option>
                            <option value="download">Primary (White Bold)</option>
                            <option value="action">System (Outlined)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-8 py-6 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setIsHeaderEditOpen(false)}
                className="px-6 py-2.5 text-slate-500 font-bold text-sm hover:bg-slate-200 rounded-xl transition-colors"
              >
                Discard
              </button>
              <button 
                onClick={saveHeaderConfig}
                disabled={savingHeader}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 flex items-center gap-2 disabled:opacity-50"
              >
                {savingHeader ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Publish Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
