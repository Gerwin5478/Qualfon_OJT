
import { FileText, ExternalLink, History, Clock, User as UserIcon } from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Info, AlertCircle, ChevronRight, Download, Loader2, Edit2, Trash2, Plus, Save, X, AlertTriangle, Image as ImageIcon, Link as LinkIcon, Upload, RefreshCw, Home, ShieldCheck } from 'lucide-react';
import { getIcon } from '../lib/iconMap';
import { useAuth } from '../contexts/AuthContext';

interface EditHistoryRecord {
  id: string;
  user_name: string;
  user_email: string;
  action: string;
  created_at: string;
}

const WikiPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { adminMode, isAdmin, user } = useAuth();
  
  const [page, setPage] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [editHistory, setEditHistory] = useState<EditHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editing State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<any>(null); 
  const [formData, setFormData] = useState({ title: '', content: '', type: 'text', sort_order: 0 });

  const [sectionImages, setSectionImages] = useState<string[]>([]);
  const [sectionDownloads, setSectionDownloads] = useState<{label: string, link: string}[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newDownload, setNewDownload] = useState({ label: '', link: '' });

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const timeoutRef = useRef<any>(null);
  const isCurrentlyFetching = useRef(false);

  useEffect(() => {
    if (!id) {
        setLoading(false);
        return;
    }
    fetchPageData(id, true);
    return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
    }
  }, [id]);

  const recordEditHistory = async (action: string) => {
    if (!user || !id) return;
    try {
      const userName = user.user_metadata?.first_name 
        ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`
        : user.email;

      await supabase.from('wiki_edit_history').insert({
        page_id: id,
        user_email: user.email,
        user_name: userName,
        action: action
      });
      fetchEditHistory(id);
    } catch (err) {
      console.error("Failed to record history", err);
    }
  };

  const fetchEditHistory = async (pageId: string) => {
    try {
      let query = supabase
        .from('wiki_edit_history')
        .select('*')
        .eq('page_id', pageId)
        .order('created_at', { ascending: false });
      
      if (!isAdmin) {
        query = query.limit(5);
      } else {
        query = query.limit(100);
      }

      const { data } = await query;
      if (data) setEditHistory(data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const fetchPageData = async (pageId: string, isInitialLoad = false) => {
    if (isInitialLoad) {
        setLoading(true);
        setError(null);
        isCurrentlyFetching.current = true;
        
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        // Use a ref-based check to avoid stale closures in the timeout
        timeoutRef.current = setTimeout(() => {
             if (isCurrentlyFetching.current) {
               setLoading(false);
               setError("The connection is taking longer than expected. This usually happens if the database is waking up or the content has very large images. Try refreshing.");
               isCurrentlyFetching.current = false;
             }
        }, 15000); // 15 seconds is usually enough
    }

    try {
      const { data: pageData, error: pageError } = await supabase
        .from('wiki_pages')
        .select('*')
        .eq('id', pageId)
        .single();

      if (pageError || !pageData) {
        if (pageError?.code === 'PGRST116') throw new Error('Page not found');
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
      
      fetchEditHistory(pageId);
      setError(null);
    } catch (err: any) {
      console.error("WikiPage Fetch Error:", err);
      setError(err.message || "Failed to load content.");
    } finally {
      isCurrentlyFetching.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
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
      await recordEditHistory(`Deleted section: "${sections.find(s => s.id === deleteId)?.title || 'Untitled'}"`);
      setDeleteId(null);
      fetchPageData(id!, false);
    }
    setIsDeleting(false);
  };

  const openEditModal = (section: any) => {
    setEditingSection(section);
    let contentStr = section.content;
    if (Array.isArray(section.content)) {
        contentStr = section.content.map((c: any) => typeof c === 'string' ? c : c.label).join('\n');
    }

    setFormData({
      title: section.title,
      content: contentStr,
      type: section.section_type || 'text',
      sort_order: section.sort_order
    });

    setSectionImages(section.images || []);
    const dls = [];
    if (section.download_link) {
        dls.push({ label: section.download_label || 'Download File', link: section.download_link });
    }
    if (section.additional_downloads && Array.isArray(section.additional_downloads)) {
        dls.push(...section.additional_downloads);
    }
    setSectionDownloads(dls);
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
    if (file.size > 2 * 1024 * 1024) {
      alert("Error: This image is too large. Please use images smaller than 2MB to ensure the page loads quickly.");
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
        const base64 = reader.result as string;
        setSectionImages([...sectionImages, base64]);
    };
    reader.readAsDataURL(file);
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
    let finalContent: any = formData.content;
    if (formData.type === 'list') {
      finalContent = formData.content.split('\n').filter(line => line.trim() !== '');
    }

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
            const { error } = await supabase.from('wiki_sections').update(payload).eq('id', editingSection.id);
            if (error) throw error;
            await recordEditHistory(`Updated section: "${formData.title}"`);
        } else {
            const { error } = await supabase.from('wiki_sections').insert(payload);
            if (error) throw error;
            await recordEditHistory(`Added new section: "${formData.title}"`);
        }
        setIsModalOpen(false);
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
        <p>Fetching data from secure vault...</p>
      </div>
    );
  }

  if (error && !page) {
       return (
           <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 mt-4 mx-4">
               <div className="bg-red-50 p-4 rounded-full mb-4 text-red-500">
                  <AlertCircle size={48} />
               </div>
               <h2 className="text-2xl font-bold text-slate-800 mb-2">{error === 'Page not found' ? 'Entry Not Found' : 'Session/Sync Error'}</h2>
               <p className="text-slate-500 mb-6 max-w-md mx-auto">{error === 'Page not found' ? "The requested policy page does not exist or has been moved." : error}</p>
               <div className="flex gap-4 justify-center">
                   <Link to="/" className="px-5 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"><Home size={18} /> Back to Dashboard</Link>
                   <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"><RefreshCw size={18} /> Refresh Session</button>
               </div>
           </div>
       );
  }

  if (!page) return <Navigate to="/" replace />;
  const PageIcon = getIcon(page.icon_name);

  const displayHistory = isAdmin ? editHistory : editHistory.slice(0, 1);

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn relative pb-20">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <span>Home</span><ChevronRight size={14} /><span>Policy</span><ChevronRight size={14} /><span className="font-medium text-slate-800">{page.title}</span>
      </div>

      {page.based_on_policy_title && (
        <div className="sticky top-0 z-40 -mt-2 mb-8 animate-slideDown">
          <div className="bg-blue-600 border border-blue-700 rounded-xl p-4 flex items-center justify-between shadow-xl text-white">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm"><ShieldCheck size={24} /></div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-blue-100 uppercase tracking-widest">Verified Content</span>
                <span className="text-sm font-bold">{page.based_on_policy_title}</span>
              </div>
            </div>
            {page.based_on_policy_url && (
              <a href={page.based_on_policy_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold bg-white text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50 transition-all shadow-md">View Document <ExternalLink size={14} /></a>
            )}
          </div>
          <div className="absolute inset-0 -z-10 bg-slate-50 opacity-100 rounded-xl"></div>
        </div>
      )}

      <div className="mb-8 border-b border-slate-200 pb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-blue-100 text-blue-700 p-3 rounded-xl shadow-sm border border-blue-200"><PageIcon size={32} /></div>
          <h1 className="text-3xl font-bold text-slate-900">{page.title}</h1>
        </div>
        <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">{page.summary}</p>
      </div>
      
      <div className="space-y-8">
        {sections.map((section, index) => (
          <div key={section.id || index} className={`bg-white rounded-xl border shadow-sm overflow-hidden relative group ${adminMode ? 'border-blue-200 ring-1 ring-blue-100' : 'border-slate-200'}`}>
            {adminMode && (
              <div className="absolute top-3 right-3 flex gap-2 opacity-100 z-10">
                <button onClick={() => openEditModal(section)} className="p-1.5 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200" title="Edit Section"><Edit2 size={16} /></button>
                <button onClick={() => initiateDelete(section.id)} className="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200" title="Delete Section"><Trash2 size={16} /></button>
              </div>
            )}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 pr-24"><h2 className="text-lg font-bold text-slate-800">{section.title}</h2></div>
            <div className="p-6">
              {section.section_type === 'list' && Array.isArray(section.content) ? (
                <ul className="space-y-3">{section.content.map((item: any, idx: number) => (<li key={idx} className="flex items-start gap-3 text-slate-700"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2.5 shrink-0"></span><span className="leading-relaxed">{typeof item === 'string' ? item : item.label}</span></li>))}</ul>
              ) : section.section_type === 'info' ? (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-4"><Info className="text-blue-600 shrink-0" size={24} /><div className="text-blue-900 text-sm leading-relaxed">{Array.isArray(section.content) ? (<ul className="list-disc pl-4 space-y-1">{section.content.map((c: any, i: number) => <li key={i}>{typeof c === 'string' ? c : c.label}</li>)}</ul>) : section.content}</div></div>
              ) : section.section_type === 'warning' ? (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-4"><AlertCircle className="text-amber-600 shrink-0" size={24} /><div className="text-amber-900 text-sm leading-relaxed font-medium">{typeof section.content === 'string' ? section.content : Array.isArray(section.content) ? section.content.map((c: any) => typeof c === 'string' ? c : c.label).join(' ') : ''}</div></div>
              ) : (<p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{typeof section.content === 'string' ? section.content : Array.isArray(section.content) ? section.content.map((c: any) => typeof c === 'string' ? c : c.label).join('\n') : ''}</p>)}
              {section.images && section.images.length > 0 && (<div className="mt-6 space-y-4">{section.images.map((img: string, idx: number) => (<div key={idx} className="rounded-lg overflow-hidden border border-slate-200 shadow-sm"><img src={img} alt="content" className="w-full h-auto object-cover max-h-[400px]" loading="lazy" /></div>))}</div>)}
              {(section.download_link || (section.additional_downloads && section.additional_downloads.length > 0)) && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {section.download_link && (<a href={section.download_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md"><Download size={16} />{section.download_label || 'Download File'}</a>)}
                  {section.additional_downloads?.map((btn: any, i: number) => (<a key={i} href={btn.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md"><Download size={16} />{btn.label}</a>))}
                </div>
              )}
            </div>
          </div>
        ))}
        {adminMode && (
          <button onClick={openAddModal} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-medium"><Plus size={20} /> Add New Section</button>
        )}
      </div>

      <div className="mt-12 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-3">
            <History className="text-slate-400" size={24} />
            <h3 className="text-xl font-bold text-slate-800">Revision History</h3>
          </div>
          {!isAdmin && editHistory.length > 0 && (
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Latest Update Only</span>
          )}
        </div>
        
        {displayHistory.length > 0 ? (
          <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${isAdmin ? 'max-h-[210px] overflow-y-auto custom-scrollbar' : ''}`}>
            <div className="divide-y divide-slate-100">
              {displayHistory.map((entry) => (
                <div key={entry.id} className="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 shrink-0">
                    <UserIcon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900 truncate">{entry.user_name}</p>
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 shrink-0">
                        <Clock size={10} />
                        {new Date(entry.created_at).toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{entry.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-400">No edit history recorded for this page yet.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slideUp">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg text-slate-800">{editingSection ? 'Edit Section' : 'Add New Section'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Section Title</label><input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Display Type</label><select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"><option value="text">Paragraph Text</option><option value="list">Bulleted List</option><option value="info">Info Box (Blue)</option><option value="warning">Warning Box (Orange)</option></select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Content {formData.type === 'list' && <span className="text-xs text-slate-500 font-normal">(One item per line)</span>}</label><textarea value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Sort Order</label><input type="number" value={formData.sort_order} onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              </div>
              <hr className="border-slate-100" />
              <div className="space-y-3"><label className="flex items-center gap-2 text-sm font-bold text-slate-700"><ImageIcon size={16} /> Images</label>{sectionImages.length > 0 && (<div className="grid grid-cols-3 gap-3 mb-3">{sectionImages.map((img, idx) => (<div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-100"><img src={img} alt="preview" className="w-full h-full object-cover" /><button onClick={() => handleDeleteImage(idx)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button></div>))}</div>)}<div className="flex gap-2"><input type="text" placeholder="Paste image URL..." value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" /><button onClick={handleAddImage} type="button" className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-medium text-sm">Add URL</button><label className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-medium text-sm cursor-pointer flex items-center gap-1"><Upload size={14} /> File<input type="file" className="hidden" accept="image/*" onChange={handleImageFileUpload} /></label></div></div>
              <hr className="border-slate-100" />
              <div className="space-y-3"><label className="flex items-center gap-2 text-sm font-bold text-slate-700"><LinkIcon size={16} /> Downloads / Links</label>{sectionDownloads.length > 0 && (<div className="space-y-2 mb-3">{sectionDownloads.map((dl, idx) => (<div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200"><div className="flex items-center gap-2 overflow-hidden"><Download size={14} className="text-green-600 shrink-0" /><div className="truncate"><span className="text-sm font-medium text-slate-800">{dl.label}</span><span className="text-xs text-slate-400 ml-2 truncate">{dl.link}</span></div></div><button onClick={() => handleDeleteDownload(idx)} className="text-slate-400 hover:text-red-500 p-1"><X size={14} /></button></div>))}</div>)}<div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100"><div className="flex gap-2"><input type="text" placeholder="Label" value={newDownload.label} onChange={(e) => setNewDownload({...newDownload, label: e.target.value})} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm" /><input type="text" placeholder="URL" value={newDownload.link} onChange={(e) => setNewDownload({...newDownload, link: e.target.value})} className="flex-[2] px-3 py-2 border border-slate-300 rounded-lg text-sm" /></div><button onClick={handleAddDownload} type="button" className="w-full py-2 bg-blue-100 text-blue-700 rounded-lg text-sm flex items-center justify-center gap-1"><Plus size={14} /> Add Download Link</button></div></div>
            </div>
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0"><button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg" disabled={isSaving}>Cancel</button><button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg flex items-center gap-2 disabled:opacity-70">{isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}Save Changes</button></div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-slideUp">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={24} /></div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Section?</h3>
              <p className="text-sm text-slate-600 mb-6">Are you sure you want to delete this section? This action cannot be undone.</p>
              <div className="flex gap-3 justify-center"><button onClick={() => setDeleteId(null)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg" disabled={isDeleting}>Cancel</button><button onClick={confirmDelete} disabled={isDeleting} className="px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded-lg shadow-md flex items-center gap-2">{isDeleting ? <Loader2 className="animate-spin" size={16} /> : null}Delete</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WikiPage;
