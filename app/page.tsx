'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Send, LogOut, MessageSquare, Plus, User, Trash2, Menu, X, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { saveChat, getChat, getAllChats, deleteChat, addChatEvent, clearAllChats, getAllMcpConfigs, type McpConfigRecord } from '@/lib/db';
import { availableModels } from '@/lib/model-config';
import { MCP_SERVER_DEFINITIONS, type McpServerKey } from '@/lib/mcp';
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

function splitThinkingAndAnswer(content: string) {
  const normalized = content.replace(/\r\n/g, '\n').trim();
  if (!normalized) return { thinking: '', answer: '' };

  const thinkOpenMatch = normalized.match(/<think>/i);
  if (thinkOpenMatch) {
    const openIndex = thinkOpenMatch.index ?? 0;
    const afterOpen = normalized.slice(openIndex + thinkOpenMatch[0].length);
    const closeMatch = afterOpen.match(/<\/think>/i);
    if (!closeMatch) {
      return {
        thinking: afterOpen.trim(),
        answer: '',
      };
    }
  }

  const thinkTagMatch = normalized.match(/<think>([\s\S]*?)<\/think>/i);
  if (thinkTagMatch) {
    const thinking = (thinkTagMatch[1] ?? '').trim();
    const answer = normalized.replace(thinkTagMatch[0], '').trim();
    return { thinking, answer };
  }

  const labeledMatch = normalized.match(/^(?:思考|推理|分析)[:：]\s*([\s\S]*?)\n(?:\n)?(?:最终回答|回答|结论|正文)[:：]\s*([\s\S]*)$/i);
  if (labeledMatch) {
    return {
      thinking: (labeledMatch[1] ?? '').trim(),
      answer: (labeledMatch[2] ?? '').trim(),
    };
  }

  return { thinking: '', answer: normalized };
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
  const [mcpMenuOpen, setMcpMenuOpen] = useState(false);
  const [mcpConfigs, setMcpConfigs] = useState<Record<string, McpConfigRecord>>({});
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window === 'undefined') return availableModels[0]?.name ?? 'deepseek-chat';
    return window.localStorage.getItem('selected-model') ?? availableModels[0]?.name ?? 'deepseek-chat';
  });
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const selectedModelConfig = availableModels.find((model) => model.name === selectedModel);
  const modeLabelMap: Record<string, string> = {
    fast: '快速',
    balanced: '均衡',
    reasoning: '深度',
    coder: '代码',
  };
  const selectedModelLabel = selectedModelConfig
    ? `${selectedModelConfig.displayName} · ${selectedModelConfig.provider}`
    : selectedModel;
  const selectedModelModeLabel = selectedModelConfig ? modeLabelMap[selectedModelConfig.mode] : '均衡';

  async function loadSidebar() {
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
  }

  useEffect(() => {
    window.localStorage.setItem('selected-model', selectedModel);
  }, [selectedModel]);

  const transportMcpConfigs = React.useMemo(
    () =>
      MCP_SERVER_DEFINITIONS.map((server) => ({
        key: server.key,
        title: server.title,
        enabled: Boolean(mcpConfigs[server.key]?.enabled),
        configured: Boolean(
          mcpConfigs[server.key]?.enabled || mcpConfigs[server.key]?.apiKey || mcpConfigs[server.key]?.params
        ),
        params: mcpConfigs[server.key]?.params || '',
        apiKeyConfigured: Boolean(mcpConfigs[server.key]?.apiKey),
      })),
    [mcpConfigs]
  );

  const transport = React.useMemo(() => new DefaultChatTransport({ 
    api: '/api/third-party',
    body: { model: selectedModel, mcpConfigs: transportMcpConfigs }
  }), [selectedModel, transportMcpConfigs]);

  const { messages, setMessages, sendMessage, status, error } = useChat({
    transport,
    id: currentChatId,
    onFinish: ({ messages: newMessages }) => {
      const title = getMessageText(newMessages[0]).slice(0, 30) || 'New Conversation';
      saveChat(currentChatId, title, newMessages).catch(console.error);
      addChatEvent(currentChatId, 'response', { model: selectedModel, note: 'assistant response completed' }).catch(console.error);
      loadSidebar();
    }
  });

  const latestAssistantMessage = [...messages].reverse().find((msg) => msg.role === 'assistant');
  const latestAssistantText = getMessageText(latestAssistantMessage);
  const latestAssistantId = latestAssistantMessage?.id;
  const shouldRenderStreamingPlaceholder = status === 'streaming' && latestAssistantText.trim().length === 0;

  useEffect(() => {
    if (!isAuthenticated || !currentChatId) return;
    let cancelled = false;

    const saveCurrentChat = async () => {
      const title = getMessageText(messages[0] || { text: 'New Conversation' }).slice(0, 30) || 'New Conversation';
      await saveChat(currentChatId, title, messages as UIMessage[]);
      if (!cancelled) {
        loadSidebar();
      }
    };

    const timer = window.setTimeout(() => {
      saveCurrentChat().catch(console.error);
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [messages, currentChatId, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !currentChatId) return;
    let cancelled = false;

    const restoreCurrentChat = async () => {
      const chat = await getChat(currentChatId);
      if (cancelled) return;
      setMessages((chat?.messages as UIMessage[]) ?? []);
    };

    restoreCurrentChat().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [currentChatId, isAuthenticated, setMessages]);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const frame = window.requestAnimationFrame(() => {
      loadSidebar();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    getAllMcpConfigs().then(setMcpConfigs).catch(console.error);
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
      addChatEvent(newChatId, 'create', { note: 'create new conversation' }).catch(console.error);
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
      const switchTip = `已切换到：${chat.title?.trim() ? chat.title.slice(0, 16) : '未命名对话'}`;
      if (chatSurfaceRef.current) {
        gsap.to(chatSurfaceRef.current, {
          opacity: 0,
          y: 4,
          duration: 0.15,
          onComplete: () => {
            setCurrentChatId(id);
            setMobileSidebarOpen(false);
            setGuestNotice(switchTip);
            addChatEvent(id, 'switch', { note: switchTip }).catch(console.error);
            gsap.fromTo(chatSurfaceRef.current, 
              { opacity: 0, y: -4 }, 
              { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
            );
          }
        });
      } else {
        setCurrentChatId(id);
        setMobileSidebarOpen(false);
        setGuestNotice(switchTip);
        addChatEvent(id, 'switch', { note: switchTip }).catch(console.error);
      }
    } else {
      setMobileSidebarOpen(false);
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setShowDeleteModal({ show: true, id });
  };

  const handleClearAllChats = async () => {
    const ok = window.confirm('确定删除全部历史记录吗？此操作不可恢复。');
    if (!ok) return;
    await clearAllChats();
    setMessages([]);
    const nextId = uuidv4();
    setCurrentChatId(nextId);
    await saveChat(nextId, 'New Conversation', []);
    await addChatEvent(nextId, 'create', { note: 'create new conversation after clear all' });
    setGuestNotice('已清空全部记录');
    loadSidebar();
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
      setGuestNotice('访客模式无生成权限。如需使用，请向管理员(2595006848@qq.com)申请账号');
      return;
    }
    if (!input.trim()) return;

    setGuestNotice('');
    addChatEvent(currentChatId, 'message', { model: selectedModel, note: input.slice(0, 120) }).catch(console.error);
    sendMessage(
      { text: input },
      { body: { model: selectedModel, mcpConfigs: transportMcpConfigs } }
    );
    
    setInput('');
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    logout();
    router.push('/login');
  };

  const submitDisabled = status !== 'ready' || input.trim().length === 0 || !isAuthenticated || isGuest;

  const getMcpStatusTone = (serverKey: McpServerKey) => {
    const config = mcpConfigs[serverKey];
    if (config?.enabled) return 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]';
    if (config?.apiKey || config?.params) return 'bg-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.12)]';
    return 'bg-black/20';
  };

  if (!hasHydrated || !isAuthenticated) {
    return <div className="flex h-screen w-full bg-[#FAFAFA] text-[#111111] overflow-hidden" />;
  }

  return (
    <div ref={containerRef} className="paper-lines flex h-screen w-full bg-[#FBFAF4] text-[#111111] overflow-hidden selection:bg-black selection:text-white relative">
      <div className="noise-overlay pointer-events-none fixed inset-0 z-0 opacity-[0.03]" />
      
      {/* Sidebar - Gemini Style minimal */}
      <aside ref={sideBarRef} className="relative z-10 hidden lg:flex w-72 flex-col border-r border-black/10 bg-[#F3EFE3]">
        
        {/* Top Logo & New Chat */}
        <div className="p-6 pb-4">
          <h1 className="font-serif text-xl tracking-tight leading-none mb-6">XIAOMA<span className="italic text-black/40">Archive</span></h1>

          <div className="mb-3 rounded-2xl border border-black/5 bg-white/85 p-2 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setMcpMenuOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left hover:bg-black/[0.03]"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-semibold tracking-[0.2em] text-black/35">MCP 模块</span>
                <span className="text-[10px] text-black/30">{MCP_SERVER_DEFINITIONS.length} 项</span>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-black/45 transition-transform duration-300 ${mcpMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <div
              className={`overflow-hidden transition-[max-height,opacity,transform] duration-500 ease-[cubic-bezier(0.22,0.8,0.22,1)] ${
                mcpMenuOpen ? 'max-h-[520px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 translate-y-2'
              }`}
            >
              <div className="px-1 pb-1 pt-2">
                <div className="grid grid-cols-1 gap-1.5">
                  {MCP_SERVER_DEFINITIONS.map((item) => {
                    const isConfigured = Boolean(mcpConfigs[item.key]?.enabled || mcpConfigs[item.key]?.apiKey || mcpConfigs[item.key]?.params);
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => router.push(`/mcp/${item.key}`)}
                        className="flex items-center gap-2 rounded-xl border border-black/5 bg-black/[0.015] px-2.5 py-2 text-left text-[11px] text-black/75 transition-transform duration-200 hover:translate-x-0.5 hover:bg-black/[0.03]"
                      >
                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${getMcpStatusTone(item.key)}`} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{item.title}</div>
                          <div className="truncate text-[10px] text-black/35">{item.description}</div>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] ${isConfigured ? 'bg-emerald-500/10 text-emerald-700' : 'bg-black/[0.04] text-black/35'}`}>
                          {isConfigured ? '已配' : '未配'}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/mcp/context7')}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-[11px] text-black/75 hover:bg-black/[0.02]"
                >
                  打开 MCP 配置页
                </button>
              </div>
            </div>
          </div>
          
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
          <button
            type="button"
            onClick={handleClearAllChats}
            className="mx-2 mb-3 flex w-[calc(100%-1rem)] items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50/70 px-2.5 py-2 text-[11px] text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> 删除全部记录
          </button>
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
           <h1 className="font-serif text-lg tracking-tight">XIAOMA<span className="italic text-black/40">Archive</span></h1>
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
                     const { thinking, answer } = !isUser ? splitThinkingAndAnswer(text) : { thinking: '', answer: text };
                     const isLatestAssistant = !isUser && m.id === latestAssistantId;
                     const showAnswerCue =
                       isLatestAssistant &&
                       status === 'streaming' &&
                       thinking.trim().length > 0 &&
                       answer.trim().length > 0;
                     const hideAnswerWhileThinking =
                       isLatestAssistant &&
                       status === 'streaming' &&
                       thinking.trim().length > 0 &&
                       answer.trim().length === 0;
                     return (
                       <article key={m.id} className={`chat-entry-anim flex w-full gap-4 ${isUser ? 'justify-end md:pl-10' : 'justify-start md:pr-10'}`}>
                          {!isUser && (
                            <div className="w-8 h-8 rounded-[14px] bg-gradient-to-b from-neutral-900 via-neutral-800 to-black shrink-0 flex items-center justify-center mt-2 shadow-[0_6px_18px_rgba(0,0,0,0.16)] relative overflow-hidden">
                               <div className="absolute inset-[1px] rounded-[13px] border border-white/10" />
                               <div className="w-[14px] h-[14px] rounded-full border border-white/65 flex items-center justify-center">
                                 <div className="w-[4px] h-[4px] rounded-full bg-white/90" />
                               </div>
                            </div>
                          )}
                          <div className={`max-w-[85%] md:max-w-[75%] ${isUser ? 'bg-black text-white px-5 py-3.5 rounded-[1.5rem] rounded-tr-[8px] shadow-[0_4px_16px_rgba(0,0,0,0.06)]' : 'pt-2.5'}`}>
                             {isUser ? (
                               <div className="prose max-w-none text-[15px] leading-relaxed text-white/95 prose-invert">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                                    {text || ''}
                                  </ReactMarkdown>
                               </div>
                             ) : (
                               <div className="space-y-3">
                                 {thinking && (
                                   <section className="rounded-2xl border border-black/10 bg-black/[0.02] px-4 py-3">
                                     <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/45">思考</div>
                                     <div className="prose max-w-none text-[14px] leading-relaxed text-black/60">
                                       <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                                         {thinking}
                                       </ReactMarkdown>
                                     </div>
                                   </section>
                                 )}
                                 {showAnswerCue && (
                                   <div className="inline-flex items-center rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-medium tracking-[0.08em] text-black/55 animate-in fade-in duration-300">
                                     思考完成，开始输出正文
                                   </div>
                                 )}
                                 {!hideAnswerWhileThinking && (
                                   <section className="rounded-2xl border border-black/5 bg-white px-4 py-3">
                                       {thinking && <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/45">正文</div>}
                                     <div className="prose max-w-none text-[15px] leading-relaxed text-black/85 prose-headings:font-serif prose-headings:font-normal">
                                       <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                                         {answer || text || ''}
                                       </ReactMarkdown>
                                     </div>
                                   </section>
                                 )}
                              </div>
                            )}
                          </div>
                       </article>
                     );
                   })}
                   {shouldRenderStreamingPlaceholder && (
                     <article className="flex w-full gap-4 justify-start md:pr-10 chat-entry-anim">
                        <div className="w-8 h-8 rounded-[14px] bg-gradient-to-b from-neutral-900 via-neutral-800 to-black shrink-0 flex items-center justify-center mt-2 shadow-[0_6px_18px_rgba(0,0,0,0.16)] relative overflow-hidden">
                           <div className="absolute inset-[1px] rounded-[13px] border border-white/10" />
                           <div className="w-[14px] h-[14px] rounded-full border border-white/65 flex items-center justify-center">
                             <div className="w-[4px] h-[4px] rounded-full bg-white/90" />
                           </div>
                        </div>
                        <div className="pt-2.5 w-full max-w-[85%] md:max-w-[75%]">
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
                className="relative bg-white/80 backdrop-blur-xl border border-black/5 rounded-[1.75rem] p-2 flex flex-col shadow-[0_8px_24px_rgba(0,0,0,0.04)] focus-within:bg-white focus-within:shadow-[0_12px_40px_rgba(0,0,0,0.08)] focus-within:border-black/10 transition-all duration-200"
              >
                 {/* Top Bar for Model Select */}
                 <div className="flex items-center justify-between px-3 pt-2 pb-1 gap-3 pointer-events-auto">
                   <div className="relative">
                     <button
                       type="button"
                       onClick={() => setShowModelDropdown(!showModelDropdown)}
                       className="group inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-[13px] font-medium text-black/70 transition-all hover:text-black hover:bg-black/5 active:scale-95"
                     >
                       <span className="truncate tracking-wide">{selectedModelLabel}</span>
                       <span className="rounded-full border border-black/10 px-1.5 py-0.5 text-[10px] tracking-[0.08em] text-black/55">{selectedModelModeLabel}</span>
                       <ChevronDown className={`w-4 h-4 opacity-50 transition-transform duration-200 ${showModelDropdown ? 'rotate-180 opacity-100' : ''}`} />
                     </button>

                     {showModelDropdown && (
                       <div className="absolute left-0 bottom-full mb-2 w-[min(300px,94vw)] rounded-[1.25rem] border border-black/5 bg-white/95 backdrop-blur-3xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] z-50 overflow-hidden transform-gpu origin-bottom-left animate-in fade-in zoom-in-95 duration-150">
                         <div className="max-h-[50vh] overflow-y-auto p-1.5 scrollbar-hide">
                           {availableModels.map((model) => (
                             <button
                               key={model.name}
                               type="button"
                               onClick={() => {
                                 setSelectedModel(model.name);
                                 setShowModelDropdown(false);
                               }}
                               className={`flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left transition-colors ${selectedModel === model.name ? 'bg-black text-white' : 'text-black/70 hover:bg-black/5'}`}
                             >
                               <span className="w-[6px] h-[6px] rounded-full shrink-0 bg-black/55" />
                               <div className="min-w-0 flex-1">
                                 <div className="truncate text-sm font-medium">{model.displayName}</div>
                                 <div className={`text-[10px] ${selectedModel === model.name ? 'text-white/70' : 'text-black/45'}`}>
                                   {`${model.displayName} · ${modeLabelMap[model.mode]}`}
                                 </div>
                               </div>
                             </button>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>

                   <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-black/20 hidden sm:inline">{isGuest ? 'Guest Mode' : 'Admin Mode'}</span>
                 </div>

                 <div className="flex items-end w-full relative">
                   <textarea
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     onFocus={() => {
                       gsap.killTweensOf(formRef.current);
                       gsap.to(formRef.current, { 
                         scale: 1.005,
                         duration: 0.15, 
                         ease: "power2.out",
                       });
                     }}
                     onBlur={() => {
                       gsap.to(formRef.current, { 
                         scale: 1,
                         duration: 0.15, 
                         ease: "power2.inOut",
                       });
                     }}
                     placeholder={isGuest ? "访客无生成权限..." : "send something to start a conversation..."}
                     rows={1}
                     style={{ minHeight: '44px' }}
                     className="flex-1 max-h-[160px] bg-transparent resize-none border-none outline-none px-4 py-2.5 text-[15px] leading-relaxed text-black/90 placeholder:text-black/30 placeholder:font-light"
                     onKeyDown={(e) => {
                       if (e.key === 'Enter' && !e.shiftKey) {
                         e.preventDefault();
                         formRef.current?.requestSubmit();
                       }
                     }}
                   />
                   <div className="shrink-0 p-1 flex items-center justify-center">
                     <button
                       type="submit"
                       disabled={submitDisabled}
                       className={`w-10 h-10 rounded-[14px] flex items-center justify-center transition-all duration-300 ${!input.trim() || submitDisabled ? 'bg-black/5 text-black/30 opacity-70' : 'bg-black text-white shadow-md hover:scale-105 active:scale-95'}`}
                     >
                        <Send className={`w-[18px] h-[18px] transition-transform ${input.trim() ? 'translate-x-0.5 -translate-y-0.5' : ''}`} />
                     </button>
                   </div>
                 </div>
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
                <div className="mb-3 rounded-2xl border border-black/10 bg-black/[0.015] p-2">
                  <button
                    type="button"
                    onClick={() => setMcpMenuOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between rounded-xl px-2 py-1.5"
                  >
                    <span className="text-[10px] uppercase font-semibold tracking-[0.2em] text-black/35">MCP 模块</span>
                    <ChevronDown className={`h-3.5 w-3.5 text-black/45 transition-transform duration-300 ${mcpMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <div
                    className={`overflow-hidden transition-[max-height,opacity,transform] duration-500 ease-[cubic-bezier(0.22,0.8,0.22,1)] ${
                      mcpMenuOpen ? 'max-h-[520px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 translate-y-2'
                    }`}
                  >
                    <div className="space-y-1.5 px-1 pb-1 pt-2">
                      {MCP_SERVER_DEFINITIONS.map((item) => {
                        const isConfigured = Boolean(mcpConfigs[item.key]?.enabled || mcpConfigs[item.key]?.apiKey || mcpConfigs[item.key]?.params);
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => router.push(`/mcp/${item.key}`)}
                            className="flex w-full items-center gap-2 rounded-xl border border-black/10 bg-white px-2.5 py-2 text-left text-[11px] text-black/70"
                          >
                            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${getMcpStatusTone(item.key)}`} />
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium">{item.title}</div>
                              <div className="truncate text-[10px] text-black/35">{item.description}</div>
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] ${isConfigured ? 'bg-emerald-500/10 text-emerald-700' : 'bg-black/[0.04] text-black/35'}`}>
                              {isConfigured ? '已配' : '未配'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              <button
                onClick={handleCreateNewChat}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-black text-white py-3 text-sm"
              >
                <Plus className="w-4 h-4" /> 新建对话
              </button>
              <button
                type="button"
                onClick={handleClearAllChats}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/70 py-2.5 text-xs text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" /> 删除全部记录
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
