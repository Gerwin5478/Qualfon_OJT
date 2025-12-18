import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, ChevronDown, ChevronRight, Loader2, Plus, Trash2, Edit2, Settings, Save, X, ToggleLeft, ToggleRight, GripVertical, AlertTriangle, Users, Lock } from 'lucide-react';
import { getIcon, iconMap } from '../lib/iconMap';
import { useAuth } from '../contexts/AuthContext';

interface WikiPageSimple {
  id: string;
  title: string;
  category: string;
  parent_page_id: string | null;
  icon_name: string;
  sort_order: number;
}

interface WikiCategory {
  id?: string;
  title: string;
  sort_order: number;
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, adminMode, toggleAdminMode, isEditLocked, lockedBy } = useAuth();
  
  const [pages, setPages] = useState<WikiPageSimple[]>([]);
  const [categoriesData, setCategoriesData] = useState<WikiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Drag and Drop State
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'edit-category'>('add');
  const [editingCategoryOldName, setEditingCategoryOldName] = useState<string | null>(null);

  // Delete Confirmation State
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
    sort_order: 0
  });
  
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedPages, setExpandedPages] = useState<Record<string, boolean>>({});
  
  const isMounted = useRef(true);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    isMounted.current = true;
    
    // Safety timeout to prevent sidebar from sticking in loading state
    const timer = setTimeout(() => {
        if (isMounted.current) setLoading(false);
    }, 8000);

    fetchData().then(() => clearTimeout(timer));

    // Debounce function to prevent rapid refetching on multiple realtime events
    let debounceTimer: ReturnType<typeof setTimeout>;
    const debouncedFetch = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (isMounted.current) fetchData();
      }, 1000);
    };

    // Use a STATIC channel name to prevent connection leaks across re-renders or navigation
    // Unique names per mount can exhaust browser WebSocket limits or Supabase quotas
    const channelName = 'global_wiki_updates'; 
    
    // Check if we already have a subscription to avoid duplicates
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wiki_pages' }, debouncedFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wiki_categories' }, debouncedFetch)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
           // console.log('Sidebar connected to realtime updates');
        }
      });
    
    channelRef.current = channel;
      
    return () => { 
        isMounted.current = false;
        clearTimeout(timer);
        clearTimeout(debounceTimer);
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }
    };
  }, []);

  const fetchData = async () => {
    try {
        const { data: pagesData } = await supabase
        .from('wiki_pages')
        .select('id, title, category, parent_page_id, icon_name, sort_order') // Removed summary to reduce payload
        .order('sort_order', { ascending: true });
        
        if (!isMounted.current) return;

        const fetchedPages = (pagesData || []) as WikiPageSimple[];
        setPages(fetchedPages);

        const { data: catsData, error: catError } = await supabase
            .from('wiki_categories')
            .select('*')
            .order('sort_order', { ascending: true });

        if (!isMounted.current) return;

        const distinctCategoriesFromPages = Array.from<string>(new Set(fetchedPages.map(p => p.category || 'Procedures'))).sort();
        
        let finalCategories: WikiCategory[] = [];

        if (catError || !catsData || catsData.length === 0) {
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

    } catch (err) {
        console.error("Error fetching sidebar data", err);
    } finally {
        if (isMounted.current) setLoading(false);
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

  useEffect(() => {
    const currentPathId = location.pathname.split('/').pop();
    if (currentPathId && pages.length > 0) {
      const activePage = pages.find(p => p.id === currentPathId);
      if (activePage) {
        const category = activePage.category || 'Procedures';
        setExpandedCategories(prev => ({ ...prev, [category]: true }));
        if (activePage.parent_page_id) {
          setExpandedPages(prev => ({ ...prev, [activePage.parent_page_id!]: true }));
        } else {
           const hasChildren = pages.some(p => p.parent_page_id === activePage.id);
           if (hasChildren) setExpandedPages(prev => ({ ...prev, [activePage.id]: true }));
        }
      }
    }
  }, [location.pathname, pages]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedCategoryIndex(index);
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedCategoryIndex !== index) {
        setDragOverIndex(index);
    }
  };
  
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (draggedCategoryIndex === null || draggedCategoryIndex === dropIndex) return;

    const newCategories = [...categoriesData];
    const [movedItem] = newCategories.splice(draggedCategoryIndex, 1);
    newCategories.splice(dropIndex, 0, movedItem);

    const updatedCategories = newCategories.map((cat, idx) => ({ ...cat, sort_order: idx }));

    setCategoriesData(updatedCategories);
    setDraggedCategoryIndex(null);

    const updates = updatedCategories.map(c => {
        const payload: any = { title: c.title, sort_order: c.sort_order };
        if (c.id) payload.id = c.id;
        return payload;
    });

    await supabase.from('wiki_categories').upsert(updates, { onConflict: 'title' });
  };

  const openAddModal = () => {
    setModalMode('add');
    const maxSort = pages.length > 0 ? Math.max(...pages.map(p => p.sort_order || 0)) : 0;
    setFormData({
      id: '',
      title: '',
      category: categoriesData[0]?.title || 'General',
      parent_page_id: '',
      icon_name: 'FileText',
      summary: '',
      sort_order: maxSort + 1
    });
    setIsModalOpen(true);
  };

  const openEditModal = (page: any) => {
    setModalMode('edit');
    setFormData({
      id: page.id,
      title: page.title,
      category: page.category || '',
      parent_page_id: page.parent_page_id || '',
      icon_name: page.icon_name || 'FileText',
      summary: page.summary || '',
      sort_order: page.sort_order || 0
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
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirmation({
      isOpen: true,
      type: 'category',
      id: category,
      title: category
    });
  };

  const handleDeletePageClick = (pageId: string, pageTitle: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirmation({
      isOpen: true,
      type: 'page',
      id: pageId,
      title: pageTitle
    });
  };

  const executeDelete = async () => {
    if (!deleteConfirmation) return;
    const { type, id } = deleteConfirmation;

    if (type === 'category') {
        const category = id;
        const pagesInCat = getPagesByCategory(category);
        
        // 1. Delete sections for all pages in category
        for (const page of pagesInCat) {
            await supabase.from('wiki_sections').delete().eq('page_id', page.id);
        }
        
        // 2. Delete pages
        const { error: pageError } = await supabase.from('wiki_pages').delete().eq('category', category);
        
        if (pageError) {
            alert("Error deleting pages: " + pageError.message);
        } else {
            // 3. Delete category
            const { error: catError } = await supabase.from('wiki_categories').delete().eq('title', category);
            
            if (catError) {
                alert("Error: " + catError.message);
            } else { 
                if (pagesInCat.some(p => location.pathname.includes(p.id))) {
                    navigate('/');
                }
                fetchData(); 
            }
        }
    } else {
        const pageId = id;
        // 1. Delete sections first
        await supabase.from('wiki_sections').delete().eq('page_id', pageId);

        // 2. Delete page
        const { error } = await supabase.from('wiki_pages').delete().eq('id', pageId);
        
        if (error) {
            alert("Error: " + error.message);
        } else { 
            fetchData(); 
            if (location.pathname.includes(pageId)) navigate('/'); 
        }
    }
    setDeleteConfirmation(null);
  };

  const handleSave = async () => {
    if (modalMode === 'edit-category') {
        if (!formData.category || !editingCategoryOldName) return;
        setIsSaving(true);
        try {
            await supabase.from('wiki_pages').update({ category: formData.category }).eq('category', editingCategoryOldName);
            await supabase.from('wiki_categories').update({ title: formData.category }).eq('title', editingCategoryOldName);
            setIsModalOpen(false); 
            fetchData(); 
        } finally {
            setIsSaving(false);
        }
        return;
    }

    if (!formData.id || !formData.title) { alert("ID and Title required"); return; }

    setIsSaving(true);
    try {
        const payload = {
        id: formData.id,
        title: formData.title,
        category: formData.category,
        parent_page_id: formData.parent_page_id || null,
        icon_name: formData.icon_name,
        summary: formData.summary,
        sort_order: formData.sort_order
        };

        if (modalMode === 'add') {
        const { error } = await supabase.from('wiki_pages').insert(payload);
        if (error) alert("Error: " + error.message);
        else {
            const existingCat = categoriesData.find(c => c.title === formData.category);
            if (!existingCat) await supabase.from('wiki_categories').insert({ title: formData.category, sort_order: categoriesData.length + 1 });
        }
        } else {
        const { error } = await supabase.from('wiki_pages').update(payload).eq('id', formData.id);
        if (error) alert("Error: " + error.message);
        }
        setIsModalOpen(false); fetchData();
    } finally {
        setIsSaving(false);
    }
  };

  const availableParents = pages.filter(p => !p.parent_page_id && p.id !== formData.id);

  if (loading) return <aside className="w-64 bg-slate-900 h-screen fixed p-6"><Loader2 className="animate-spin mx-auto mt-10 text-slate-500" /></aside>;

  return (
    <>
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto border-r border-slate-800 z-10 shadow-xl custom-scrollbar">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm">FA</span> Wiki
          </h1>
          <p className="text-[10px] text-slate-500 mt-1">Facilities & Security</p>
        </div>

        {adminMode && (
          <div className="px-4 py-3 border-b border-slate-800 animate-fadeIn space-y-2 bg-blue-900/20">
             <button onClick={openAddModal} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
               <Plus size={14} /> Add New Page / Category
             </button>
          </div>
        )}

        <nav className="flex-1 p-4 space-y-1">
          <NavLink to="/" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-4 ${isActive ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}>
            <LayoutDashboard size={20} /> <span className="font-medium">Dashboard</span>
          </NavLink>
          
          {isAdmin && (
            <div className="mb-4">
               <div className="text-[10px] font-bold text-slate-500 uppercase px-4 mb-2 tracking-wider">Administration</div>
               <NavLink to="/admin/users" className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${isActive ? 'bg-slate-800 text-white border-l-4 border-purple-500' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}>
                <Users size={18} /> <span className="font-medium">Manage Users</span>
              </NavLink>
            </div>
          )}

          <div className="text-[10px] font-bold text-slate-500 uppercase px-4 mb-2 tracking-wider">Wiki Content</div>

          {categoriesData.map((categoryObj, index) => {
            const category = categoryObj.title;
            const categoryPages = getPagesByCategory(category);
            const rootPages = categoryPages.filter(p => !p.parent_page_id);
            
            return (
              <div key={category} className={`mb-2 relative group/cat transition-all duration-200 ${draggedCategoryIndex === index ? 'opacity-40' : ''}`}
                draggable={adminMode} onDragStart={(e) => adminMode && handleDragStart(e, index)} onDragOver={(e) => adminMode && handleDragOver(e, index)} onDragLeave={() => adminMode && handleDragLeave()} onDrop={(e) => adminMode && handleDrop(e, index)}
              >
                <div className={`flex items-center rounded-lg ${dragOverIndex === index ? 'bg-slate-800' : ''}`}>
                    {adminMode && <div className="pl-2 cursor-grab text-slate-600 hover:text-slate-400"><GripVertical size={14} /></div>}
                    <button onClick={() => toggleCategory(category)} className="w-full flex items-center gap-2 px-4 py-2 mb-1 text-xs font-bold text-slate-500 uppercase tracking-wider hover:bg-slate-800/50 hover:text-slate-200 transition-colors rounded-lg">
                        {expandedCategories[category] ? <ChevronDown size={14} /> : <ChevronRight size={14} />} <span className="flex-1 text-left truncate">{category}</span>
                    </button>
                </div>
                
                {adminMode && (
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover/cat:opacity-100 transition-opacity bg-slate-900 shadow-sm rounded z-20">
                    <button onClick={(e) => openEditCategoryModal(category, e)} className="p-1 text-blue-400 hover:text-blue-300"><Edit2 size={12} /></button>
                    <button onClick={(e) => handleDeleteCategoryClick(category, e)} className="p-1 text-red-400 hover:text-red-300"><Trash2 size={12} /></button>
                  </div>
                )}

                {expandedCategories[category] && (
                  <div className="space-y-1 ml-2 border-l border-slate-700 pl-2 animate-fadeIn">
                    {rootPages.map((page) => {
                      const Icon = getIcon(page.icon_name);
                      const children = categoryPages.filter(p => p.parent_page_id === page.id);
                      
                      return (
                        <div key={page.id} className="relative group/page">
                          <div className="flex items-center">
                              <NavLink to={`/policy/${page.id}`} className={({ isActive }) => `flex-1 flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors overflow-hidden ${isActive ? 'bg-slate-800 text-white border-l-4 border-blue-500' : 'hover:bg-slate-800/50 text-slate-400 hover:text-white'}`}>
                              <Icon size={18} className="shrink-0" />
                              <span className="text-sm font-medium truncate">{page.title}</span>
                              </NavLink>
                              {children.length > 0 && (
                                  <button onClick={(e) => togglePage(e, page.id)} className="ml-1 p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white shrink-0">
                                      {expandedPages[page.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                  </button>
                              )}
                          </div>
                          {adminMode && (
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1 bg-slate-900 shadow-md rounded p-1 opacity-0 group-hover/page:opacity-100 transition-opacity z-20">
                              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditModal(page); }} className="p-1 text-blue-400 hover:text-blue-300"><Edit2 size={12} /></button>
                              <button onClick={(e) => handleDeletePageClick(page.id, page.title, e)} className="p-1 text-red-400 hover:text-red-300"><Trash2 size={12} /></button>
                            </div>
                          )}
                          {children.length > 0 && expandedPages[page.id] && (
                            <div className="ml-4 mt-1 border-l border-slate-700 pl-2 space-y-1">
                              {children.map(child => {
                                 const ChildIcon = getIcon(child.icon_name);
                                 return (
                                  <div key={child.id} className="relative group/child">
                                     <NavLink to={`/policy/${child.id}`} className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${isActive ? 'bg-slate-800 text-white border-l-4 border-blue-500' : 'hover:bg-slate-800/50 text-slate-400 hover:text-white'}`}>
                                       <ChildIcon size={16} className="shrink-0" />
                                       <span className="text-xs font-medium truncate">{child.title}</span>
                                     </NavLink>
                                      {adminMode && (
                                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1 bg-slate-900 shadow-md rounded p-1 opacity-0 group-hover/child:opacity-100 transition-opacity z-20">
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

        {isAdmin && (
           <div className="p-4 border-t border-slate-800 bg-slate-900/50">
             {isEditLocked ? (
                 <div className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold bg-amber-900/20 text-amber-500 border border-amber-800/50">
                   <div className="flex items-center gap-2 overflow-hidden">
                     <Lock size={14} className="shrink-0" />
                     <div className="flex flex-col truncate">
                       <span>Editing Locked</span>
                       <span className="text-[10px] opacity-70 truncate">by {lockedBy}</span>
                     </div>
                   </div>
                 </div>
             ) : (
                <button onClick={toggleAdminMode} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${adminMode ? 'bg-red-900/30 text-red-400' : 'text-slate-500 hover:bg-slate-800'}`}>
                    <span className="flex items-center gap-2"><Settings size={14} /> Admin Mode</span>
                    {adminMode ? <ToggleRight size={24} className="text-red-500" /> : <ToggleLeft size={24} />}
                </button>
             )}
           </div>
        )}
      </aside>
      
      {/* Same Admin Modal Code ... (No changes needed in the modal part) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
           {/* ... Modal Content same as before ... */}
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp flex flex-col max-h-[90vh]">
             <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
               <h3 className="font-bold text-lg text-slate-800">
                 {modalMode === 'add' ? 'Add Page/Category' : modalMode === 'edit-category' ? 'Rename Category' : 'Edit Page'}
               </h3>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
             </div>
             
             <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                {modalMode === 'edit-category' ? (
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category Name</label>
                        <input type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" autoFocus />
                    </div>
                ) : (
                    <>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Page ID</label>
                            <input type="text" value={formData.id} onChange={(e) => setFormData({...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '-')})} disabled={modalMode === 'edit'} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono disabled:text-slate-400" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Page Title</label>
                            <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                            <div className="flex gap-2">
                                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                                    <option value="">Select Existing...</option>
                                    {categoriesData.map(c => <option key={c.title} value={c.title}>{c.title}</option>)}
                                </select>
                                <input type="text" placeholder="Or new..." value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Parent Page (Optional)</label>
                            <select value={formData.parent_page_id} onChange={(e) => setFormData({...formData, parent_page_id: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                                <option value="">None (Top Level)</option>
                                {availableParents.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Icon</label>
                            <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-lg custom-scrollbar bg-slate-50">
                                {Object.keys(iconMap).map(iconName => {
                                    const Icon = iconMap[iconName];
                                    const isSelected = formData.icon_name === iconName;
                                    return (
                                        <button
                                            key={iconName}
                                            type="button"
                                            onClick={() => setFormData({...formData, icon_name: iconName})}
                                            className={`p-2 rounded-md flex items-center justify-center transition-all aspect-square ${isSelected ? 'bg-blue-600 text-white shadow-md scale-110 ring-2 ring-blue-300 ring-offset-1' : 'bg-white text-slate-500 hover:bg-blue-50 hover:text-blue-600 border border-slate-200'}`}
                                            title={iconName}
                                        >
                                            <Icon size={18} />
                                        </button>
                                    )
                                })}
                            </div>
                            <div className="flex items-center justify-end mt-1 gap-2">
                                <span className="text-[10px] font-medium text-slate-400 uppercase">Selected:</span>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 rounded-md text-blue-700 text-xs font-medium border border-blue-100">
                                   {(() => {
                                      const SelectedIcon = getIcon(formData.icon_name);
                                      return <SelectedIcon size={12} />;
                                   })()}
                                   {formData.icon_name}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Summary</label>
                            <textarea value={formData.summary} onChange={(e) => setFormData({...formData, summary: e.target.value})} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sort Order</label>
                            <input type="number" value={formData.sort_order} onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value)})} className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                        </div>
                    </>
                )}
             </div>

             <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
               <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors" disabled={isSaving}>Cancel</button>
               <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2" disabled={isSaving}>
                 {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                 {isSaving ? 'Saving...' : 'Save'}
               </button>
             </div>
           </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-slideUp border border-slate-200">
                <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Delete {deleteConfirmation.type === 'page' ? 'Page' : 'Category'}?</h3>
                    <p className="text-sm text-slate-600 mb-2">
                        Are you sure you want to delete <span className="font-semibold">"{deleteConfirmation.title}"</span>?
                    </p>
                    {deleteConfirmation.type === 'category' && (
                        <p className="text-xs text-red-600 font-medium mb-4 bg-red-50 p-2 rounded">
                            Warning: This will delete ALL pages inside this category!
                        </p>
                    )}
                    
                    <div className="flex gap-3 justify-center">
                        <button 
                            onClick={() => setDeleteConfirmation(null)}
                            className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={executeDelete}
                            className="px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded-lg transition-colors shadow-md flex items-center gap-2"
                        >
                            <Trash2 size={16} />
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;