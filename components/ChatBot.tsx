
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MessageSquare, X, Send, MinusCircle, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { policyDocumentText } from '../data/policyDocument';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  suggestedPageId?: string;
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'welcome', 
      role: 'model', 
      text: 'Hello! I am your Qualfon Assistant. How can I help you with policies or procedures today?' 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [wikiContext, setWikiContext] = useState('');
  const [formsContext, setFormsContext] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isContextLoaded = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && !isContextLoaded.current) {
      fetchContext();
    }
  }, [isOpen]);

  const fetchContext = async () => {
    try {
      const [pagesRes, sectionsRes, formsRes] = await Promise.all([
        supabase.from('wiki_pages').select('*'),
        supabase.from('wiki_sections').select('*'),
        supabase.from('forms').select('*')
      ]);

      const pages = pagesRes.data || [];
      const sections = sectionsRes.data || [];
      const forms = formsRes.data || [];

      const websiteContent = pages.map(page => {
        const pageSections = sections
          .filter(s => s.page_id === page.id)
          .sort((a, b) => a.sort_order - b.sort_order);
        
        const sectionsText = pageSections.map(section => {
          let contentStr = '';
          if (typeof section.content === 'string') {
            contentStr = section.content;
          } else if (Array.isArray(section.content)) {
            contentStr = section.content.map((item: any) => typeof item === 'string' ? `- ${item}` : `- ${item.label || item}`).join('\n');
          }
          return `### ${section.title}\n${contentStr}`;
        }).join('\n\n');
  
        return `ID: ${page.id} | PAGE: ${page.title}\nSUMMARY: ${page.summary}\nCONTENT:\n${sectionsText}`;
      }).join('\n\n---\n\n');

      const formsList = forms.map((f: any) => 
        `FORM: ${f.title} | URL: ${f.url} | CAT: ${f.category}`
      ).join('\n');

      setWikiContext(websiteContent);
      setFormsContext(formsList);
      isContextLoaded.current = true;
    } catch (err) {
      console.error("Failed to fetch chatbot context", err);
    }
  };

  const formatMessage = (text: string) => {
    let formattedText = text.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g, 
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline font-semibold">$1</a>'
    );

    const parts = formattedText.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      if (part.includes('<a href')) {
         return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
      }
      return part;
    });
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    setInputValue('');
    
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const systemInstruction = `You are a helpful assistant for Qualfon Facilities and Security.
      
      STRICT RULES:
      1. Keep answers VERY SHORT and direct (max 2-3 sentences). 
      2. If the user asks for steps or specific procedure details, provide a high-level summary.
      3. MANDATORY: Look through the PROVIDED WIKI PAGES and identify the most relevant page ID.
      4. If a relevant page exists, end your response with exactly: [WIKI_ID:page_id_here].
      5. Use ONLY the provided context. If unknown, state clearly and briefly.

      CONTEXT:
      ${wikiContext}
      FORMS:
      ${formsContext}
      POLICIES:
      ${policyDocumentText}`;

      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.2,
        }
      });

      const result = await chat.sendMessage({ message: userText });
      const rawResponse = result.text || "";

      // Parse the special tag [WIKI_ID:...]
      const wikiMatch = rawResponse.match(/\[WIKI_ID:([^\]]+)\]/);
      const pageId = wikiMatch ? wikiMatch[1].trim() : undefined;
      const cleanText = rawResponse.replace(/\[WIKI_ID:[^\]]+\]/, '').trim();

      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: cleanText || "I'm sorry, I couldn't find information on that.",
        suggestedPageId: pageId
      }]);

    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: "Connection error. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {isOpen && (
        <div className="mb-4 w-[350px] md:w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fadeIn ring-1 ring-slate-900/5">
          <div className="bg-gradient-to-r from-blue-700 to-blue-800 p-4 flex items-center justify-between text-white shadow-md">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Qualfon AI</h3>
                <p className="text-[10px] text-blue-200">Assistant</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
              <MinusCircle size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {formatMessage(msg.text)}
                  </div>
                </div>
                {msg.role === 'model' && msg.suggestedPageId && (
                  <button 
                    onClick={() => {
                      navigate(`/policy/${msg.suggestedPageId}`);
                      setIsOpen(false);
                    }}
                    className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-200 text-blue-700 text-xs font-bold rounded-full hover:bg-blue-50 transition-all shadow-sm group"
                  >
                    View Procedure Details <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-blue-600" />
                  <span className="text-xs text-slate-500">Searching wiki...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-slate-200">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about steps or SOPs..."
                className="w-full pl-4 pr-12 py-3 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`shadow-lg transition-all duration-300 ${
          isOpen ? 'bg-slate-700 rotate-90 scale-90' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
        } text-white p-4 rounded-full flex items-center justify-center`}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
};

export default ChatBot;
