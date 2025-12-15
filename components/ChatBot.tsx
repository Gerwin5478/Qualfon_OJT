import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MessageSquare, X, Send, MinusCircle, Loader2, Sparkles } from 'lucide-react';
import { wikiContent } from '../data/wikiContent';
import { policyDocumentText } from '../data/policyDocument';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'welcome', 
      role: 'model', 
      text: 'Hello! I am your Facilities Assistant. Ask me about **Housekeeping SOPs**, **Maintenance Checklists**, or the **FD-06 Asset Policy**.' 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Helper to parse bold text (Markdown style **text**)
  const formatMessage = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-blue-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Prepare context
  const generateContext = () => {
    // 1. Full Content from Wiki Pages (The App itself)
    // This ensures Housekeeping, Maintenance, and SOPs are fully visible to the bot
    const websiteContent = wikiContent.map(page => {
      const sectionsText = page.sections.map(section => {
        let contentStr = '';
        if (typeof section.content === 'string') {
          contentStr = section.content;
        } else if (Array.isArray(section.content)) {
          // Handle string arrays or TableItems
          contentStr = section.content.map(item => {
             if (typeof item === 'string') return `- ${item}`;
             return `- ${item.label}`; 
          }).join('\n');
        }
        return `### ${section.title}\n${contentStr}`;
      }).join('\n\n');

      return `PAGE: ${page.title} (Category: ${page.category || 'General'})\nSUMMARY: ${page.summary}\nCONTENT:\n${sectionsText}`;
    }).join('\n\n-----------------------------------\n\n');

    // 2. Full Policy Text
    return `
    WEBSITE KNOWLEDGE BASE (APP SOPs & CHECKLISTS):
    ${websiteContent}

    OFFICIAL FIXED ASSET POLICY DOCUMENT (FD-06):
    ${policyDocumentText}
    `;
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    setInputValue('');
    
    // Add user message
    const newMessage: Message = { id: Date.now().toString(), role: 'user', text: userText };
    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
      // Initialize Gemini
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const contextData = generateContext();
      
      const systemInstruction = `You are a helpful Facilities & Security assistant for Qualfon.
      
      SOURCE MATERIAL:
      1. **WEBSITE KNOWLEDGE BASE**: This is the "App Itself". It contains **Housekeeping SOPs** (Daily/Night Shift), **Maintenance Checklists** (UPS, Weekly, Monthly), and general safety info.
      2. **OFFICIAL FIXED ASSET POLICY (FD-06)**: Contains formal policies for asset tagging, disposal, and forms.

      INSTRUCTIONS:
      - **Housekeeping/Maintenance/Safety**: If asked about these topics, strictly use the "WEBSITE KNOWLEDGE BASE". Quote the specific tasks (e.g., "Clean the floor", "Check battery terminal").
      - **Asset Policy**: If asked about assets, use the FD-06 Policy text.
      - **General**: If the answer is not in the context, say you don't have that information.

      FORMATTING RULES:
      1. **Bold** key details (e.g. **Daily Tasks**, **Weekly**, **Php 50,000**, Form Names).
      2. Use Bullet Points for checklists and steps.
      3. Keep paragraphs short and readable.
      
      CONTEXT DATA:
      ${contextData}`;

      const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: systemInstruction,
        }
      });

      const result = await chat.sendMessage({ message: userText });
      const responseText = result.text;

      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: responseText || "I'm sorry, I couldn't generate a response." 
      }]);

    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: "I'm having trouble connecting to the server. Please check your connection or try again later." 
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
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[350px] md:w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fadeIn ring-1 ring-slate-900/5">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-800 p-4 flex items-center justify-between text-white shadow-md">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Asset Wiki Assistant</h3>
                <p className="text-[10px] text-blue-200">Powered by Gemini AI</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                <MinusCircle size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {formatMessage(msg.text)}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-blue-600" />
                  <span className="text-xs text-slate-500">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-200">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about SOPs or Policy..."
                className="w-full pl-4 pr-12 py-3 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder:text-slate-400"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send size={16} />
              </button>
            </div>
            <div className="text-center mt-2">
              <p className="text-[10px] text-slate-400">AI can make mistakes. Verify important info.</p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`shadow-lg transition-all duration-300 ${
          isOpen 
            ? 'bg-slate-700 rotate-90 scale-90' 
            : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 animate-bounce-subtle'
        } text-white p-4 rounded-full flex items-center justify-center`}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
};

export default ChatBot;