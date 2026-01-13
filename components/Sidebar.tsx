
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, ChevronDown, ChevronRight, Loader2, Plus, Trash2, Edit2, Settings, Save, X, ToggleLeft, ToggleRight, GripVertical, AlertTriangle, Users, Lock, Sparkles, FileText, Link as LinkIcon, CheckCircle2, HelpCircle } from 'lucide-react';
import { getIcon, iconMap } from '../lib/iconMap';
import { useAuth } from '../contexts/AuthContext';
import AIContentGenerator from './AIContentGenerator';
import TutorialOverlay from './TutorialOverlay';

interface WikiPageSimple {
  id: string;
  title: string;
  category: string;
  parent_page_id: string | null;
  icon_name: string;
  sort_order: number;
  based_on_policy_title?: string;
  based_on_policy_url?: string;
}

interface WikiCategory {
  id?: string;
  title: string;
  sort_order: number;
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, adminMode, toggleAdminMode } = useAuth();
  
  const [pages, setPages] = useState<WikiPageSimple[]>([]);
  const [categoriesData, setCategoriesData] = useState<WikiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'edit-category'>('add');
  const [editingCategoryOldName, setEditingCategoryOldName] = useState<string | null>(null);
  const [isPolicyEnabled, setIsPolicyEnabled] = useState(false);

  // Deletion State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'page' | 'category';
    id: string;
    title: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    category: '',
    parent_page_id: '',
    icon_name: 'FileText',
    summary: '',
    sort_order: 0,
    based_on_policy_title: '',
    based_on_policy_url: ''
  });
  
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedPages, setExpandedPages] = useState<Record<string, boolean>>({});
  
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    fetchData();
    return () => { isMounted.current = false; };
  }, []);

  const fetchData = async () => {
    const loadingTimeout = setTimeout(() => {
      if (isMounted.current) setLoading(false);
    }, 6000);

    try {
        const { data: pagesData, error: pagesError } = await supabase
          .from('wiki_pages')
          .select('*')
          .order('sort_order', { ascending: true });
        
        if (pagesError) throw pagesError;
        if (!isMounted.current) return;

        const fetchedPages = (pagesData || []) as WikiPageSimple[];
        setPages(fetchedPages);

        const { data: catsData, error: catsError } = await supabase
            .from('wiki_categories')
            .select('*')
            .order('sort_order', { ascending: true });

        if (catsError) throw catsError;
        if (!isMounted.current) return;

        const distinctCategoriesFromPages = Array.from<string>(new Set(fetchedPages.map(p => p.category || 'Procedures'))).sort();
        
        let finalCategories: WikiCategory[] = [];
        if (!catsData || catsData.length === 0) {
            finalCategories = distinctCategoriesFromPages.map((c, i) => ({ title: c, sort_order: i }));
        } else {
            finalCategories = [...catsData];
            const dbCatNames = new Set(finalCategories.map(c => c.title));
            distinctCategoriesFromPages.forEach(pageCat => {
                if (!dbCatNames.has(pageCat)) {
                    finalCategories.push({ title: pageCat, sort_order: finalCategories.length + 1 });
                }
            });
        }
        
        setCategoriesData(finalCategories);
        setExpandedCategories(prev => {
          const newState = { ...prev };
          finalCategories.forEach(cat => {
            if (newState[cat.title] === undefined) newState[cat.title] = false;
          });
          return newState;
        });

    } catch (err) {
        console.error("Error fetching sidebar data:", err);
    } finally {
        if (isMounted.current) setLoading(false);
        clearTimeout(loadingTimeout);
    }
  };

  const getPagesByCategory = (cat: string) => pages.filter(p => (p.category || 'Procedures') === cat);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const togglePage = (e: React.MouseEvent, pageId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedPages(prev => ({ ...prev, [pageId]: !prev[pageId] }));
  };

  // --- Drag & Drop Category Logic ---
  const handleDragStartCat = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('type', 'category');
    e.dataTransfer.setData('index', index.toString());
  };

  const handleDropCategory = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (e.dataTransfer.getData('type') !== 'category') return;
    const draggedIndex = parseInt(e.dataTransfer.getData('index'));
    if (isNaN(draggedIndex) || draggedIndex === dropIndex) return;

    const newCategories = [...categoriesData];
    const [movedItem] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(dropIndex, 0, movedItem);

    const updatedCategories = newCategories.map((cat, idx) => ({ ...cat, sort_order: idx }));
    setCategoriesData(updatedCategories);

    const updates = updatedCategories.map(c => ({ title: c.title, sort_order: c.sort_order, id: c.id }));
    await supabase.from('wiki_categories').upsert(updates, { onConflict: 'title' });
  };

  // --- Drag & Drop Page Logic ---
  const handleDragStartPage = (e: React.DragEvent, pageId: string, parentId: string | null, category: string) => {
    e.dataTransfer.setData('type', 'page');
    e.dataTransfer.setData('pageId', pageId);
    e.dataTransfer.setData('parentId', parentId || 'root');
    e.dataTransfer.setData('category', category);
  };

  const handleDropPage = async (e: React.DragEvent, targetPageId: string) => {
    e.preventDefault();
    if (e.dataTransfer.getData('type') !== 'page') return;

    const draggedId = e.dataTransfer.getData('pageId');
    const draggedParentId = e.dataTransfer.getData('parentId') === 'root' ? null : e.dataTransfer.getData('parentId');
    const draggedCategory = e.dataTransfer.getData('category');

    if (draggedId === targetPageId) return;

    // Find siblings to reorder
    const siblings = pages.filter(p => p.category === draggedCategory && p.parent_page_id === draggedParentId);
    const fromIndex = siblings.findIndex(p => p.id === draggedId);
    const toIndex = siblings.findIndex(p => p.id === targetPageId);

    if (fromIndex === -1 || toIndex === -1) return;

    const newSiblings = [...siblings];
    const [movedItem] = newSiblings.splice(fromIndex, 1);
    newSiblings.splice(toIndex, 0, movedItem);

    const updatedSiblings = newSiblings.map((p, idx) => ({ ...p, sort_order: idx }));

    // Optimistic update
    setPages(prev => {
        const others = prev.filter(p => !(p.category === draggedCategory && p.parent_page_id === draggedParentId));
        return [...others, ...updatedSiblings].sort((a, b) => a.sort_order - b.sort_order);
    });

    // DB Update
    const updates = updatedSiblings.map(p => ({ 
        id: p.id, 
        sort_order: p.sort_order,
        title: p.title,
        category: p.category,
        parent_page_id: p.parent_page_id,
        icon_name: p.icon_name
    }));
    await supabase.from('wiki_pages').upsert(updates);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const openAddModal = () => {
    setModalMode('add');
    setIsPolicyEnabled(false);
    const maxSort = pages.length > 0 ? Math.max(...pages.map(p => p.sort_order || 0)) : 0;
    setFormData({
      id: '',
      title: '',
      category: categoriesData[0]?.title || 'General',
      parent_page_id: '',
      icon_name: 'FileText',
      summary: '',
      sort_order: maxSort + 1,
      based_on_policy_title: '',
      based_on_policy_url: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (page: any) => {
    setModalMode('edit');
    setIsPolicyEnabled(!!page.based_on_policy_title);
    setFormData({
      id: page.id,
      title: page.title,
      category: page.category || '',
      parent_page_id: page.parent_page_id || '',
      icon_name: page.icon_name || 'FileText',
      summary: page.summary || '',
      sort_order: page.sort_order || 0,
      based_on_policy_title: page.based_on_policy_title || '',
      based_on_policy_url: page.based_on_policy_url || ''
    });
    setIsModalOpen(true);
  };

  const openEditCategoryModal = (category: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalMode('edit-category');
    setEditingCategoryOldName(category);
    setFormData({ ...formData, category: category });
    setIsModalOpen(true);
  };

  const handleDeleteCategoryClick = (category: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmation({ isOpen: true, type: 'category', id: category, title: category });
  };

  const handleDeletePageClick = (pageId: string, pageTitle: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirmation({ isOpen: true, type: 'page', id: pageId, title: pageTitle });
  };

  const recordDeleteHistory = async (pageId: string, pageTitle: string) => {
    if (!user) return;
    const userName = user.user_metadata?.first_name 
      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`
      : user.email;

    await supabase.from('wiki_edit_history').insert({
      page_id: pageId,
      user_email: user.email,
      user_name: userName,
      action: `Deleted page: "${pageTitle}"`
    });
  };

  const executeDelete = async () => {
    if (!deleteConfirmation) return;
    const { type, id, title } = deleteConfirmation;
    setIsDeleting(true);

    try {
      if (type === 'category') {
          const pagesInCat = getPagesByCategory(id);
          for (const page of pagesInCat) {
              // Record deletion in history instead of deleting it
              await recordDeleteHistory(page.id, page.title);
              await supabase.from('wiki_sections').delete().eq('page_id', page.id);
              await supabase.from('wiki_pages').delete().eq('id', page.id);
          }
          await supabase.from('wiki_categories').delete().eq('title', id);
      } else {
          // Record deletion in history instead of deleting it
          await recordDeleteHistory(id, title);
          await supabase.from('wiki_sections').delete().eq('page_id', id);
          const { error } = await supabase.from('wiki_pages').delete().eq('id', id);
          if (error) throw error;
      }
      
      setDeleteConfirmation(null);
      await fetchData();
      if (location.pathname.includes(id)) navigate('/');
    } catch (err: any) {
      alert("Error during deletion: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
        if (modalMode === 'edit-category') {
            await supabase.from('wiki_pages').update({ category: formData.category }).eq('category', editingCategoryOldName);
            await supabase.from('wiki_categories').update({ title: formData.category }).eq('title', editingCategoryOldName);
        } else {
            const finalPolicyTitle = isPolicyEnabled ? "Official Department Policy" : null;
            const payload = { 
              ...formData, 
              parent_page_id: formData.parent_page_id || null,
              based_on_policy_title: finalPolicyTitle,
              based_on_policy_url: isPolicyEnabled ? formData.based_on_policy_url : null
            };
            
            if (modalMode === 'add') {
                await supabase.from('wiki_pages').insert(payload);
            } else {
                await supabase.from('wiki_pages').update(payload).eq('id', formData.id);
            }
        }
        setIsModalOpen(false);
        fetchData();
    } catch (err: any) {
        alert("Error saving: " + err.message);
    } finally {
        setIsSaving(false);
    }
  };

  if (loading) return <aside className="w-64 bg-slate-900 h-screen fixed p-6 flex items-center justify-center"><Loader2 className="animate-spin text-slate-500" /></aside>;

  return (
    <>
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 z-10 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 shrink-0">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-[10px]">CDO</span> Wiki
          </h1>
          <p className="text-[10px] text-slate-500 mt-1">Facilities, Physical Security, HSE</p>
        </div>

        {adminMode && (
          <div className="px-4 py-3 border-b border-slate-800 animate-fadeIn space-y-2 bg-slate-800/50 shrink-0">
             <button onClick={openAddModal} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md active:scale-95">
               <Plus size={14} /> New Wiki Page
             </button>
             <button 
               onClick={() => setIsAiModalOpen(true)}
               className="w-full bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
             >
               <Sparkles size={14} /> AI Policy Architect
             </button>
          </div>
        )}

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <NavLink to="/" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-2 ${isActive ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}>
            <LayoutDashboard size={20} /> <span className="font-medium">Dashboard</span>
          </NavLink>

          {adminMode && (
            <div className="mb-4 animate-fadeIn">
              <div className="text-[10px] font-bold text-red-500 uppercase px-4 mt-4 mb-2 tracking-wider">System Administration</div>
              <NavLink to="/admin/users" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-red-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}>
                <Users size={20} /> <span className="font-medium">User Management</span>
              </NavLink>
            </div>
          )}
          
          <div className="text-[10px] font-bold text-slate-500 uppercase px-4 mb-2 tracking-wider">Wiki Content</div>

          {categoriesData.map((categoryObj, index) => {
            const category = categoryObj.title;
            const categoryPages = getPagesByCategory(category);
            const rootPages = categoryPages.filter(p => !p.parent_page_id);
            
            return (
              <div key={category} className="mb-2"
                draggable={adminMode} 
                onDragStart={(e) => adminMode && handleDragStartCat(e, index)} 
                onDragOver={(e) => adminMode && handleDragOver(e)} 
                onDrop={(e) => adminMode && handleDropCategory(e, index)}
              >
                <div className="flex items-center rounded-lg relative overflow-hidden group/cat-row">
                    {adminMode && <div className="pl-2 cursor-grab text-slate-600 hover:text-slate-400"><GripVertical size={14} /></div>}
                    <button 
                      onClick={() => toggleCategory(category)} 
                      className={`w-full flex items-center gap-2 px-4 py-2 mb-1 text-xs font-bold uppercase tracking-wider transition-colors rounded-lg text-left ${expandedCategories[category] ? 'text-slate-200 bg-slate-800/30' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-200'}`}
                    >
                        {expandedCategories[category] ? <ChevronDown size={14} /> : <ChevronRight size={14} />} 
                        <span className="flex-1 truncate">{category}</span>
                    </button>
                    
                    {adminMode && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover/cat-row:opacity-100 transition-opacity bg-slate-900/80 backdrop-blur-sm shadow-sm rounded z-20">
                        <button onClick={(e) => openEditCategoryModal(category, e)} className="p-1 text-blue-400 hover:text-blue-300"><Edit2 size={12} /></button>
                        <button onClick={(e) => handleDeleteCategoryClick(category, e)} className="p-1 text-red-400 hover:text-red-300"><Trash2 size={12} /></button>
                      </div>
                    )}
                </div>
                
                {expandedCategories[category] && (
                  <div className="space-y-1 ml-2 border-l border-slate-700 pl-2 animate-fadeIn">
                    {rootPages.map((page) => {
                      const Icon = getIcon(page.icon_name);
                      const children = categoryPages.filter(p => p.parent_page_id === page.id);
                      
                      return (
                        <div key={page.id} className="relative"
                            draggable={adminMode}
                            onDragStart={(e) => adminMode && handleDragStartPage(e, page.id, null, category)}
                            onDragOver={(e) => adminMode && handleDragOver(e)}
                            onDrop={(e) => adminMode && handleDropPage(e, page.id)}
                        >
                          <div className="flex items-center relative group/page-row">
                              {adminMode && <div className="pl-1 cursor-grab text-slate-600 hover:text-slate-400 shrink-0"><GripVertical size={12} /></div>}
                              <NavLink 
                                to={`/policy/${page.id}`} 
                                className={({ isActive }) => `flex-1 flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors overflow-hidden ${isActive ? 'bg-slate-800 text-white border-l-4 border-blue-500' : 'hover:bg-slate-800/50 text-slate-400 hover:text-white'}`}
                              >
                                <div className="relative flex items-center shrink-0">
                                  <Icon size={18} className="shrink-0" />
                                  {page.based_on_policy_title && (
                                    <div className="absolute -right-0.5 -top-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full border border-slate-900 shadow-[0_0_5px_rgba(59,130,246,0.6)]" title="Verified Policy Content" />
                                  )}
                                </div>
                                <span className="text-sm font-medium truncate">{page.title}</span>
                              </NavLink>
                              
                              {children.length > 0 && (
                                  <button onClick={(e) => togglePage(e, page.id)} className="ml-1 p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white shrink-0 transition-colors">
                                      {expandedPages[page.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                  </button>
                              )}

                              {adminMode && (
                                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1 bg-slate-900 shadow-md rounded p-1 opacity-0 group-hover/page-row:opacity-100 transition-opacity z-20">
                                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditModal(page); }} className="p-1 text-blue-400 hover:text-blue-300"><Edit2 size={12} /></button>
                                  <button onClick={(e) => handleDeletePageClick(page.id, page.title, e)} className="p-1 text-red-400 hover:text-red-300"><Trash2 size={12} /></button>
                                </div>
                              )}
                          </div>

                          {children.length > 0 && expandedPages[page.id] && (
                            <div className="ml-4 mt-1 border-l border-slate-700 pl-2 space-y-1 animate-fadeIn">
                              {children.map(child => {
                                 const ChildIcon = getIcon(child.icon_name);
                                 return (
                                  <div key={child.id} className="relative group/child-row flex items-center"
                                    draggable={adminMode}
                                    onDragStart={(e) => adminMode && handleDragStartPage(e, child.id, page.id, category)}
                                    onDragOver={(e) => adminMode && handleDragOver(e)}
                                    onDrop={(e) => adminMode && handleDropPage(e, child.id)}
                                  >
                                     {adminMode && <div className="cursor-grab text-slate-600 hover:text-slate-400 shrink-0"><GripVertical size={10} /></div>}
                                     <NavLink to={`/policy/${child.id}`} className={({ isActive }) => `flex-1 flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${isActive ? 'bg-slate-800 text-white border-l-4 border-blue-500' : 'hover:bg-slate-800/50 text-slate-400 hover:text-white'}`}>
                                       <div className="relative flex items-center shrink-0">
                                         <ChildIcon size={16} className="shrink-0" />
                                         {child.based_on_policy_title && (
                                           <div className="absolute -right-0.5 -top-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full border border-slate-900" title="Verified Policy Content" />
                                         )}
                                       </div>
                                       <span className="text-xs font-medium truncate">{child.title}</span>
                                     </NavLink>
                                      {adminMode && (
                                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1 bg-slate-900 shadow-md rounded p-1 opacity-0 group-hover/child-row:opacity-100 transition-opacity z-20">
                                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditModal(child); }} className="p-1 text-blue-400 hover:text-blue-300"><Edit2 size={10} /></button>
                                          <button onClick={(e) => handleDeletePageClick(child.id, child.title, e)} className="p-1 text-red-400 hover:text-red-300"><Trash2 size={10} /></button>
                                        </div>
                                      )}
                                   </div>
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

        <div className="shrink-0 p-4 space-y-2 border-t border-slate-800 bg-slate-900 select-none">
          <button onClick={() => setIsTutorialOpen(true)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
            <HelpCircle size={14} /> Help & Tutorial
          </button>
          {isAdmin && (
            <button onClick={toggleAdminMode} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${adminMode ? 'bg-red-900/30 text-red-400' : 'text-slate-500 hover:bg-slate-800'}`}>
                <span className="flex items-center gap-2"><Settings size={14} /> Admin Mode</span>
                {adminMode ? <ToggleRight size={24} className="text-red-500" /> : <ToggleLeft size={24} />}
            </button>
          )}
        </div>
      </aside>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-slideUp border border-slate-100">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-100">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Delete {deleteConfirmation.type === 'category' ? 'Category' : 'Wiki Page'}?
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                Are you sure you want to delete <span className="font-bold">"{deleteConfirmation.title}"</span>? 
                {deleteConfirmation.type === 'category' ? ' This will also delete all pages within this category.' : ' This action cannot be undone.'}
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setDeleteConfirmation(null)} 
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors border border-slate-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeDelete} 
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI POLICY ARCHITECT MODAL */}
      {isAiModalOpen && (
        <AIContentGenerator 
          onClose={() => setIsAiModalOpen(false)} 
          onSuccess={() => {
            setIsAiModalOpen(false);
            fetchData();
          }}
          categories={categoriesData.map(c => c.title)}
        />
      )}

      {/* TUTORIAL OVERLAY */}
      {isTutorialOpen && (
        <TutorialOverlay onClose={() => setIsTutorialOpen(false)} />
      )}

      {/* ADD/EDIT PAGE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp border border-slate-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg text-slate-800">
                {modalMode === 'add' ? 'Create New Wiki Page' : modalMode === 'edit-category' ? 'Edit Category' : 'Edit Wiki Page'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {modalMode === 'edit-category' ? (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Category Name</label>
                  <input 
                    type="text" 
                    value={formData.category} 
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Page Title</label>
                      <input 
                        type="text" 
                        required
                        value={formData.title} 
                        onChange={(e) => setFormData({...formData, title: e.target.value, id: modalMode === 'add' ? e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : formData.id})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g. Fire Safety"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">URL / ID</label>
                      <input 
                        type="text" 
                        required
                        disabled={modalMode === 'edit'}
                        value={formData.id} 
                        onChange={(e) => setFormData({...formData, id: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                        placeholder="fire-safety"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Category</label>
                    <div className="flex gap-2">
                      <select 
                        value={formData.category} 
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        {categoriesData.map(c => <option key={c.title} value={c.title}>{c.title}</option>)}
                      </select>
                      <input 
                        type="text" 
                        placeholder="Or type new..."
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Parent Page (Optional)</label>
                    <select 
                      value={formData.parent_page_id} 
                      onChange={(e) => setFormData({...formData, parent_page_id: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">No Parent (Root Page)</option>
                      {pages.filter(p => !p.parent_page_id && p.id !== formData.id).map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sidebar Icon</label>
                    <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-lg custom-scrollbar bg-slate-50">
                      {Object.keys(iconMap).map(iconName => {
                        const Icon = iconMap[iconName];
                        return (
                          <button 
                            key={iconName} 
                            type="button" 
                            onClick={() => setFormData({...formData, icon_name: iconName})} 
                            className={`p-2 rounded-md flex items-center justify-center transition-all ${formData.icon_name === iconName ? 'bg-blue-600 text-white shadow-md scale-110' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-200'}`}
                          >
                            <Icon size={18} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                        <LinkIcon size={14} /> Official Policy Link
                      </label>
                      <button 
                        onClick={() => setIsPolicyEnabled(!isPolicyEnabled)}
                        className={`text-blue-600 text-[10px] font-bold hover:underline`}
                      >
                        {isPolicyEnabled ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                    {isPolicyEnabled && (
                      <div className="space-y-2 animate-fadeIn">
                        <input 
                          type="text" 
                          placeholder="Link to SharePoint PDF..." 
                          value={formData.based_on_policy_url}
                          onChange={(e) => setFormData({...formData, based_on_policy_url: e.target.value})}
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                        <p className="text-[9px] text-slate-500 italic">This will add a "Verified Policy" badge and direct link to the page.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {modalMode === 'add' ? 'Create Page' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
