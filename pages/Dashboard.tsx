
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { seedDatabase } from '../lib/seed';
import { 
  FileText, ArrowRight, Download, FolderOpen, X, 
  FileSpreadsheet, Search, Database, Loader2, Plus, 
  Trash2, Save, ChevronLeft, AlertTriangle, GripVertical, 
  HelpCircle, Settings as SettingsIcon, Link as LinkIcon, 
  ExternalLink, ChevronDown, ChevronUp, Clock, History,
  User as UserIcon
} from 'lucide-react';
import { getIcon, iconMap } from '../lib/iconMap';
import { useAuth } from '../contexts/AuthContext';
import TutorialOverlay from '../components/TutorialOverlay';

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

type DragType = 'CATEGORY' | 'FORM';

const Dashboard: React.FC = () => {
  const { adminMode } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [formSearchQuery, setFormSearchQuery] = useState('');
  const [showAllTopics, setShowAllTopics] = useState(false);
  
  // Header Config State
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>({
    title: "Facilities & Security Wiki",
    description: "Welcome to the centralized knowledge base for Fixed Asset Policies (FD-06).",
    buttons: []
  });
  const [isEditHeaderOpen, setIsEditHeaderOpen] = useState(false);
  const [isSavingHeader, setIsSavingHeader] = useState(false);
  
  // Data State
  const [forms, setForms] = useState<FormItem[]>([]);
  const [formCategories, setFormCategories] = useState<FormCategory[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [recentEdits, setRecentEdits] = useState<RecentEdit[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  
  // Form Add/Edit State
  const [formView, setFormView] = useState<'list' | 'add'>('list');
  const [newForm, setNewForm] = useState({
    title: '',
    url: '',
    description: '',
    category: ''
  });

  // Drag State
  const [draggingItem, setDraggingItem] = useState<{ type: DragType; id: string; category?: string; index?: number } | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'form' | 'category';
    id: string;
    title: string;
  } | null>(null);

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
    try {
        const [formsRes, catsRes, pagesRes] = await Promise.all([
            supabase.from('forms').select('*').order('sort_order', { ascending: true }),
            supabase.from('form_categories').select('*').order('sort_order', { ascending: true }),
            supabase.from('wiki_pages').select('*').order('sort_order')
        ]);

        const fetchedForms = (formsRes.data || []) as FormItem[];
        const fetchedCats = (catsRes.data || []) as FormCategory[];
        
        const existingCatTitles = new Set(fetchedCats.map(c => c.title));
        const usedCategories = Array.from(new Set(fetchedForms.map(f => f.category)));
        
        const newCatsToCreate: FormCategory[] = [];
        usedCategories.forEach((catTitle, idx) => {
            if (!existingCatTitles.has(catTitle)) {
                newCatsToCreate.push({ title: catTitle, sort_order: fetchedCats.length + idx });
            }
        });

        let finalCategories = [...fetchedCats, ...newCatsToCreate];

        if (newCatsToCreate.length > 0) {
           await supabase.from('form_categories').insert(newCatsToCreate);
        }

        setForms(fetchedForms);
        setFormCategories(finalCategories.sort((a, b) => a.sort_order - b.sort_order));
        if (pagesRes.data) setPages(pagesRes.data as PageItem[]);

    } catch (err) {
        console.error("Error fetching dashboard data", err);
    } finally {
        setLoading(false);
    }
  };

  const handleSaveHeader = async () => {
    setIsSavingHeader(true);
    try {
      const { error } = await supabase
        .from('dashboard_settings')
        .update({ content: headerConfig })
        .eq('key', 'welcome_section');
      
      if (error) throw error;
      setIsEditHeaderOpen(false);
    } catch (err: any) {
      alert("Error saving header: " + err.message);
    } finally {
      setIsSavingHeader(false);
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

  const handleHeaderButtonClick = (btn: HeaderConfig['buttons'][0]) => {
    if (btn.type === 'action') {
      if (btn.url === 'tutorial') setIsTutorialOpen(true);
      if (btn.url === 'forms') setIsModalOpen(true);
    } else {
      window.open(btn.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDeleteCategoryClick = (categoryTitle: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirmation({
        isOpen: true,
        type: 'category',
        id: categoryTitle,
        title: categoryTitle
    });
  };

  const handleDeleteFormClick = (id: string, title: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirmation({
        isOpen: true,
        type: 'form',
        id: id,
        title: title
    });
  };

  const executeDelete = async () => {
      if (!deleteConfirmation) return;
      const { type, title, id } = deleteConfirmation;

      if (type === 'category') {
        setFormCategories(prev => prev.filter(c => c.title !== title));
        setForms(prev => prev.filter(f => f.category !== title));
        try {
            await supabase.from('forms').delete().eq('category', title);
            await supabase.from('form_categories').delete().eq('title', title);
        } catch (error: any) {
            alert("Error deleting category: " + error.message);
            fetchData();
        }
      } else if (type === 'form') {
        setForms(prev => prev.filter(f => f.id !== id));
        const { error } = await supabase.from('forms').delete().eq('id', id);
        if (error) {
            alert("Error deleting form: " + error.message);
            fetchData();
        }
      }
      setDeleteConfirmation(null);
  };

  const handleAddForm = async () => {
    if (!newForm.title || !newForm.url || !newForm.category) {
        alert("Please fill in Title, URL, and Category");
        return;
    }
    const catForms = forms.filter(f => f.category === newForm.category);
    const maxSort = catForms.length > 0 ? Math.max(...catForms.map(f => f.sort_order)) : 0;
    const payload = { ...newForm, sort_order: maxSort + 1 };
    const { error } = await supabase.from('forms').insert(payload);
    if (error) {
        alert("Error adding form: " + error.message);
    } else {
        setFormView('list');
        setNewForm({ title: '', url: '', description: '', category: '' });
        fetchData();
    }
  };

  const onDragStart = (e: React.DragEvent, type: DragType, id: string, category?: string, index?: number) => {
    e.stopPropagation();
    setDraggingItem({ type, id, category, index });
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent, category: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (adminMode) {
        setDragOverCategory(category);
        e.dataTransfer.dropEffect = 'move';
    }
  };

  const onDropForm = async (e: React.DragEvent, targetCategory: string, targetIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCategory(null);
    if (!draggingItem || draggingItem.type !== 'FORM') return;
    const currentForms = [...forms];
    const draggedItemIndex = currentForms.findIndex(f => f.id === draggingItem.id);
    if (draggedItemIndex === -1) return;
    const draggedForm = { ...currentForms[draggedItemIndex] };
    const formsWithoutDragged = currentForms.filter(f => f.id !== draggingItem.id);
    draggedForm.category = targetCategory;
    const targetCategoryForms = formsWithoutDragged.filter(f => f.category === targetCategory);
    let insertAt = targetCategoryForms.length;
    if (typeof targetIndex === 'number') insertAt = targetIndex;
    targetCategoryForms.splice(insertAt, 0, draggedForm);
    const updatedCategoryForms = targetCategoryForms.map((f, idx) => ({ ...f, sort_order: idx }));
    const otherCategoryForms = formsWithoutDragged.filter(f => f.category !== targetCategory);
    setForms([...otherCategoryForms, ...updatedCategoryForms]);
    setDraggingItem(null);
    await supabase.from('forms').upsert(updatedCategoryForms);
  };

  const onDropCategory = async (e: React.DragEvent, targetCatTitle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCategory(null);
    if (!draggingItem || draggingItem.type !== 'CATEGORY') return;
    const fromIndex = formCategories.findIndex(c => c.title === draggingItem.id);
    const toIndex = formCategories.findIndex(c => c.title === targetCatTitle);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;
    const newCats = [...formCategories];
    const [moved] = newCats.splice(fromIndex, 1);
    newCats.splice(toIndex, 0, moved);
    const updatedCats = newCats.map((c, i) => ({ ...c, sort_order: i }));
    setFormCategories(updatedCats);
    setDraggingItem(null);
    await supabase.from('form_categories').upsert(updatedCats, { onConflict: 'title' });
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  const rootPages = pages.filter(p => !p.parent_page_id);
  const visibleRootPages = showAllTopics ? rootPages : rootPages.slice(0, 6);
  const categoryOptions = formCategories.map(c => c.title);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      {isTutorialOpen && <TutorialOverlay onClose={() => setIsTutorialOpen(false)} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* MAIN CONTENT AREA */}
        <main className="lg:col-span-9 space-y-8 order-1">
          
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden group/header">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{headerConfig.title}</h1>
                {adminMode && (
                  <button 
                    onClick={() => setIsEditHeaderOpen(true)}
                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors opacity-0 group-hover/header:opacity-100"
                    title="Edit Header"
                  >
                    <SettingsIcon size={18} />
                  </button>
                )}
              </div>
              <p className="text-blue-100 max-w-2xl mb-6">
                {headerConfig.description}
              </p>
              <div className="flex flex-wrap gap-3">
                {headerConfig.buttons.map((btn, idx) => {
                  const Icon = getIcon(btn.icon_name);
                  const isDownload = btn.type === 'download';
                  return (
                    <button 
                      key={idx}
                      onClick={() => handleHeaderButtonClick(btn)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all shadow-md active:scale-95 ${
                        isDownload 
                        ? "bg-white text-blue-900 hover:bg-blue-50" 
                        : "bg-blue-500/20 border border-blue-400/50 text-white hover:bg-blue-500/30"
                      }`}
                    >
                      <Icon size={18} />
                      {btn.label}
                    </button>
                  );
                })}
                
                {(forms.length === 0 && !loading) && (
                  <button 
                    onClick={handleSeed}
                    disabled={seeding}
                    className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-amber-600 transition-colors shadow-md active:scale-95 ml-auto"
                  >
                    {seeding ? <Loader2 className="animate-spin" size={18} /> : <Database size={18} />}
                    Initialize Database
                  </button>
                )}
              </div>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-12 translate-y-12">
              <FileText size={200} />
            </div>
          </div>

          {/* Topics Grid */}
          {loading ? (
            <div className="text-center py-20 text-slate-400">
              <Loader2 size={40} className="animate-spin mx-auto mb-4" />
              <p>Loading content...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Browse Topics</h2>
                <span className="text-xs font-medium text-slate-400">Showing {visibleRootPages.length} of {rootPages.length} categories</span>
              </div>
              
              {rootPages.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                    {visibleRootPages.map((page) => {
                      const Icon = getIcon(page.icon_name);
                      return (
                        <Link
                          key={page.id}
                          to={`/policy/${page.id}`}
                          className="group bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
                        >
                          <div className="flex items-start justify-between">
                            <div className="bg-slate-50 text-slate-600 p-3 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors border border-slate-100">
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

                  {rootPages.length > 6 && (
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={() => setShowAllTopics(!showAllTopics)}
                        className="flex items-center gap-2 px-8 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-95 group"
                      >
                        {showAllTopics ? (
                          <>
                            <ChevronUp size={20} className="group-hover:-translate-y-0.5 transition-transform" />
                            See Less
                          </>
                        ) : (
                          <>
                            <ChevronDown size={20} className="group-hover:translate-y-0.5 transition-transform" />
                            See {rootPages.length - 6} more topics
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                  <p className="text-slate-400 mb-2">No topics found.</p>
                  <p className="text-sm text-slate-500">Please click "Initialize Database" above to load content.</p>
                </div>
              )}
            </div>
          )}

          <div className="text-center pt-8 pb-4">
            <p className="text-xs text-slate-400">
              Based on QUALFON Standard Operating Policies & Procedures | Document No. FD-06 | Version 004
            </p>
          </div>
        </main>

        {/* RECENT ACTIVITY SIDEBAR */}
        <aside className="lg:col-span-3 space-y-6 animate-fadeIn order-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-fit">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <History size={18} className="text-blue-600" /> Recent Activity
              </h3>
            </div>
            
            <div className="p-2">
              {recentEdits.length > 0 ? (
                <div className="space-y-1">
                  {recentEdits.map((edit) => {
                    const PageIcon = getIcon(edit.wiki_pages?.icon_name);
                    return (
                      <Link
                        key={edit.id}
                        to={`/policy/${edit.page_id}`}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className="bg-slate-100 text-slate-500 p-2 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                          <PageIcon size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {edit.wiki_pages?.title}
                          </p>
                          <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                            {edit.action} by <span className="font-semibold text-slate-700">{edit.user_name}</span>
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-[9px] font-medium text-slate-400">
                            <Clock size={10} />
                            {getTimeAgo(edit.created_at)}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 px-4 text-center">
                  <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <History size={20} className="text-slate-300" />
                  </div>
                  <p className="text-xs text-slate-400 font-medium">No activity recorded yet.</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-50 bg-slate-50/50">
              <Link to="/" className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest block text-center">
                System Log Complete
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white shadow-lg">
             <div className="flex items-center gap-3 mb-3">
                <div className="bg-white/20 p-2 rounded-lg">
                   <HelpCircle size={18} />
                </div>
                <h4 className="font-bold text-sm">Need Assistance?</h4>
             </div>
             <p className="text-[11px] text-blue-100 leading-relaxed mb-4">
                Can't find a specific form or policy? Use the AI Assistant on the bottom right for instant support.
             </p>
             <button 
               onClick={() => setIsTutorialOpen(true)}
               className="w-full bg-white text-blue-700 py-2 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors"
             >
                Launch Tutorial
             </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
