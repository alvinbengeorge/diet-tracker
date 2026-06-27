'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Send, Bot, User, Loader2, RefreshCw, MessageSquare } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export default function Chatbot({ refreshLogsTrigger, onDataUpdated }: { refreshLogsTrigger: number; onDataUpdated?: () => void }) {
  const { fetchWithAuth } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch chat history on mount
  useEffect(() => {
    async function fetchChat() {
      try {
        const res = await fetchWithAuth('/api/chat');
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error('Error fetching chat history:', err);
      } finally {
        setLoadingHistory(false);
      }
    }
    fetchChat();
  }, [fetchWithAuth]);

  // Scroll on message updates
  useEffect(() => {
    scrollToBottom();
  }, [messages, submitting]);

  // Refresh context reminder if logs are updated
  useEffect(() => {
    if (messages.length > 0) {
      // Add a system notice that context is refreshed (local only, not saved)
      // Just lets the user know the AI has their latest logs.
    }
  }, [refreshLogsTrigger]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || submitting) return;

    const userText = input.trim();
    setInput('');
    
    // Add user message locally
    const userMsg: ChatMessage = {
      role: 'user',
      content: userText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setSubmitting(true);

    try {
      const res = await fetchWithAuth('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      if (data.dataUpdated && onDataUpdated) {
        onDataUpdated();
      }
    } catch (err) {
      console.error(err);
      // Add error feedback
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: 'Oops, I encountered an issue sending your message. Please check your Gemini connection or API key settings.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear all chat history?')) return;
    try {
      const res = await fetchWithAuth('/api/chat', { method: 'DELETE' });
      if (res.ok) {
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to clear chat:', err);
    }
  };

  const parseMarkdown = (text: string) => {
    return text.split('\n').map((line, idx) => {
      const parseInline = (str: string) => {
        const parts = [];
        const boldRegex = /\*\*(.*?)\*\*/g;
        let match;
        let lastIdx = 0;

        while ((match = boldRegex.exec(str)) !== null) {
          parts.push(str.substring(lastIdx, match.index));
          parts.push(<strong key={match.index} className="font-bold text-red-400">{match[1]}</strong>);
          lastIdx = boldRegex.lastIndex;
        }
        parts.push(str.substring(lastIdx));
        return parts;
      };

      if (line.startsWith('### ')) {
        return <h4 key={idx} className="font-bold text-red-400 mt-2 mb-1 text-sm sm:text-base">{parseInline(line.replace('### ', ''))}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="font-extrabold text-red-300 mt-3 mb-1.5 text-base sm:text-lg">{parseInline(line.replace('## ', ''))}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={idx} className="font-black text-white mt-4 mb-2 text-lg sm:text-xl">{parseInline(line.replace('# ', ''))}</h2>;
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return <li key={idx} className="ml-4 list-disc text-slate-300 my-0.5">{parseInline(line.substring(2))}</li>;
      }
      return <p key={idx} className="my-1 text-slate-200 min-h-[1em]">{parseInline(line)}</p>;
    });
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm h-full flex flex-col justify-between overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-4 py-3 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-red-400" />
          <span className="font-semibold text-white">Gemini Fitness Coach</span>
        </div>
        <button
          onClick={handleClearHistory}
          title="Clear History"
          className="p-1.5 rounded-lg border border-slate-800 hover:border-red-900/40 text-slate-400 hover:text-red-400 bg-slate-950/20 transition-all duration-200"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
        {loadingHistory ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 text-red-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col h-full items-center justify-center text-slate-500 gap-2">
            <Bot className="h-10 w-10 text-red-400/50" />
            <p className="text-sm">Ask me about meal planning, workouts, or calorie counts!</p>
            <p className="text-xs text-slate-600">I am aware of your logs logged today.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div key={index} className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border ${
                  isUser
                    ? 'bg-slate-900 border-slate-800 text-red-400'
                    : 'bg-red-950/40 border-red-900/40 text-red-400'
                }`}>
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-slate-800 text-white rounded-tr-none'
                    : 'bg-slate-900/80 text-slate-200 border border-slate-800/80 rounded-tl-none'
                }`}>
                  {isUser ? msg.content : parseMarkdown(msg.content)}
                </div>
              </div>
            );
          })
        )}

        {submitting && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 border bg-red-950/40 border-red-900/40 text-red-400">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl px-4 py-2.5 bg-slate-900/80 text-slate-400 border border-slate-800/80 rounded-tl-none flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="border-t border-slate-800 bg-slate-900/50 p-3 shrink-0 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask FitAI anything..."
          className="flex-1 rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none placeholder-slate-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || submitting}
          className="rounded-xl bg-red-500 hover:bg-red-400 active:bg-red-600 p-2.5 text-slate-950 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
