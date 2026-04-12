'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import gsap from 'gsap';
import { ChevronRight } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    gsap.fromTo('.fade-up',
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.1 }
    );
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success && data.role === 'admin') {
        login(data.username, data.role);
        gsap.to(containerRef.current, {
          opacity: 0,
          y: -10,
          duration: 0.35,
          ease: 'power2.inOut',
          onComplete: () => {
            router.push('/');
          },
        });
      } else {
        setError('系统未授权您的访问权限。');
        gsap.fromTo('.error-msg', { x: -10 }, { x: 10, yoyo: true, repeat: 5, duration: 0.05 });
      }
    } catch (err) {
      setError('服务器连接错误。');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'Guest', password: '' })
      });
      const data = await res.json();
      if (data.success) {
        login('Guest', 'guest');
        gsap.to(containerRef.current, {
          opacity: 0,
          y: -10,
          duration: 0.4,
          ease: 'power2.inOut',
          onComplete: () => {
            router.push('/');
          },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main ref={containerRef} className="min-h-screen bg-[#FDFCFB] text-[#111111] flex items-center justify-center relative overflow-hidden">
      
      {/* Decorative large typo background */}
      <div className="absolute left-[-10%] top-[-5%] overflow-hidden opacity-[0.03] select-none pointer-events-none fade-up">
         <h1 className="text-[30vw] font-serif leading-none tracking-tighter whitespace-nowrap">Intelligence.</h1>
      </div>

      <div className="w-full max-w-6xl z-10 px-8 grid md:grid-cols-2 gap-20 items-center">
        
        <section className="fade-up order-2 md:order-1">
           <div className="max-w-md">
             <div className="flex items-center gap-3 mb-10">
                <div className="w-2.5 h-2.5 bg-black rounded-full"></div>
                <h2 className="uppercase tracking-[0.2em] text-[10px] font-semibold text-black/60">System Login</h2>
             </div>
             
             <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight mb-6">
                Premium<br/>
                <span className="italic text-black/50">Workspace.</span>
             </h1>
             <p className="text-sm md:text-base leading-relaxed text-black/50 font-sans font-light">
                请输入管理员账号 myj 与密码进入控制台，调用核心 API。其他身份请使用“访客模式”授权进入，但仅限于浏览数据。
             </p>
           </div>
        </section>

        <section className="order-1 md:order-2 flex md:justify-end">
           <form onSubmit={handleLogin} className="w-full max-w-sm bg-white border border-black/5 rounded-[2rem] p-8 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.03)] backdrop-blur-2xl">
              
              <div className="flex flex-col gap-6">
                <label className="fade-up relative block">
                  <span className="block text-[10px] uppercase tracking-[0.15em] text-black/40 mb-2 ml-1">Username</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. myj"
                    className="w-full bg-[#FDFCFB] border border-black/5 rounded-xl px-4 py-3.5 text-sm text-black placeholder:text-black/20 focus:border-black/20 transition-colors focus:ring-4 focus:ring-black/5"
                  />
                </label>

                <label className="fade-up relative block">
                  <span className="block text-[10px] uppercase tracking-[0.15em] text-black/40 mb-2 ml-1">Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full bg-[#FDFCFB] border border-black/5 rounded-xl px-4 py-3.5 text-sm text-black placeholder:text-black/20 focus:border-black/20 transition-colors focus:ring-4 focus:ring-black/5"
                  />
                </label>

                {error ? <p className="error-msg text-[11px] text-red-600 font-medium tracking-wide">{error}</p> : null}

                <div className="fade-up flex flex-col gap-3 mt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="group flex w-full items-center justify-center gap-2 bg-black text-white rounded-xl px-5 py-3.5 text-xs font-medium uppercase tracking-[0.1em] transition hover:bg-black/80 disabled:opacity-50"
                  >
                    {loading ? 'Authenticating...' : 'Sign In'}
                    <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    type="button"
                    onClick={handleGuest}
                    disabled={loading}
                    className="group flex w-full items-center justify-center gap-2 bg-white text-black/60 border border-black/5 rounded-xl px-5 py-3.5 text-xs font-medium uppercase tracking-[0.1em] transition hover:bg-black/5 disabled:opacity-50"
                  >
                    Enter as Guest
                  </button>
                </div>
              </div>
           </form>
        </section>

      </div>
    </main>
  );
}
