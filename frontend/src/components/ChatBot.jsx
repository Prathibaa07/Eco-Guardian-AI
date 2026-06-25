import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, X, Send, Leaf, Sparkles, AlertCircle } from 'lucide-react';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hello! I am **EcoBot**, your IBM Granite & Gemini-powered sustainability assistant. 🌍\n\nAsk me anything about waste recycling, water conservation, reporting environmental hazards, or how you can earn community points and rewards!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickQuestions = [
    "How to recycle E-Waste?",
    "How to earn Green Points?",
    "What can I do about a water leak?",
    "Tips to reduce plastic usage"
  ];

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    if (!textToSend) setInput('');

    // Add user message
    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Map history to backend expected structure
      const chatHistory = messages.map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await axios.post('/api/ecobot/chat', {
        message: text,
        chat_history: chatHistory
      });

      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: res.data.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      const errMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: "I'm having trouble connecting to the eco network. Please check your network connection and try again.",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Convert markdown-like syntax to HTML safely
  const formatText = (text) => {
    if (!text) return '';
    // Format bolding **text** -> <strong>text</strong>
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Format bullet points - item -> <li>item</li>
    formatted = formatted.replace(/^\s*-\s+(.*?)$/gm, '<li class="ml-4 list-disc">$1</li>');
    // Headers ### title -> <h3 class="font-bold text-sm mt-2 text-brand-400">title</h3>
    formatted = formatted.replace(/^### (.*?)$/gm, '<h3 class="font-bold text-sm mt-2 mb-1 text-brand-400">$1</h3>');
    // Line breaks
    formatted = formatted.split('\n').join('<br />');
    return formatted;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Expanded Chat Box */}
      {isOpen && (
        <div className="w-[350px] sm:w-[400px] h-[550px] bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl flex flex-col mb-4 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
                <Leaf className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-display font-bold text-slate-200 flex items-center gap-1.5 text-sm">
                  EcoBot Assistant
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-brand-400 border border-brand-500/20 text-[9px] font-semibold uppercase">
                    AI Active
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">Ask about environmental management</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/40">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex gap-2.5 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 shrink-0 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-brand-400 text-xs">
                    🤖
                  </div>
                )}
                
                <div className="flex flex-col">
                  <div 
                    className={`p-3 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === 'user' 
                        ? 'bg-brand-500 text-slate-950 font-medium rounded-tr-none' 
                        : msg.isError 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20 rounded-tl-none flex items-start gap-1.5'
                          : 'bg-slate-900 text-slate-350 border border-slate-800 rounded-tl-none'
                    }`}
                  >
                    {msg.isError && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                    <span 
                      dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
                    />
                  </div>
                  <span className={`text-[9px] text-slate-500 mt-1 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 max-w-[85%]">
                <div className="w-7 h-7 shrink-0 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-brand-400 text-xs">
                  🤖
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-3 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions (only visible if chat history is short or user is idle) */}
          <div className="px-4 py-2 border-t border-slate-900 bg-slate-900/30 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={loading}
                className="text-[11px] bg-slate-900 border border-slate-800 hover:border-brand-500/30 hover:bg-brand-500/5 text-slate-300 hover:text-white px-2.5 py-1 rounded-full transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3 text-brand-400" />
                {q}
              </button>
            ))}
          </div>

          {/* Footer Input */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={loading}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500/50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-800 disabled:text-slate-650 text-slate-950 rounded-xl transition-all active:scale-95 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-brand-500 text-slate-950 shadow-lg shadow-brand-500/30 flex items-center justify-center hover:scale-105 active:scale-95 hover:bg-brand-400 hover:shadow-brand-500/40 transition-all duration-300 border border-white/15"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

    </div>
  );
};

export default ChatBot;
