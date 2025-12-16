import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { seedDatabase } from '../lib/seed';
import { FileText, ArrowRight, Download, FolderOpen, X, FileSpreadsheet, Search, Database, Loader2, Plus, Trash2, Save, ChevronLeft, AlertTriangle, GripVertical } from 'lucide-react';
import { getIcon } from '../lib/iconMap';
import { useAuth } from '../contexts/AuthContext';

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

type DragType = 'CATEGORY' | 'FORM';

const Dashboard: React.FC = () => {
  const { adminMode } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formSearchQuery, setFormSearchQuery] = useState('');
  
  // Data State
  const [forms, setForms] = useState<FormItem[]>([]);
  const [formCategories, setFormCategories] = useState<FormCategory[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  
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
  }, []);

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
        
        // Sync Logic: Ensure all categories in 'forms' exist in 'form_categories'
        const existingCatTitles = new Set(fetchedCats.map(c => c.title));
        const usedCategories = Array.from(new Set(fetchedForms.map(f => f.category)));
        
        const newCatsToCreate: FormCategory[] = [];
        usedCategories.forEach((catTitle, idx) => {
            if (!existingCatTitles.has(catTitle)) {
                newCatsToCreate.push({ title: catTitle, sort_order: fetchedCats.length + idx });
            }
        });

        let finalCategories = [...fetchedCats, ...newCatsToCreate];

        // If we found new categories, save them to DB immediately
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

  const handleSeed = async () => {
    if (!confirm("This will populate your database with the default content. Continue?")) return;
    setSeeding(true);
    await seedDatabase();
    await fetchData();
    setSeeding(false);
  };

  const handleDownloadPolicy = () => {
    const link = document.createElement('a');
    link.href = 'https://qualfon-my.sharepoint.com/personal/francis_tadena_qualfon_com/SiteAssets/SitePages/KPI-Creation-Process-&-Guidelines/FD-06-Fixed-Asset-Policy-v4_e-signed.pdf';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = 'FD-06_Fixed_Asset_Policy.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteCategoryClick = (categoryTitle: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirmation({
        isOpen: true,
        type: 'category',
        id: categoryTitle, // Using title as ID for categories in this logic
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

      const { type, id, title } = deleteConfirmation;

      if (type === 'category') {
        // Optimistic update
        setFormCategories(prev => prev.filter(c => c.title !== title));
        setForms(prev => prev.filter(f => f.category !== title));

        try {
            // 1. Delete forms in this category
            const { error: formsError } = await supabase.from('forms').delete().eq('category', title);
            if (formsError) throw formsError;

            // 2. Delete the category itself
            const { error: catError } = await supabase.from('form_categories').delete().eq('title', title);
            if (catError) throw catError;

        } catch (error: any) {
            alert("Error deleting category: " + error.message);
            fetchData(); // Revert
        }
      } else if (type === 'form') {
        // Optimistic Update
        setForms(prev => prev.filter(f => f.id !== id));

        const { error } = await supabase.from('forms').delete().eq('id', id);
        if (error) {
            console.error("Delete error", error);
            alert("Error deleting form: " + error.message);
            fetchData(); // Revert on error
        }
      }
      
      setDeleteConfirmation(null);
  };

  const handleAddForm = async () => {
    if (!newForm.title || !newForm.url || !newForm.category) {
        alert("Please fill in Title, URL, and Category");
        return;
    }

    // Get max sort order for this category
    const catForms = forms.filter(f => f.category === newForm.category);
    const maxSort = catForms.length > 0 ? Math.max(...catForms.map(f => f.sort_order)) : 0;

    const payload = {
        ...newForm,
        sort_order: maxSort + 1
    };

    const { error } = await supabase.from('forms').insert(payload);
    if (error) {
        alert("Error adding form: " + error.message);
    } else {
        setFormView('list');
        setNewForm({ title: '', url: '', description: '', category: '' });
        fetchData(); // Refetch to sync categories if new one created
    }
  };

  // --- DRAG AND DROP HANDLERS ---

  const onDragStart = (e: React.DragEvent, type: DragType, id: string, category?: string, index?: number) => {
    e.stopPropagation();
    setDraggingItem({ type, id, category, index });
    // Firefox requires data to be set
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

  // Handle Dropping a FORM
  const onDropForm = async (e: React.DragEvent, targetCategory: string, targetIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCategory(null);

    if (!draggingItem || draggingItem.type !== 'FORM') return;

    // 1. Clone state and find dragged item
    const currentForms = [...forms];
    const draggedItemIndex = currentForms.findIndex(f => f.id === draggingItem.id);
    if (draggedItemIndex === -1) return;

    // Create a copy of the dragged item to avoid mutation
    const draggedForm = { ...currentForms[draggedItemIndex] };

    // 2. Remove from original list
    const formsWithoutDragged = currentForms.filter(f => f.id !== draggingItem.id);

    // 3. Update category on the copied item
    draggedForm.category = targetCategory;

    // 4. Calculate Insertion
    // Get all forms currently in the target category (excluding the dragged one)
    const targetCategoryForms = formsWithoutDragged.filter(f => f.category === targetCategory);
    
    // Determine insert position
    let insertAt = targetCategoryForms.length; // Default to end
    if (typeof targetIndex === 'number') {
        insertAt = targetIndex;
    }

    // Insert the dragged form into the target category list
    targetCategoryForms.splice(insertAt, 0, draggedForm);

    // 5. Re-calculate sort_order for the target category
    const updatedCategoryForms = targetCategoryForms.map((f, idx) => ({
        ...f,
        sort_order: idx
    }));

    // 6. Merge back into the main state
    const otherCategoryForms = formsWithoutDragged.filter(f => f.category !== targetCategory);
    const finalForms = [...otherCategoryForms, ...updatedCategoryForms];

    setForms(finalForms);
    setDraggingItem(null);

    // 7. DB Update
    // Upsert the entire updated category to ensure order is saved
    const { error } = await supabase.from('forms').upsert(updatedCategoryForms);
    
    if (error) {
        console.error("Error updating form order:", error.message);
    }
  };

  // Handle Dropping a CATEGORY
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

    // Update sort orders
    const updatedCats = newCats.map((c, i) => ({ ...c, sort_order: i }));
    setFormCategories(updatedCats);
    setDraggingItem(null);

    // DB Update
    const { error } = await supabase.from('form_categories').upsert(updatedCats, { onConflict: 'title' });
    if (error) console.error("Error updating category order:", error.message);
  };

  // --- RENDER HELPERS ---

  // Get root pages for grid
  const rootPages = pages.filter(p => !p.parent_page_id);

  // Get distinct categories for dropdown (from state)
  const categoryOptions = formCategories.map(c => c.title);

  return (
    <div className="max-w-6xl mx-auto space-y-8 relative">
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
              onClick={handleDownloadPolicy}
              className="flex items-center gap-2 bg-white text-blue-900 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-md active:scale-95"
            >
              <Download size={18} />
              Download Policy PDF
            </button>
            <Link 
              to="/policy/tagging"
              className="flex items-center gap-2 bg-blue-600 border border-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-500 transition-colors shadow-md active:scale-95"
            >
              View Receiving & Tagging Steps
            </Link>
            <button 
              onClick={() => {
                setIsModalOpen(true);
                setFormSearchQuery('');
                setFormView('list');
              }}
              className="flex items-center gap-2 bg-blue-500/20 border border-blue-400/50 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-500/30 transition-colors shadow-md active:scale-95"
            >
              <FolderOpen size={18} />
              Downloadable Forms Library
            </button>
            
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
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Browse Topics</h2>
          {rootPages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rootPages.map((page) => {
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

      {/* MODAL OVERLAY */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-slideUp relative">
            
            {/* Modal Header */}
            <div className="flex flex-col border-b border-slate-100 bg-slate-50">
              <div className="flex items-center justify-between p-6 pb-2">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    <FolderOpen size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">
                        {formView === 'add' ? 'Add New Form' : 'Forms Library'}
                    </h3>
                    <p className="text-sm text-slate-500">
                        {formView === 'add' ? 'Enter details for the new downloadable file.' : 'Quick access to all essential downloadable forms.'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Toolbar */}
              {formView === 'list' && (
                <div className="px-6 pb-4 pt-2 flex gap-3">
                    <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text"
                        value={formSearchQuery}
                        onChange={(e) => setFormSearchQuery(e.target.value)}
                        placeholder="Search for a form by name..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 placeholder:text-slate-400 shadow-sm"
                        autoFocus
                    />
                    {formSearchQuery && (
                        <button 
                        onClick={() => setFormSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                        <X size={14} />
                        </button>
                    )}
                    </div>
                    {/* Add Button - Visible only in Admin Mode */}
                    {adminMode && (
                        <button 
                            onClick={() => setFormView('add')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <Plus size={18} /> Add
                        </button>
                    )}
                </div>
              )}
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
                {formView === 'add' ? (
                    // ADD FORM VIEW
                    <div className="max-w-xl mx-auto space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Form Title</label>
                            <input 
                                type="text"
                                value={newForm.title}
                                onChange={(e) => setNewForm({...newForm, title: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                placeholder="e.g. Vacation Leave Form"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">SharePoint URL / Download Link</label>
                            <input 
                                type="text"
                                value={newForm.url}
                                onChange={(e) => setNewForm({...newForm, url: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                placeholder="https://..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                            <div className="flex gap-2">
                                <select 
                                    value={newForm.category}
                                    onChange={(e) => setNewForm({...newForm, category: e.target.value})}
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                >
                                    <option value="">Select Category...</option>
                                    {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <input 
                                    type="text"
                                    placeholder="Or new..."
                                    onChange={(e) => setNewForm({...newForm, category: e.target.value})}
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea 
                                value={newForm.description}
                                onChange={(e) => setNewForm({...newForm, description: e.target.value})}
                                rows={3}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button 
                                onClick={() => setFormView('list')}
                                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <ChevronLeft size={16} /> Back
                            </button>
                            <button 
                                onClick={handleAddForm}
                                className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Save size={16} /> Save Form
                            </button>
                        </div>
                    </div>
                ) : (
                    // LIST VIEW
                    <>
                        {loading ? (
                            <div className="flex justify-center items-center h-full">
                            <Loader2 className="animate-spin text-blue-500" size={32} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-8">
                            {formCategories.length > 0 ? (
                                formCategories.map((category, catIndex) => {
                                    // Filter items for this category
                                    const categoryItems = forms
                                        .filter(f => f.category === category.title)
                                        .filter(f => f.title.toLowerCase().includes(formSearchQuery.toLowerCase()));
                                    
                                    // Hide category if no items match search
                                    if (categoryItems.length === 0 && formSearchQuery) return null;

                                    return (
                                        <div 
                                            key={category.id || category.title}
                                            draggable={adminMode}
                                            onDragStart={(e) => onDragStart(e, 'CATEGORY', category.title)}
                                            onDragOver={(e) => onDragOver(e, category.title)}
                                            onDrop={(e) => onDropCategory(e, category.title)}
                                            className={`transition-all rounded-lg ${dragOverCategory === category.title && draggingItem?.type === 'CATEGORY' ? 'opacity-50 border-2 border-dashed border-blue-500' : ''}`}
                                        >
                                            <div className="flex items-center gap-2 mb-3 pl-1 border-l-4 border-blue-500 ml-1 group/header cursor-default relative pr-8">
                                                {adminMode && (
                                                    <div className="cursor-grab text-slate-400 hover:text-slate-600 opacity-0 group-hover/header:opacity-100 transition-opacity">
                                                        <GripVertical size={16} />
                                                    </div>
                                                )}
                                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                                                    {category.title}
                                                </h4>
                                                
                                                {/* Category Delete Button */}
                                                {adminMode && (
                                                    <button 
                                                        type="button"
                                                        draggable={false}
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                        onClick={(e) => handleDeleteCategoryClick(category.title, e)}
                                                        className="absolute right-0 text-slate-400 hover:text-red-600 transition-colors z-50 p-1.5 rounded-md hover:bg-red-50"
                                                        title="Delete Category"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                            
                                            {/* Drop Zone for Forms moving into this category */}
                                            <div 
                                                className={`grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[50px] p-2 rounded-xl transition-colors ${dragOverCategory === category.title && draggingItem?.type === 'FORM' ? 'bg-blue-50 ring-2 ring-blue-300' : ''}`}
                                                onDragOver={(e) => onDragOver(e, category.title)}
                                                onDrop={(e) => onDropForm(e, category.title, categoryItems.length)} // Drop at end by default
                                            >
                                                {categoryItems.map((form, index) => (
                                                    <div 
                                                        key={form.id} 
                                                        className="relative group/card"
                                                        draggable={adminMode}
                                                        onDragStart={(e) => onDragStart(e, 'FORM', form.id, category.title, index)}
                                                        onDrop={(e) => {
                                                            // If dropping on a form, insert before it
                                                            e.stopPropagation(); // Don't bubble to category drop
                                                            onDropForm(e, category.title, index);
                                                        }}
                                                    >
                                                        <a
                                                            href={form.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`relative flex items-start gap-3 p-4 rounded-xl bg-white border hover:border-blue-400 hover:shadow-md hover:scale-[1.01] transition-all group overflow-hidden min-h-[100px] ${adminMode ? 'cursor-grab' : ''} ${draggingItem?.id === form.id ? 'opacity-50 border-dashed border-blue-500' : 'border-slate-200'}`}
                                                            onClick={(e) => {
                                                                if (adminMode && draggingItem) e.preventDefault(); // Prevent click during drag
                                                            }}
                                                        >
                                                            {adminMode && (
                                                                <div className="absolute top-2 left-1 text-slate-300 opacity-0 group-hover:opacity-100">
                                                                    <GripVertical size={14} />
                                                                </div>
                                                            )}
                                                            <div className="bg-green-50 text-green-600 p-2 rounded-lg group-hover:bg-green-100 transition-colors ml-2">
                                                                {form.title.includes('Assessment') || form.title.includes('Report') ? <FileText size={18} /> : <FileSpreadsheet size={18} />}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-slate-800 text-sm group-hover:text-blue-700 leading-tight">
                                                                {form.title}
                                                                </h4>
                                                                <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-500 font-medium group-hover:text-blue-600">
                                                                <Download size={12} />
                                                                Download File
                                                                </div>
                                                            </div>

                                                            {/* Hover Overlay with Description */}
                                                            <div className="absolute inset-0 bg-slate-800/95 text-white p-4 flex flex-col items-center justify-center text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                                                <p className="text-xs font-medium mb-2">{form.description}</p>
                                                                <div className="flex items-center gap-1 text-[10px] text-blue-200 uppercase tracking-wider font-bold">
                                                                <Download size={10} /> Click to Download
                                                                </div>
                                                            </div>
                                                        </a>
                                                        
                                                        {/* Admin Delete Button - Visible via Global Context */}
                                                        {adminMode && (
                                                            <button 
                                                                type="button"
                                                                draggable={false}
                                                                onMouseDown={(e) => e.stopPropagation()}
                                                                onClick={(e) => handleDeleteFormClick(form.id, form.title, e)}
                                                                className="absolute -top-3 -right-3 p-2 bg-red-500 text-white rounded-full shadow-lg z-50 hover:bg-red-600 hover:scale-110 cursor-pointer transition-all border-2 border-white flex items-center justify-center"
                                                                title="Delete Form"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                {/* Empty State for Drop Target */}
                                                {categoryItems.length === 0 && (
                                                    <div className="col-span-2 border-2 border-dashed border-slate-200 rounded-lg p-4 text-center text-xs text-slate-400">
                                                        Drag forms here
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <Search size={48} className="mb-4 opacity-20" />
                                <p>No forms found matching "{formSearchQuery}"</p>
                                <button 
                                    onClick={() => setFormSearchQuery('')}
                                    className="text-blue-600 text-sm font-medium mt-2 hover:underline"
                                >
                                    Clear search
                                </button>
                                </div>
                            )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                Ensure you are logged into your Qualfon SharePoint to access these files.
              </p>
            </div>

            {/* NESTED CONFIRMATION MODAL */}
            {deleteConfirmation && (
                <div className="absolute inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn rounded-2xl">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-slideUp border border-slate-200">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete {deleteConfirmation.type === 'form' ? 'Form' : 'Category'}?</h3>
                            <p className="text-sm text-slate-600 mb-2">
                                Are you sure you want to delete <span className="font-semibold">"{deleteConfirmation.title}"</span>?
                            </p>
                            {deleteConfirmation.type === 'category' && (
                                <p className="text-xs text-red-600 font-medium mb-4 bg-red-50 p-2 rounded">
                                    Warning: This will delete ALL forms inside this category!
                                </p>
                            )}
                            {deleteConfirmation.type === 'form' && (
                                <p className="text-xs text-slate-500 mb-4">
                                    This action cannot be undone.
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

          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;