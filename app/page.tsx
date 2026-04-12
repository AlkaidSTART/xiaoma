'use client';

import { useId, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { DefaultChatTransport } from 'ai';
import { useChat } from '@ai-sdk/react';
import { Send, LogIn, Sparkles, User, FileText, ShieldAlert } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { saveChat } from '@/lib/db';

function getMessageText(message: { parts?: Array<{ type: string; text?: string }> }) {
  return (message.parts ?? [])
    .filter(part => part.type === 'text' && typeof part.text === 'string')
    .map(part => part.text ?? '')
    .join('')
    .trim();
}

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated, username, logout } = useAuthStore();
  const [guestNotice, setGuestNotice] = useState('');
  const [input, setInput] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatId = useId().replace(/:/g, '');

  const chat = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const { messages, sendMessage, status } = chat;

  useEffect(() => {
    if (messages.length > 0) {
      const firstText = getMessageText(messages[0]);
      void saveChat(chatId, firstText.slice(0, 30) || 'New Chat', messages);
    }
  }, [messages, chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.chat-message',
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, stagger: 0.08, ease: 'power2.out' }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [messages.length]);

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAuthenticated) {
      setGuestNotice('请先登录后再提交请求。');
      return;
    }

    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }

    setGuestNotice('');
    setInput('');
    await sendMessage({ text: trimmed });
  };

  const submitDisabled = status !== 'ready' || input.trim().length === 0;

  return (
    <div
      ref={containerRef}
      className="flex min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#18181b,_#050505_55%)] text-white"
    >
      <aside className="hidden w-72 flex-col border-r border-white/10 bg-black/35 px-5 py-6 backdrop-blur-2xl md:flex">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
            <Sparkles className="h-5 w-5 text-white/80" />
          </div>
          <div>
            <div className="text-lg font-light tracking-[0.24em] text-white/90">XIAOMA</div>
            <div className="text-xs uppercase tracking-[0.32em] text-white/35">Private AI Space</div>
          </div>
        </div>

        <div className="mb-4 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-white/35">
            <ShieldAlert className="h-3.5 w-3.5" />
            Access
          </div>
          <div className="text-sm leading-6 text-white/70">
            未登录时可以浏览页面，但无法发起 API 请求。
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-white/60 transition-colors hover:bg-white/7">
            <div className="mb-1 flex items-center gap-2 text-white/85">
              <FileText className="h-4 w-4" />
              Current session
            </div>
            仅保留本地 IndexedDB 会话索引。
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-white/85">{isAuthenticated ? username : 'Guest'}</div>
              <div className="text-xs text-white/35">{isAuthenticated ? 'API enabled' : 'Read only'}</div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-xs uppercase tracking-[0.24em] text-white/55 transition-colors hover:text-white"
            >
              Login
            </button>
            {isAuthenticated && (
              <button
                type="button"
                onClick={logout}
                className="text-xs uppercase tracking-[0.24em] text-rose-300 transition-colors hover:text-rose-200"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </aside>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 bg-black/25 px-4 py-4 backdrop-blur-xl md:px-8">
          <div>
            <div className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-white/35 md:hidden">
              <Sparkles className="h-4 w-4 text-white/70" />
              Xiaoma AI
            </div>
            <div className="hidden text-sm uppercase tracking-[0.3em] text-white/35 md:block">
              Minimal AI workspace
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/65">
              {isAuthenticated ? `Admin: ${username}` : 'Guest mode'}
            </div>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/80 transition-all hover:bg-white/10"
            >
              <LogIn className="h-3.5 w-3.5" />
              Login
            </button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-4 py-8 md:px-8 md:py-10">
          {messages.length === 0 ? (
            <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-[2rem] border border-white/8 bg-white/4 px-6 text-center backdrop-blur-2xl">
              <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_0_70px_rgba(255,255,255,0.06)]">
                <Sparkles className="h-10 w-10 text-white/70" />
              </div>
              <h1 className="max-w-2xl text-4xl font-light tracking-[-0.05em] text-white md:text-6xl">
                A calm canvas for precise AI conversations.
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/42 md:text-base">
                登录后可以发送请求并获得流式回答。取消登录也可以进入主页面，但提交按钮会提示先登录。
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map(message => {
                const text = getMessageText(message);
                const isUser = message.role === 'user';

                return (
                  <article
                    key={message.id}
                    className={`chat-message flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[92%] rounded-[1.75rem] border px-5 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.26)] md:max-w-[78%] ${
                        isUser
                          ? 'rounded-br-md border-white/10 bg-white text-zinc-950'
                          : 'rounded-bl-md border-white/10 bg-white/6 text-white/88'
                      }`}
                    >
                      <div className="prose prose-invert max-w-none text-sm leading-7 md:text-[15px]">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeSanitize]}
                        >
                          {text || ' '}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          <div ref={messagesEndRef} className="h-8" />
        </section>

        <footer className="border-t border-white/10 bg-black/30 px-4 py-4 backdrop-blur-xl md:px-8 md:py-6">
          <div className="mx-auto max-w-3xl">
            {guestNotice ? (
              <div className="mb-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                {guestNotice}
              </div>
            ) : null}

            <form onSubmit={handleSend} className="group relative">
              <div className="absolute -inset-px rounded-[1.5rem] bg-gradient-to-r from-white/30 via-white/10 to-white/25 opacity-20 blur transition-opacity group-focus-within:opacity-35" />
              <div className="relative flex items-end gap-3 rounded-[1.5rem] border border-white/10 bg-[#0a0a0a]/90 px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                <textarea
                  value={input}
                  onChange={event => setInput(event.target.value)}
                  placeholder={isAuthenticated ? 'Message Xiaoma AI...' : '请先登录后再发送'}
                  rows={1}
                  className="min-h-[52px] flex-1 resize-none bg-transparent py-3 text-sm leading-6 text-white outline-none placeholder:text-white/28"
                />
                <button
                  type="submit"
                  disabled={submitDisabled && isAuthenticated}
                  aria-disabled={isAuthenticated ? submitDisabled : false}
                  className={`inline-flex min-w-28 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm transition-all ${
                    isAuthenticated
                      ? 'bg-white text-zinc-950 hover:scale-[0.99] hover:bg-white/92'
                      : 'bg-white/6 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Send className="h-4 w-4" />
                  {isAuthenticated ? (status === 'streaming' ? 'Sending' : 'Send') : '请登录'}
                </button>
              </div>
            </form>

            <p className="mt-3 text-center text-[11px] uppercase tracking-[0.25em] text-white/22">
              Built with gsap, zustand, indexeddb and vercel ai sdk.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
