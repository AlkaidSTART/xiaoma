'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Send, LogOut, MessageSquare, Plus, Sparkles, User, Trash2, Menu, X, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { saveChat, getChat, getAllChats, deleteChat } from '@/lib/db';
import { availableModels } from '@/lib/model-config';
import { v4 as uuidv4 } from 'uuid';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'data';
  content: string;
  parts?: Array<{ type: string; text?: string }>;
}

interface ChatRecord {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

type MessagePart = { type?: string; text?: string };

function getMessageText(message: ChatMessage | UIMessage | string | null | undefined) {
  // Simple fallback for content in ai sdk
  if (typeof message === 'string') return message;
  if (!message) return '';
  const unknownMessage = message as { content?: unknown; parts?: MessagePart[] };
  if (typeof unknownMessage.content === 'string') return unknownMessage.content;
  return (unknownMessage.parts ?? [])
    .filter((part) => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text ?? '')
    .join('')
    .trim();
}

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated, username, role, logout, hasHydrated } = useAuthStore();
  const isGuest = role !== 'admin';
  const [guestNotice, setGuestNotice] = useState('');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const sideBarRef = useRef<HTMLElement>(null);
  const chatSurfaceRef = useRef<HTMLDivElement>(null);
  const guestNoticeRef = useRef<HTMLDivElement>(null);
  
  const [sidebarChats, setSidebarChats] = useState<ChatRecord[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>(() => uuidv4());
  const [input, setInput] = useState('');
  const [cleanupTip, setCleanupTip] = useState('侧边栏中 10 天无内容的对话将自动清理。');
  const [showDeleteModal, setShowDeleteModal] = useState<{ show: boolean; id: string }>({ show: false, id: '' });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(availableModels[0]?.name ?? 'deepseek-chat');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const selectedModelLabel = availableModels.find((model) => model.name === selectedModel)?.displayName || selectedModel;

  const transport = React.useMemo(() => new DefaultChatTransport({ 
    api: '/api/third-party',
    body: { model: selectedModel }
  }), [selectedModel]);

  const { messages, setMessages, sendMessage, status, error } = useChat({
    transport,
    id: currentChatId,
    onFinish: ({ messages: newMessages }) => {
      const title = getMessageText(newMessages[0]).slice(0, 30) || 'New Conversation';
      saveChat(currentChatId, title, newMessages).catch(console.error);
      loadSidebar();
    }
  });

  // Load sidebar chats
  const loadSidebar = async () => {
    try {
      const chats = (await getAllChats()) as unknown as ChatRecord[];
      const tenDaysMs = 10 * 24 * 60 * 60 * 1000;
      const expireBefore = Date.now() - tenDaysMs;

      const isEmptyChat = (chat: ChatRecord) => {
        if (!chat.messages || chat.messages.length === 0) return true;
        return chat.messages.every((msg) => getMessageText(msg).trim().length === 0);
      };

      const staleEmptyChats = chats.filter((chat) => chat.updatedAt < expireBefore && isEmptyChat(chat));

      if (staleEmptyChats.length > 0) {
        await Promise.all(staleEmptyChats.map((chat) => deleteChat(chat.id)));
      }

      const visibleChats = chats.filter((chat) => !staleEmptyChats.some((stale) => stale.id === chat.id));
      setSidebarChats(visibleChats.sort((a, b) => b.updatedAt - a.updatedAt));

      if (staleEmptyChats.length > 0) {
        setCleanupTip(`已自动清理 ${staleEmptyChats.length} 条超过 10 天且无内容的对话。`);
      } else {
        setCleanupTip('侧边栏中 10 天无内容的对话将自动清理。');
      }
    } catch (e) {
      console.error('IDB load error', e);
    }
  };

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Load initial ID
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

  useEffect(() => {
    if (!guestNotice || !guestNoticeRef.current) return;

    const node = guestNoticeRef.current;
    gsap.killTweensOf(node);
    gsap.fromTo(
      node,
      { opacity: 0, y: 12, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'power3.out' }
    );

    const timer = window.setTimeout(() => {
      gsap.to(node, {
        opacity: 0,
        y: -8,
        duration: 0.35,
        ease: 'power2.in',
        onComplete: () => setGuestNotice('')
      });
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [guestNotice]);

  const handleCreateNewChat = () => {
    const newChatId = uuidv4();
    const switchConversation = () => {
      setMessages([]);
      setCurrentChatId(newChatId);
      setGuestNotice('已创建新对话');
      saveChat(newChatId, 'New Conversation', []).then(loadSidebar).catch(console.error);
    };

    if (!chatSurfaceRef.current) {
      switchConversation();
      return;
    }

    gsap.killTweensOf(chatSurfaceRef.current);
    gsap.timeline()
      .to(chatSurfaceRef.current, {
        opacity: 0,
        y: 4,
        scale: 0.99,
        filter: 'blur(2px)',
        duration: 0.15,
        ease: 'power2.in'
      })
      .add(() => {
        switchConversation();
        setMobileSidebarOpen(false);
      })
      .fromTo(
        chatSurfaceRef.current,
        { opacity: 0, y: -4, scale: 1, filter: 'blur(4px)' },
        { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.35, ease: 'power3.out' }
      );
  };

  const handleSelectChat = async (id: string) => {
    const chat = await getChat(id);
    if (chat && id !== currentChatId) {
      if (chatSurfaceRef.current) {
        gsap.to(chatSurfaceRef.current, {
          opacity: 0,
          y: 4,
          duration: 0.15,
          onComplete: () => {
            setCurrentChatId(id);
            setMessages(chat.messages);
            setMobileSidebarOpen(false);
            gsap.fromTo(chatSurfaceRef.current, 
              { opacity: 0, y: -4 }, 
              { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
            );
          }
        });
      } else {
        setCurrentChatId(id);
        setMessages(chat.messages);
        setMobileSidebarOpen(false);
      }
    } else {
      setMobileSidebarOpen(false);
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setShowDeleteModal({ show: true, id });
  };

  const confirmDelete = async () => {
    const { id } = showDeleteModal;
    if (id) {
      await deleteChat(id);
      if (currentChatId === id) {
        setMessages([]);
        const nextId = uuidv4();
        setCurrentChatId(nextId);
      }
      loadSidebar();
    }
    setShowDeleteModal({ show: false, id: '' });
  };

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isGuest) {
      setGuestNotice('访客模式无生成权限。如需使用，请向管理员申请账号');
      return;
    }
    if (!input.trim()) return;

    setGuestNotice('');
    sendMessage({ text: input });
    
    // Quick local save trigger after pushing user message
    setTimeout(async () => {
      const title = getMessageText(messages[0] || { text: input }).slice(0, 30) || 'New Conversation';
      const userMessage = {
        id: uuidv4(),
        role: 'user',
        content: input,
        parts: [{ type: 'text', text: input }],
      } as unknown as UIMessage;
      await saveChat(currentChatId, title, [...messages, userMessage]);
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

  if (!hasHydrated || !isAuthenticated) {
    return <div className="flex h-screen w-full bg-[#FAFAFA] text-[#111111] overflow-hidden" />;
  }

  return (
    <div ref={containerRef} className="flex h-screen w-full bg-[#F7F7F7] text-[#111111] overflow-hidden selection:bg-black selection:text-white relative">
      <div className="noise-overlay pointer-events-none fixed inset-0 z-0 opacity-[0.03]" />
      
      {/* Sidebar - Gemini Style minimal */}
      <aside ref={sideBarRef} className="relative z-10 hidden lg:flex w-72 flex-col border-r border-black/5 bg-[#F9F9F9]">
        
        {/* Top Logo & New Chat */}
        <div className="p-6 pb-4">
          <h1 className="font-serif text-xl tracking-tight leading-none mb-6">XIAOMA<span className="italic text-black/40">Premium</span></h1>
          
          <button 
            onClick={handleCreateNewChat}
            className="flex w-full items-center gap-3 bg-white border border-black/5 rounded-[1rem] px-4 py-3 text-sm hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:border-black/10 transition-all text-black/80 font-medium mb-3"
          >
            <Plus className="w-4 h-4" />
            新建对话
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          <div className="px-2 mb-2 text-[10px] uppercase font-semibold tracking-[0.2em] text-black/30">最近记录</div>
          <div className="mx-2 mb-3 rounded-lg border border-black/5 bg-black/[0.02] px-2.5 py-2 text-[11px] leading-snug text-black/55">
            {cleanupTip}
          </div>
          {sidebarChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleSelectChat(chat.id)}
              className={`group w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                currentChatId === chat.id ? 'bg-black/5 text-black' : 'text-black/60 hover:bg-black/[0.03] hover:text-black'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <MessageSquare className="w-4 h-4 opacity-50 shrink-0" />
                <span className="text-sm truncate pt-0.5">{chat.title}</span>
              </div>
              <button 
                onClick={(e) => handleDeleteChat(e, chat.id)}
                className="opacity-0 group-hover:opacity-40 hover:!opacity-100 p-1 rounded-md hover:bg-black/5 transition-all transition-opacity duration-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
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
          <header className="lg:hidden flex items-center justify-between p-4 border-b border-black/10 bg-white/90 backdrop-blur-md z-10">
           <h1 className="font-serif text-lg tracking-tight">XIAOMA<span className="italic text-black/40">Premium</span></h1>
            <div className="flex items-center gap-1">
             <button onClick={() => setMobileSidebarOpen(true)} className="p-2 text-black/60" title="会话记录"><Menu className="w-4 h-4" /></button>
             <button onClick={handleCreateNewChat} className="p-2 text-black/60" title="新建对话"><Plus className="w-4 h-4" /></button>
             <button onClick={handleLogout} className="p-2 text-black/50" title="退出登录"><LogOut className="w-4 h-4" /></button>
           </div>
        </header>

        {/* Messages */}
          <section ref={chatSurfaceRef} className="flex-1 overflow-y-auto px-4 md:px-0 py-6 md:py-10">
           <div className="max-w-3xl mx-auto w-full">
              {messages.length === 0 ? (
                <div className="flex h-[80vh] items-center justify-center">
                   {/* Completely empty space to let Ferrari Canvas dominate */}
                </div>
              ) : (
                <div className="space-y-8 pb-36 md:pb-32">
                   {messages.map((m) => {
                     const isUser = m.role === 'user';
                     const text = getMessageText(m);
                     return (
                       <article key={m.id} className={`chat-entry-anim flex w-full ${isUser ? 'justify-end pl-4 md:pl-10' : 'justify-start pr-4 md:pr-10'}`}>
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
                        请求暂时失败，请稍后重试
                        </div>
                     </article>
                   )}
                </div>
              )}
              <div ref={messagesEndRef} className="h-6" />
           </div>
        </section>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 w-full px-4 md:px-0 pb-8 pt-20 bg-gradient-to-t from-[#F7F7F7] via-[#F7F7F7]/82 to-transparent pointer-events-none">
           <div className="max-w-3xl mx-auto w-full pointer-events-auto">
              
              {guestNotice && (
                  <div ref={guestNoticeRef} className="mb-4 mx-auto w-fit bg-black text-white px-5 py-2.5 rounded-full text-xs tracking-wide shadow-lg border border-black backdrop-blur-md">
                    {guestNotice}
                 </div>
              )}

              <form 
                ref={formRef}
                onSubmit={handleSend}
                className="relative bg-white/70 backdrop-blur-md border border-black/5 rounded-[2rem] p-2 flex items-end shadow-[0_4px_24px_rgba(0,0,0,0.03)] focus-within:bg-white focus-within:shadow-[0_8px_32px_rgba(0,0,0,0.06)] focus-within:border-black/10 transition-all duration-500"
              >
                 <div className="absolute left-4 right-14 top-3 z-10 flex items-center justify-between gap-3 pointer-events-auto">
                   <div className="relative">
                     <button
                       type="button"
                       onClick={() => setShowModelDropdown(!showModelDropdown)}
                       className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/85 px-3 py-1.5 text-[11px] font-medium text-black/75 shadow-sm backdrop-blur-md transition-all hover:border-black/20 hover:bg-white"
                     >
                       <Sparkles className="w-3.5 h-3.5" />
                       <span className="max-w-[160px] truncate">{selectedModelLabel}</span>
                       <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
                     </button>

                     {showModelDropdown && (
                       <div className="absolute left-0 top-[calc(100%+0.5rem)] w-[min(320px,80vw)] overflow-hidden rounded-[1.25rem] border border-black/10 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
                         <div className="max-h-72 overflow-y-auto p-2">
                           {availableModels.map((model) => (
                             <button
                               key={model.name}
                               type="button"
                               onClick={() => {
                                 setSelectedModel(model.name);
                                 setShowModelDropdown(false);
                               }}
                               className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${selectedModel === model.name ? 'bg-black/5 text-black font-medium' : 'text-black/65 hover:bg-black/[0.03]'}`}
                             >
                               <span className={`w-2 h-2 rounded-full ${model.type === 'general' ? 'bg-blue-500' : model.type === 'code' ? 'bg-emerald-500' : model.type === 'vl' ? 'bg-violet-500' : model.type === 'embedding' ? 'bg-amber-500' : model.type === 'reranker' ? 'bg-orange-500' : 'bg-zinc-500'}`} />
                               <span className="truncate">{model.displayName}</span>
                               <span className="ml-auto text-[10px] text-black/30">{model.date}</span>
                             </button>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>

                   <span className="ml-auto text-[10px] uppercase tracking-[0.2em] text-black/30 hidden sm:inline">{isGuest ? 'Guest Mode' : 'Admin Mode'}</span>
                 </div>

                 <textarea
                   value={input}
                   onChange={(e) => setInput(e.target.value)}
                   onFocus={() => {
                     gsap.to(formRef.current, { 
                       scale: 1.01,
                       duration: 0.4, 
                       ease: "power2.out",
                       boxShadow: "0 12px 32px rgba(0,0,0,0.06)"
                     });
                   }}
                   onBlur={() => {
                     gsap.to(formRef.current, { 
                       scale: 1,
                       duration: 0.4, 
                       ease: "power2.inOut",
                       boxShadow: "0 4px 24px rgba(0,0,0,0.03)"
                     });
                   }}
                   placeholder={isGuest ? "访客模式 (只读) ..." : "Ask Xiaoma Model..."}
                   rows={1}
                   className="flex-1 max-h-[200px] min-h-[44px] bg-transparent resize-none border-none outline-none px-4 py-10 text-sm text-black placeholder:text-black/20"
                   onKeyDown={(e) => {
                     if (e.key === 'Enter' && !e.shiftKey) {
                       e.preventDefault();
                       formRef.current?.requestSubmit();
                     }
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
              <div className="text-center mt-3 text-[10px] text-black/20 uppercase tracking-[0.15em]">
                 Void • Internal System
              </div>
           </div>
        </div>

      </main>

      {/* Mobile Sidebar Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <button
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="关闭会话记录"
          />
          <aside className="absolute left-0 top-0 h-full w-[85vw] max-w-sm bg-white border-r border-black/10 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/10">
              <h2 className="font-serif text-lg">会话记录</h2>
              <button onClick={() => setMobileSidebarOpen(false)} className="p-2 text-black/60" title="关闭">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 pb-2">
              <button
                onClick={handleCreateNewChat}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-black text-white py-3 text-sm"
              >
                <Plus className="w-4 h-4" /> 新建对话
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
              {sidebarChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className={`group flex items-center justify-between rounded-xl px-3 py-3 ${
                    currentChatId === chat.id ? 'bg-black/5 text-black' : 'text-black/65'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <MessageSquare className="w-4 h-4 shrink-0 opacity-60" />
                    <span className="truncate text-sm">{chat.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteChat(e, chat.id)}
                    className="p-1.5 rounded-md text-black/45"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {sidebarChats.length === 0 && (
                <p className="px-2 pt-4 text-xs text-black/35 italic">暂无活动记录</p>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/5 backdrop-blur-sm"
            onClick={() => setShowDeleteModal({ show: false, id: '' })}
          />
          <div className="relative bg-white border border-black/5 rounded-3xl p-8 max-w-sm w-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] animate-in fade-in zoom-in duration-300">
            <h3 className="font-serif text-xl mb-2">删除这段记忆？</h3>
            <p className="text-black/40 text-sm mb-8 leading-relaxed">删除后该记录将永久消失，无法恢复。</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal({ show: false, id: '' })}
                className="flex-1 px-6 py-3 rounded-2xl bg-black/[0.03] hover:bg-black/[0.06] text-sm font-medium transition-colors"
              >
                取消
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-6 py-3 rounded-2xl bg-black text-white hover:bg-black/90 text-sm font-medium transition-colors"
              >
                确定删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
