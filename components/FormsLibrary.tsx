import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, Download, Plus, Edit2, Trash2, 
  Save, X, Loader2, AlertCircle, FileSpreadsheet, 
  ExternalLink, Filter, FolderOpen, MoreVertical,
  CheckCircle2, AlertTriangle, FolderPlus
} from 'lucide-react';
import { supabase } from '../lib/supabase';
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

interface FormsLibraryProps {
  forms: FormItem[];
  categories: FormCategory[];
  onRefresh: () => void;
}

const FormsLibrary: React.FC<FormsLibraryProps> = ({ forms, categories, onRefresh }) => {
  const { adminMode } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Management State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    category: ''
  });

  const [deleteConfirm, setDeleteConfirm] = useState<FormItem | null>(null);

  const filteredForms = forms.filter(form => {
    const matchesSearch = form.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         form.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || form.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openAddModal = () => {
    setModalMode('add');
    setIsCreatingNewCategory(false);
    setNewCategoryName('');
    setFormData({
      title: '',
      url: '',
      description: '',
      category: categories[0]?.title || 'General'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (form: FormItem) => {
    setModalMode('edit');
    setEditingId(form.id);
    setIsCreatingNewCategory(false);
    setNewCategoryName('');
    setFormData({
      title: form.title,
      url: form.url,
      description: form.description,
      category: form.category
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.url) return;
    
    const finalCategory = isCreatingNewCategory ? newCategoryName.trim() : formData.category;
    if (!finalCategory) {
      alert("Category name cannot be empty.");
      return;
    }

    setIsProcessing(true);

    try {
      // If it's a new category, we also ensure it exists in form_categories for the dashboard
      if (isCreatingNewCategory) {
        const categoryExists = categories.find(c => c.title.toLowerCase() === finalCategory.toLowerCase());
        if (!categoryExists) {
          await supabase.from('form_categories').insert([{ 
            title: finalCategory, 
            sort_order: categories.length 
          }]);
        }
      }

      const payload = {
        title: formData.title,
        url: formData.url,
        description: formData.description,
        category: finalCategory
      };

      if (modalMode === 'add') {
        const { error } = await supabase.from('forms').insert([{
          ...payload,
          sort_order: forms.length
        }]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('forms').update(payload).eq('id', editingId);
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert("Error saving form: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase.from('forms').delete().eq('id', deleteConfirm.id);
      if (error) throw error;
      setDeleteConfirm(null);
      onRefresh();
    } catch (err: any) {
      alert("Error deleting form: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const categoriesToDisplay = selectedCategory === 'All' 
    ? Array.from(new Set(forms.map(f => f.category)))
    : [selectedCategory];

  // Helper to filter out categories with zero forms
  const activeCategories = categories.filter(cat => 
    forms.some(form => form.category === cat.title)
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 text-green-700 p-2 rounded-xl">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Forms & SOP Documents</h2>
            <p className="text-xs text-slate-500">Official templates and submission links</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search forms..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
            />
          </div>
          {adminMode && (
            <button 
              onClick={openAddModal}
              className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md shadow-blue-100 transition-all active:scale-95"
            >
              <Plus size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills - Automatically filtered to hide empty categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        <button 
          onClick={() => setSelectedCategory('All')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${selectedCategory === 'All' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'}`}
        >
          All Resources
        </button>
        {activeCategories.map(cat => (
          <button 
            key={cat.title}
            onClick={() => setSelectedCategory(cat.title)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${selectedCategory === cat.title ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'}`}
          >
            {cat.title}
          </button>
        ))}
      </div>

      {/* Grid Display */}
      {categoriesToDisplay.map(catTitle => {
        const catForms = filteredForms.filter(f => f.category === catTitle);
        if (catForms.length === 0) return null;

        return (
          <div key={catTitle} className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{catTitle}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catForms.map(form => (
                <div key={form.id} className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                  <div className="flex items-start justify-between mb-3">
                    <div className="bg-slate-50 text-blue-600 p-2.5 rounded-xl border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <FileText size={20} />
                    </div>
                    {adminMode && (
                      <div className="flex gap-1">
                        <button onClick={() => openEditModal(form)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => setDeleteConfirm(form)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-blue-600 transition-colors">{form.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">{form.description}</p>
                  
                  <a 
                    href={form.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-green-600 hover:text-white transition-all group/btn"
                  >
                    <Download size={14} className="group-hover/btn:scale-110 transition-transform" />
                    Open Document
                  </a>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {filteredForms.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <FolderOpen className="mx-auto text-slate-200 mb-4" size={48} />
          <p className="text-slate-500 font-bold">No forms found matching your search.</p>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slideUp border border-slate-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">{modalMode === 'add' ? 'Add New Resource' : 'Edit Resource'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Title</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="e.g. Asset Transfer Form"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">SharePoint URL</label>
                <input 
                  type="text" 
                  value={formData.url} 
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="Paste link here..."
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Category</label>
                  <button 
                    type="button"
                    onClick={() => setIsCreatingNewCategory(!isCreatingNewCategory)}
                    className="text-[10px] font-bold text-blue-600 flex items-center gap-1 hover:underline"
                  >
                    {isCreatingNewCategory ? "Select Existing" : "Create New Category"}
                  </button>
                </div>
                {isCreatingNewCategory ? (
                  <div className="relative animate-fadeIn">
                    <FolderPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
                    <input 
                      type="text" 
                      value={newCategoryName} 
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                      placeholder="Type new category name..."
                      autoFocus
                    />
                  </div>
                ) : (
                  <select 
                    value={formData.category} 
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(c => <option key={c.title} value={c.title}>{c.title}</option>)}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description</label>
                <textarea 
                  rows={3}
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
                  placeholder="What is this form used for?"
                />
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold text-sm">Cancel</button>
              <button 
                type="button"
                onClick={handleSave} 
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                Save Resource
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-slideUp border border-slate-100">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Resource?</h3>
              <p className="text-sm text-slate-600 mb-6">This will remove <span className="font-bold">"{deleteConfirm.title}"</span> from the library. This action cannot be undone.</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-colors border border-slate-200">Cancel</button>
                <button 
                  type="button"
                  onClick={handleDelete} 
                  disabled={isProcessing}
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={16} /> : null} Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormsLibrary;