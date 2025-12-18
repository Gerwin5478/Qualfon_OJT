import React, { useEffect, useState, useRef } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Info, AlertCircle, ChevronRight, Download, Loader2, Edit2, Trash2, Plus, Save, X, AlertTriangle, Image as ImageIcon, Link as LinkIcon, Upload, RefreshCw, Home } from 'lucide-react';
import { getIcon } from '../lib/iconMap';
import { useAuth } from '../contexts/AuthContext';

const WikiPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  // Use global adminMode from context
  const { adminMode } = useAuth();
  
  const [page, setPage] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editing State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<any>(null); // null means adding new
  const [formData, setFormData] = useState({ title: '', content: '', type: 'text', sort_order: 0 });

  // Additional Editing State for Arrays
  const [sectionImages, setSectionImages] = useState<string[]>([]);
  const [sectionDownloads, setSectionDownloads] = useState<{label: string, link: string}[]>([]);
  
  // Temporary inputs for adding items in modal
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newDownload, setNewDownload] = useState({ label: '', link: '' });

  // Deletion State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Timeout Reference to prevent infinite spinners
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    // If no ID is present, stop loading immediately
    if (!id) {
        setLoading(false);
        return;
    }

    fetchPageData(id, true);
    
    // Cleanup timeout on unmount or id change
    return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, [id]);

  // isBackground argument prevents the full page loader from showing during updates
  const fetchPageData = async (pageId: string, isInitialLoad = false) => {
    if (isInitialLoad) {
        setLoading(true);
        setError(null);
        
        // Set a timeout to prevent infinite loading if the network hangs or data is too large
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
             setLoading(false);
             setError("Loading timed out. The content might be too large or the connection is slow.");
        }, 10000); // 10 seconds max
    }

    try {
      const { data: pageData, error: pageError } = await supabase
        .from('wiki_pages')
        .select('*')
        .eq('id', pageId)
        .single();

      if (pageError || !pageData) {
        // Explicitly handle not found to stop spinner
        if (pageError?.code === 'PGRST116') {
             throw new Error('Page not found');
        }
        throw pageError || new Error('Page not found');
      }
      setPage(pageData);

      const { data: sectionsData, error: secError } = await supabase
        .from('wiki_sections')
        .select('*')
        .eq('page_id', pageId)
        .order('sort_order', { ascending: true });

      if (secError) throw secError;
      setSections(sectionsData || []);
      
      // Clear timeout if successful
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setError(null);

    } catch (err: any) {
      console.error("WikiPage Fetch Error:", err);
      setError(err.message || "Failed to load content.");
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  };

  const initiateDelete = (sectionId: string) => {
    setDeleteId(sectionId);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    
    const { error } = await supabase.from('wiki_sections').delete().eq('id', deleteId);
    if (error) {
      alert('Error deleting section');
    } else {
      setDeleteId(null);
      // Background refresh
      fetchPageData(id!, false);
    }
    setIsDeleting(false);
  };

  const openEditModal = (section: any) => {
    setEditingSection(section);
    let contentStr = section.content;
    
    // Convert array content back to string for textarea
    if (Array.isArray(section.content)) {
        contentStr = section.content.map((c: any) => typeof c === 'string' ? c : c.label).join('\n');
    }

    setFormData({
      title: section.title,
      content: contentStr,
      type: section.section_type || 'text',
      sort_order: section.sort_order
    });

    // Populate Images
    setSectionImages(section.images || []);

    // Populate Downloads (Merge legacy single field with new list)
    const dls = [];
    if (section.download_link) {
        dls.push({ label: section.download_label || 'Download File', link: section.download_link });
    }
    if (section.additional_downloads && Array.isArray(section.additional_downloads)) {
        dls.push(...section.additional_downloads);
    }
    setSectionDownloads(dls);

    // Reset temp inputs
    setNewImageUrl('');
    setNewDownload({ label: '', link: '' });

    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingSection(null);
    const maxSort = sections.length > 0 ? Math.max(...sections.map(s => s.sort_order)) : 0;
    setFormData({
      title: '',
      content: '',
      type: 'text',
      sort_order: maxSort + 1
    });
    setSectionImages([]);
    setSectionDownloads([]);
    setNewImageUrl('');
    setNewDownload({ label: '', link: '' });
    setIsModalOpen(true);
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
        setSectionImages([...sectionImages, newImageUrl.trim()]);
        setNewImageUrl('');
    }
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Warn if file is huge (approx 3MB limit recommendation)
    if (file.size > 3 * 1024 * 1024) {
        alert("Warning: This image is large (>3MB). It may slow down the page load. Please compress images before uploading.");
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
        const base64 = reader.result as string;
        setSectionImages([...sectionImages, base64]);
    };
    reader.readAsDataURL(file);
    // Reset input value so same file can be selected again if needed
    e.target.value = '';
  };

  const handleDeleteImage = (index: number) => {
    const newImages = [...sectionImages];
    newImages.splice(index, 1);
    setSectionImages(newImages);
  };

  const handleAddDownload = () => {
    if (newDownload.link.trim()) {
        const label = newDownload.label.trim() || 'Download File';
        setSectionDownloads([...sectionDownloads, { label, link: newDownload.link.trim() }]);
        setNewDownload({ label: '', link: '' });
    }
  };

  const handleDeleteDownload = (index: number) => {
    const newDownloads = [...sectionDownloads];
    newDownloads.splice(index, 1);
    setSectionDownloads(newDownloads);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Process content based on type
    let finalContent: any = formData.content;

    if (formData.type === 'list') {
      finalContent = formData.content.split('\n').filter(line => line.trim() !== '');
    }

    // Split downloads back into database columns
    const primaryDownload = sectionDownloads.length > 0 ? sectionDownloads[0] : null;
    const extraDownloads = sectionDownloads.length > 1 ? sectionDownloads.slice(1) : [];

    const payload = {
      page_id: id,
      title: formData.title,
      content: finalContent,
      section_type: formData.type,
      sort_order: formData.sort_order,
      images: sectionImages,
      download_link: primaryDownload?.link || null,
      download_label: primaryDownload?.label || null,
      additional_downloads: extraDownloads
    };

    try {
        if (editingSection) {
        // Update
        const { error } = await supabase
            .from('wiki_sections')
            .update(payload)
            .eq('id', editingSection.id);
        if (error) throw error;
        } else {
        // Insert
        const { error } = await supabase
            .from('wiki_sections')
            .insert(payload);
        if (error) throw error;
        }

        setIsModalOpen(false);
        // Background Refresh
        fetchPageData(id!, false);
    } catch (error: any) {
        alert('Error saving section: ' + error.message);
    } finally {
        setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <Loader2 className="animate-spin text-blue-500 mb-2" size={40} />
        <p>Loading content...</p>
      </div>
    );
  }

  // Improved Error / 404 UI
  if (error && !page) {
       return (
           <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 mt-4 mx-4">
               <div className="bg-red-50 p-4 rounded-full mb-4 text-red-500">
                  <AlertCircle size={48} />
               </div>
               <h2 className="text-2xl font-bold text-slate-800 mb-2">
                 {error === 'Page not found' ? 'Page Not Found' : 'Something went wrong'}
               </h2>
               <p className="text-slate-500 mb-6 max-w-md mx-auto">
                 {error === 'Page not found' 
                    ? "The content you are looking for doesn't exist or has been removed. Please check the database." 
                    : error}
               </p>
               <div className="flex gap-4 justify-center">
                   <Link to="/" className="px-5 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2">
                       <Home size={18} /> Dashboard
                   </Link>
                   <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                       <RefreshCw size={18} /> Retry
                   </button>
               </div>
           </div>
       );
  }

  if (!page) return <Navigate to="/" replace />;

  const PageIcon = getIcon(page.icon_name);

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn relative">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <span>Home</span>
        <ChevronRight size={14} />
        <span>Policy</span>
        <ChevronRight size={14} />
        <span className="font-medium text-slate-800">{page.title}</span>
      </div>

      {/* Page Header */}
      <div className="mb-8 border-b border-slate-200 pb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-blue-100 text-blue-700 p-3 rounded-xl shadow-sm border border-blue-200">
             <PageIcon size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">{page.title}</h1>
        </div>
        <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">{page.summary}</p>
      </div>
      
      {/* Error Banner for partial loads */}
      {error && (
         <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
                <AlertTriangle size={20} />
                <span>{error}</span>
            </div>
            <button onClick={() => fetchPageData(id!, false)} className="text-sm font-bold underline hover:text-red-800">Retry</button>
         </div>
      )}

      {/* Page Content */}
      <div className="space-y-8">
        {sections.map((section, index) => (
          <div key={section.id || index} className={`bg-white rounded-xl border shadow-sm overflow-hidden relative group ${adminMode ? 'border-blue-200 ring-1 ring-blue-100' : 'border-slate-200'}`}>
            
            {/* Admin Controls for Section - controlled by global adminMode */}
            {adminMode && (
              <div className="absolute top-3 right-3 flex gap-2 opacity-100 z-10">
                <button 
                  onClick={() => openEditModal(section)}
                  className="p-1.5 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
                  title="Edit Section"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => initiateDelete(section.id)}
                  className="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
                  title="Delete Section"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}

            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 pr-24">
              <h2 className="text-lg font-bold text-slate-800">{section.title}</h2>
            </div>

            <div className="p-6">
              {/* Content Renders */}
              {section.section_type === 'list' && Array.isArray(section.content) ? (
                <ul className="space-y-3">
                  {section.content.map((item: any, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-700">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2.5 flex-shrink-0"></span>
                      <span className="leading-relaxed">{typeof item === 'string' ? item : item.label}</span>
                    </li>
                  ))}
                </ul>
              ) : section.section_type === 'info' ? (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-4">
                  <Info className="text-blue-600 flex-shrink-0" size={24} />
                  <div className="text-blue-900 text-sm leading-relaxed">
                    {Array.isArray(section.content) ? (
                      <ul className="list-disc pl-4 space-y-1">{section.content.map((c: any, i: number) => <li key={i}>{typeof c === 'string' ? c : c.label}</li>)}</ul>
                    ) : section.content}
                  </div>
                </div>
              ) : section.section_type === 'warning' ? (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-4">
                  <AlertCircle className="text-amber-600 flex-shrink-0" size={24} />
                  <div className="text-amber-900 text-sm leading-relaxed font-medium">
                     {typeof section.content === 'string' ? section.content : 
                      Array.isArray(section.content) ? section.content.map((c: any) => typeof c === 'string' ? c : c.label).join(' ') : ''}
                  </div>
                </div>
              ) : (
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {typeof section.content === 'string' ? section.content : 
                     Array.isArray(section.content) ? section.content.map((c: any) => typeof c === 'string' ? c : c.label).join('\n') : ''}
                </p>
              )}
              
              {/* Images */}
              {section.images && section.images.length > 0 && (
                <div className="mt-6 space-y-4">
                  {section.images.map((img: string, idx: number) => (
                    <div key={idx} className="rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                      <img src={img} alt="content" className="w-full h-auto object-cover max-h-[400px]" loading="lazy" />
                    </div>
                  ))}
                </div>
              )}
              
              {/* Downloads */}
              {(section.download_link || (section.additional_downloads && section.additional_downloads.length > 0)) && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {section.download_link && (
                    <a href={section.download_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md">
                      <Download size={16} />
                      {section.download_label || 'Download File'}  
                    </a>
                  )}
                  {section.additional_downloads?.map((btn: any, i: number) => (
                    <a key={i} href={btn.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md">
                      <Download size={16} />
                      {btn.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Add Section Button - controlled by global adminMode */}
        {adminMode && (
          <button 
            onClick={openAddModal}
            className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-medium"
          >
            <Plus size={20} />
            Add New Section
          </button>
        )}
      </div>

      <div className="mt-12 mb-8 p-6 bg-slate-100 rounded-xl text-center">
        <p className="text-slate-500 text-sm">Always refer to the original Fixed Asset Policy and other documents for official audits.</p>
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slideUp">
            
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg text-slate-800">
                {editingSection ? 'Edit Section' : 'Add New Section'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
              
              {/* Basic Fields */}
              <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Section Title</label>
                    <input 
                    type="text" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Display Type</label>
                    <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                    <option value="text">Paragraph Text</option>
                    <option value="list">Bulleted List</option>
                    <option value="info">Info Box (Blue)</option>
                    <option value="warning">Warning Box (Orange)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                    Content {formData.type === 'list' && <span className="text-xs text-slate-500 font-normal">(One item per line)</span>}
                    </label>
                    <textarea 
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Sort Order</label>
                    <input 
                    type="number" 
                    value={formData.sort_order}
                    onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* IMAGES MANAGEMENT */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <ImageIcon size={16} /> Images
                </label>
                
                {/* Image List */}
                {sectionImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mb-3">
                        {sectionImages.map((img, idx) => (
                            <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                                <img src={img} alt="preview" className="w-full h-full object-cover" />
                                <button 
                                    onClick={() => handleDeleteImage(idx)}
                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Image Inputs */}
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Paste image URL..." 
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button 
                        onClick={handleAddImage}
                        type="button"
                        className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-medium text-sm"
                    >
                        Add URL
                    </button>
                    <label className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-medium text-sm cursor-pointer flex items-center gap-1">
                        <Upload size={14} /> File
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageFileUpload} />
                    </label>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* DOWNLOADS MANAGEMENT */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <LinkIcon size={16} /> Downloads / Links
                </label>

                {/* Downloads List */}
                {sectionDownloads.length > 0 && (
                    <div className="space-y-2 mb-3">
                        {sectionDownloads.map((dl, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Download size={14} className="text-green-600 shrink-0" />
                                    <div className="truncate">
                                        <span className="text-sm font-medium text-slate-800">{dl.label}</span>
                                        <span className="text-xs text-slate-400 ml-2 truncate">{dl.link}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDeleteDownload(idx)}
                                    className="text-slate-400 hover:text-red-500 p-1"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Download Inputs */}
                <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Label (e.g. Download Form)" 
                            value={newDownload.label}
                            onChange={(e) => setNewDownload({...newDownload, label: e.target.value})}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                         <input 
                            type="text" 
                            placeholder="URL (https://...)" 
                            value={newDownload.link}
                            onChange={(e) => setNewDownload({...newDownload, link: e.target.value})}
                            className="flex-[2] px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <button 
                        onClick={handleAddDownload}
                        type="button"
                        className="w-full py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium text-sm flex items-center justify-center gap-1"
                    >
                        <Plus size={14} /> Add Download Link
                    </button>
                </div>
              </div>

            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-slideUp">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Section?</h3>
              <p className="text-sm text-slate-600 mb-6">
                Are you sure you want to delete this section? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded-lg transition-colors shadow-md flex items-center gap-2"
                >
                  {isDeleting ? <Loader2 className="animate-spin" size={16} /> : null}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default WikiPage;