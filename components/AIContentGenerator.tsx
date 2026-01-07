
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  FileUp, Loader2, Sparkles, X, ChevronRight, 
  Save, AlertCircle, Layout, BookOpen, Tag, Info, ListChecks, 
  ArrowRight, Plus, FolderPlus
} from 'lucide-react';
import { iconMap } from '../lib/iconMap';

interface AIContentGeneratorProps {
  onClose: () => void;
  onSuccess: () => void;
  categories: string[];
}

interface ProcessedSection {
  title: string;
  content: string | string[];
  type: 'text' | 'list' | 'info' | 'warning';
}

interface ProcessedPolicy {
  title: string;
  summary: string;
  sections: ProcessedSection[];
}

const AIContentGenerator: React.FC<AIContentGeneratorProps> = ({ onClose, onSuccess, categories }) => {
  const { user, profile } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1); 
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [processedData, setProcessedData] = useState<ProcessedPolicy | null>(null);
  
  const [finalConfig, setFinalConfig] = useState({
    pageId: '',
    category: categories[0] || 'General',
    newCategory: '',
    iconName: 'FileText'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processWithAI = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    try {
      const base64Data = await readFileAsBase64(file);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `Act as an expert technical writer for Facilities and Security. 
      Read this document and convert it into a structured wiki page.
      Organize it into logical sections. 
      IMPORTANT: Return ONLY valid JSON. No markdown backticks.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: file.type || 'application/pdf' } },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.STRING, description: "Content text. For lists, use newlines." },
                    type: { type: Type.STRING, enum: ["text", "list", "info", "warning"] }
                  },
                  required: ["title", "content", "type"]
                }
              }
            },
            required: ["title", "summary", "sections"]
          }
        }
      });

      let textResponse = response.text || "{}";
      // Clean potential markdown backticks if AI ignores schema rules
      textResponse = textResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      
      const rawJson = JSON.parse(textResponse);
      
      const cleanedSections = (rawJson.sections || []).map((s: any) => {
        if (s.type === 'list' && typeof s.content === 'string') {
          return {
            ...s,
            content: s.content.split('\n').map((item: string) => item.trim().replace(/^[-•*]\s*/, '')).filter((l: string) => l.length > 0)
          };
        }
        return s;
      });

      setProcessedData({ ...rawJson, sections: cleanedSections });
      setFinalConfig(prev => ({
        ...prev,
        pageId: rawJson.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      }));
      setStep(2);
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      setError("Failed to parse document. The AI response was invalid. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToWiki = async () => {
    if (!processedData || !finalConfig.pageId) return;
    setIsProcessing(true);
    setError(null);

    try {
      const category = finalConfig.newCategory || finalConfig.category;
      
      const { error: pageError } = await supabase.from('wiki_pages').insert({
        id: finalConfig.pageId,
        title: processedData.title,
        summary: processedData.summary,
        category: category,
        icon_name: finalConfig.iconName,
        sort_order: 100,
        based_on_policy_title: "AI Generated SOP"
      });

      if (pageError) {
        if (pageError.code === '23505') throw new Error(`A page with ID "${finalConfig.pageId}" already exists.`);
        throw pageError;
      }

      const sectionsPayload = processedData.sections.map((s, idx) => ({
        page_id: finalConfig.pageId,
        title: s.title,
        content: s.content,
        section_type: s.type,
        sort_order: idx + 1
      }));

      const { error: sectionError } = await supabase.from('wiki_sections').insert(sectionsPayload);
      if (sectionError) throw sectionError;

      if (finalConfig.newCategory) {
        await supabase.from('wiki_categories').upsert({ title: finalConfig.newCategory }, { onConflict: 'title' });
      }

      if (user) {
        const userName = profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : user.email;
        await supabase.from('wiki_edit_history').insert({
          page_id: finalConfig.pageId,
          user_email: user.email,
          user_name: userName,
          action: "Architected via AI"
        });
      }

      onSuccess();
    } catch (err: any) {
      console.error("Database Save Error:", err);
      setError(err.message || "Failed to save to database. Check your table permissions.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-slideUp">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 text-purple-600 p-2 rounded-lg"><Sparkles size={24} /></div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">AI Policy Architect</h3>
              <p className="text-xs text-slate-500">Document to Structured Wiki</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200" disabled={isProcessing}><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30 custom-scrollbar">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-red-700 text-sm animate-fadeIn">
              <AlertCircle size={20} className="shrink-0" />
              <div><p className="font-bold">Error</p><p>{error}</p></div>
            </div>
          )}
          
          {step === 1 && (
            <div className="max-w-md mx-auto space-y-6 py-10">
              <div 
                onClick={() => !isProcessing && fileInputRef.current?.click()} 
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${file ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-purple-400 hover:bg-purple-50/30'} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.txt" />
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${file ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}><FileUp size={32} /></div>
                {file ? (<div><p className="font-bold text-slate-800">{file.name}</p></div>) : (<div><p className="font-bold text-slate-800">Select Document</p><p className="text-xs text-slate-500 mt-1">PDF or Text</p></div>)}
              </div>
              <button disabled={!file || isProcessing} onClick={processWithAI} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 group">
                {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                {isProcessing ? 'Analyzing...' : 'Generate Wiki Draft'}
              </button>
            </div>
          )}

          {step === 2 && processedData && (
            <div className="space-y-8 animate-fadeIn">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <input type="text" value={processedData.title} onChange={(e) => setProcessedData({...processedData, title: e.target.value})} className="text-2xl font-bold text-slate-800 w-full bg-transparent border-none focus:ring-0 p-0" />
                <textarea value={processedData.summary} onChange={(e) => setProcessedData({...processedData, summary: e.target.value})} className="text-slate-500 w-full bg-transparent border-none focus:ring-0 p-0 mt-2 h-16 resize-none" />
              </div>

              <div className="space-y-4">
                {processedData.sections.map((section, sIdx) => (
                  <div key={sIdx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm p-4">
                    <div className="flex justify-between mb-2">
                      <input value={section.title} onChange={(e) => { const newSections = [...processedData.sections]; newSections[sIdx].title = e.target.value; setProcessedData({...processedData, sections: newSections}); }} className="text-xs font-bold text-slate-500 uppercase bg-transparent border-none focus:ring-0 p-0" />
                    </div>
                    <textarea 
                      value={Array.isArray(section.content) ? section.content.join('\n') : section.content} 
                      onChange={(e) => { 
                        const newSections = [...processedData.sections]; 
                        newSections[sIdx].content = section.type === 'list' ? e.target.value.split('\n') : e.target.value; 
                        setProcessedData({...processedData, sections: newSections}); 
                      }} 
                      className="w-full text-sm text-slate-700 bg-transparent border-none focus:ring-0 p-0 min-h-[60px]" 
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-6">
                <button onClick={() => setStep(1)} className="text-slate-500 text-sm hover:underline">Restart</button>
                <button onClick={() => setStep(3)} className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">Finalize <ArrowRight size={18} /></button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-md mx-auto space-y-6 py-4 animate-fadeIn">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">URL ID</label>
                  <input type="text" value={finalConfig.pageId} onChange={(e) => setFinalConfig({...finalConfig, pageId: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                  <select value={finalConfig.category} onChange={(e) => setFinalConfig({...finalConfig, category: e.target.value, newCategory: ''})} className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="NEW">+ New Category</option>
                  </select>
                  {finalConfig.category === 'NEW' && (
                    <input type="text" placeholder="Name..." value={finalConfig.newCategory} onChange={(e) => setFinalConfig({...finalConfig, newCategory: e.target.value})} className="w-full mt-2 px-4 py-2 border border-purple-200 rounded-lg text-sm" />
                  )}
                </div>
              </div>
              <button onClick={handleSaveToWiki} disabled={isProcessing} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2">
                {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} 
                Publish to Wiki
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIContentGenerator;
