'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Send, LogOut, MessageSquare, Plus, Sparkles, User, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { saveChat, getChat, getAllChats } from '@/lib/db';
import DOMPurify from 'isomorphic-dompurify';
import FerrariCanvas from './components/FerrariCanvas';

function getMessageText(message: { parts?: Array<{ type: string; text?: string }> } | string | any) {
  // Simple fallback for content in ai sdk
  if (typeof message === 'string') return message;
  if (message.content) return message.content;
  return (message.parts ?? [])
    .filter((part: any) => part.type === 'text' && typeof part.text === 'string')
    .map((part: any) => part.text ?? '')
    .join('')
    .trim();
}

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated, username, role, logout } = useAuthStore();
  const isGuest = role !== 'admin';
  const [isHydrated, setIsHydrated] = useState(false);
  const [guestNotice, setGuestNotice] = useState('');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [sidebarChats, setSidebarChats] = useState<any[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [input, setInput] = useState('');

  const transport = React.useMemo(() => new DefaultChatTransport({ api: '/api/chat' }), []);

  const { messages, setMessages, sendMessage, status, error } = useChat({
    transport,
    id: currentChatId,
    onFinish: ({ message, messages: newMessages }) => {
      const title = getMessageText(newMessages[0]).slice(0, 30) || 'New Conversation';
      saveChat(currentChatId, title, newMessages).catch(console.error);
      loadSidebar();
    }
  });

  // Load sidebar chats
  const loadSidebar = async () => {
    try {
      const chats = await getAllChats();
      setSidebarChats(chats.sort((a,b) => b.updatedAt - a.updatedAt));
    } catch (e) {
      console.error('IDB load error', e);
    }
  };

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Load initial ID
    const newChatId = Date.now().toString();
    setCurrentChatId(newChatId);
    loadSidebar();
  }, [isAuthenticated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      gsap.fromTo('.chat-entry-anim', 
        { opacity: 0, y: 15 }, 
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.05 }
      );
    }
  }, [messages.length]);

  const handleCreateNewChat = () => {
    setMessages([]);
    setCurrentChatId(Date.now().toString());
  };

  const handleSelectChat = async (id: string) => {
    const chat = await getChat(id);
    if (chat) {
      setCurrentChatId(id);
      setMessages(chat.messages);
    }
  };

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isGuest) {
      setGuestNotice('访客模式无生成内容的权限。如需使用，请使用 myj 重新登录。');
      return;
    }
    if (!input.trim()) return;

    setGuestNotice('');
    sendMessage({ text: input });
    
    // Quick local save trigger after pushing user message
    setTimeout(async () => {
      const title = getMessageText(messages[0] || { text: input }).slice(0, 30) || 'New Conversation';
      await saveChat(currentChatId, title, [...messages, { id: Date.now().toString(), role: 'user', content: input } as any]);
      loadSidebar();
    }, 100);
    
    setInput('');
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    logout();
    router.push('/login');
  };

  const submitDisabled = status !== 'ready' || input.trim().length === 0 || !isAuthenticated || isGuest;

  if (!isHydrated || !isAuthenticated) {
    return <div className="flex h-screen w-full bg-[#FDFCFB] text-[#111111] overflow-hidden" />;
  }

  return (
    <div ref={containerRef} className="flex h-screen w-full bg-[#FDFCFB] text-[#111111] overflow-hidden selection:bg-black selection:text-white relative">
      <FerrariCanvas />
      
      {/* Sidebar - Gemini Style minimal */}
      <aside className="relative z-10 hidden lg:flex w-72 flex-col border-r border-black/5 bg-[#F9F9F8]">
        
        {/* Top Logo & New Chat */}
        <div className="p-6 pb-4">
          <h1 className="font-serif text-xl tracking-tight leading-none mb-6">XIAOMA<span className="italic text-black/40">Premium</span></h1>
          
          <button 
            onClick={handleCreateNewChat}
            className="flex w-full items-center gap-3 bg-white border border-black/10 rounded-[1rem] px-4 py-3 text-sm hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-black/20 transition-all text-black/80 font-medium"
          >
            <Plus className="w-4 h-4" />
            新建对话
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          <div className="px-2 mb-2 text-[10px] uppercase font-semibold tracking-[0.2em] text-black/30">最近记录</div>
          {sidebarChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => handleSelectChat(chat.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                currentChatId === chat.id ? 'bg-black/5 text-black' : 'text-black/60 hover:bg-black/5 hover:text-black'
              }`}
            >
              <MessageSquare className="w-4 h-4 opacity-50 shrink-0" />
              <span className="text-sm truncate pt-0.5">{chat.title}</span>
            </button>
          ))}
          {sidebarChats.length === 0 && (
             <div className="px-2 text-xs text-black/30 pt-4 italic font-serif">暂无活动记录</div>
          )}
        </div>

        {/* User Card */}
        <div className="p-6 border-t border-black/5">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white shrink-0">
                    <User className="w-4 h-4" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-sm font-medium tracking-tight leading-none">{username}</span>
                    <span className="text-[10px] uppercase tracking-[0.1em] text-black/40 mt-1">{role === 'admin' ? 'Admin' : 'Observer'}</span>
                 </div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-black/40 hover:bg-black/5 hover:text-black rounded-full transition-colors"
                title="退出登录"
              >
                 <LogOut className="w-4 h-4" />
              </button>
           </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative h-screen bg-transparent z-10">
        
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-5 border-b border-black/5 bg-white/50 backdrop-blur-md z-10">
           <h1 className="font-serif text-lg tracking-tight">XIAOMA<span className="italic text-black/40">Premium</span></h1>
           <button onClick={handleLogout} className="p-2 text-black/50"><LogOut className="w-4 h-4" /></button>
        </header>

        {/* Messages */}
        <section className="flex-1 overflow-y-auto px-4 md:px-0 py-6 md:py-10">
           <div className="max-w-3xl mx-auto w-full">
              {messages.length === 0 ? (
                <div className="flex h-[80vh] items-center justify-center">
                   {/* Completely empty space to let Ferrari Canvas dominate */}
                </div>
              ) : (
                <div className="space-y-8 pb-32">
                   {messages.map((m) => {
                     const isUser = m.role === 'user';
                     const text = getMessageText(m);
                     return (
                       <article key={m.id} className={`chat-entry-anim flex w-full ${isUser ? 'justify-end pl-10' : 'justify-start pr-10'}`}>
                          {!isUser && (
                            <div className="w-8 h-8 rounded-full bg-black shrink-0 flex items-center justify-center mt-1 mr-4 shadow-sm">
                               <Sparkles className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                          <div className={`max-w-[100%] md:max-w-[85%] ${isUser ? 'bg-[#F2F2F2]/80 backdrop-blur-sm px-5 py-4 rounded-[1.5rem] rounded-tr-lg text-black shadow-[0_2px_10px_rgba(0,0,0,0.01)]' : 'pt-2'}`}>
                             <div className={`prose max-w-none text-[15px] leading-relaxed ${isUser ? 'text-black' : 'text-black/80 prose-headings:font-serif prose-headings:font-normal'}`}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                                  {text || ''}
                                </ReactMarkdown>
                             </div>
                          </div>
                       </article>
                     );
                   })}
                   {status === 'streaming' && (
                     <article className="flex w-full justify-start pr-10 chat-entry-anim">
                        <div className="w-8 h-8 rounded-full bg-black shrink-0 flex items-center justify-center mt-1 mr-4">
                           <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="pt-2">
                           <div className="w-1.5 h-4 bg-black/20 animate-pulse rounded-full mt-1.5 min-h-[1.2rem]"></div>
                        </div>
                     </article>
                   )}
                   {error && (
                     <article className="flex w-full justify-center opacity-80 pt-4">
                        <div className="bg-red-50 text-red-600 text-xs px-4 py-2 border border-red-100 rounded-lg max-w-sm text-center">
                           API Error: 权限校验未通过。只有管理员 (myj) 发送请求会被大模型接口受理。
                        </div>
                     </article>
                   )}
                </div>
              )}
              <div ref={messagesEndRef} className="h-6" />
           </div>
        </section>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 w-full px-4 md:px-0 pb-8 pt-20 bg-gradient-to-t from-[#FDFCFB] via-[#FDFCFB]/80 to-transparent pointer-events-none">
           <div className="max-w-3xl mx-auto w-full pointer-events-auto">
              
              {guestNotice && (
                 <div className="mb-4 mx-auto w-fit bg-black text-white px-5 py-2.5 rounded-full text-xs tracking-wide shadow-lg border border-black backdrop-blur-md">
                    {guestNotice}
                 </div>
              )}

              <form 
                onSubmit={handleSend}
                className="relative bg-[#F9F9F8]/60 backdrop-blur-md border border-black/10 rounded-[2rem] p-2 flex items-end shadow-[0_8px_30px_rgba(0,0,0,0.04)] focus-within:bg-white/80 focus-within:shadow-[0_8px_30px_rgba(0,0,0,0.08)] focus-within:border-black/20 transition-all duration-300"
              >
                 <textarea
                   value={input}
                   onChange={(e) => setInput(e.target.value)}
                   placeholder={isGuest ? "访客模式 (只读) ..." : "Ask Xiaoma Model..."}
                   rows={1}
                   className="flex-1 max-h-[200px] min-h-[44px] bg-transparent resize-none border-none outline-none px-4 py-3 text-sm text-black placeholder:text-black/30"
                   onKeyDown={(e) => {
                     if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as any); }
                   }}
                 />
                 <button
                   type="submit"
                   disabled={submitDisabled}
                   className="mb-1 mr-1 shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:bg-transparent disabled:text-black/50 bg-black text-white hover:scale-105"
                 >
                    <Send className="w-4 h-4 ml-0.5" />
                 </button>
              </form>
              <div className="text-center mt-3 text-[10px] text-black/30 uppercase tracking-[0.15em]">
                 Void • Internal System
              </div>
           </div>
        </div>

      </main>
    </div>
  );
}
