'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import gsap from 'gsap';
import { ChevronRight, ShieldCheck, ArrowUpRight } from 'lucide-react';
import CustomCursor from '../components/CustomCursor';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const containerRef = useRef<HTMLDivElement>(null);
  const magneticRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    // Initial entrance animation
    const tl = gsap.timeline();
    tl.to('.overlay-screen', { yPercent: -100, duration: 1.2, ease: 'expo.inOut' })
      .fromTo('.fade-up',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power4.out', stagger: 0.1 },
        '-=0.8'
      );
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const handleMagnetic = useCallback((e: React.MouseEvent) => {
    const btn = magneticRef.current;
    if (!btn) return;
    const { left, top, width, height } = btn.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const moveX = (e.clientX - centerX) * 0.3;
    const moveY = (e.clientY - centerY) * 0.3;
    gsap.to(btn, { x: moveX, y: moveY, duration: 0.4, ease: 'power2.out' });
  }, []);

  const resetMagnetic = useCallback(() => {
    gsap.to(magneticRef.current, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
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
          scale: 1.05,
          duration: 0.8,
          ease: 'power4.inOut',
          onComplete: () => {
            router.push('/');
          },
        });
      } else {
        setError('UNAUTHORIZED ACCESS DETECTED.');
        gsap.fromTo('.error-msg', { x: -8 }, { x: 8, yoyo: true, repeat: 7, duration: 0.04 });
      }
    } catch {
      setError('SYSTEM DISCONNECTED.');
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
          y: -20,
          duration: 0.6,
          ease: 'power3.inOut',
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
    <main ref={containerRef} className="h-[100dvh] overflow-hidden bg-[#F7F7F3] text-[#161616] flex flex-col font-sans selection:bg-black selection:text-white">
      <CustomCursor color="#161616" />
      <div className="noise-overlay" />
      
      {/* Decorative Gradient Glows for better section blending */}
      <div className="absolute top-[10%] right-[5%] w-[40vw] h-[40vw] bg-black/[0.02] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[30vw] h-[30vw] bg-black/[0.015] rounded-full blur-[100px] pointer-events-none" />

      <div className="overlay-screen fixed inset-0 bg-black z-[100] pointer-events-none" />

      {/* Navigation Header */}
      <header className="px-6 py-5 md:px-10 md:py-8 flex justify-between items-start z-20 shrink-0">
        <div className="fade-up flex items-center gap-2 group cursor-pointer">
          <div className="overflow-hidden">
             <span className="block font-serif italic text-2xl tracking-tighter leading-none group-hover:-translate-y-full transition-transform duration-500">XiaoMa</span>
             <span className="block font-serif italic text-2xl tracking-tighter leading-none group-hover:-translate-y-full transition-transform duration-500 absolute">Intelligence</span>
          </div>
          <span className="text-[10px] uppercase tracking-widest opacity-40 ml-4 hidden sm:block">Internal Access Only</span>
        </div>
        
        <div className="fade-up text-[10px] uppercase font-semibold tracking-[0.2em] opacity-40">
           © 2026 Studio XM
        </div>
      </header>

      {/* Main Content Split */}
      <div className="flex-1 min-h-0 grid lg:grid-cols-[1.2fr,0.8fr] items-stretch overflow-hidden">
        
        {/* Left Section: Context & Brand */}
        <section className="relative hidden lg:flex px-16 xl:px-24 flex-col justify-center py-10 overflow-hidden">
          <div className="max-w-xl z-10">
            <div className="fade-up mb-12 flex items-center gap-3">
               <ShieldCheck size={16} strokeWidth={1} />
               <h2 className="uppercase tracking-[0.3em] text-[9px] font-bold text-black/40">Secure Identity Gateway</h2>
            </div>
            
            <h1 className="fade-up font-serif text-6xl md:text-8xl lg:text-9xl leading-[0.9] tracking-tighter mb-10">
               Define the<br/>
               <span className="italic opacity-30">Boundary.</span>
            </h1>
            
            <div className="fade-up flex flex-col sm:flex-row gap-8 items-start sm:items-center">
              <p className="max-w-xs text-xs md:text-sm leading-relaxed text-black/40 font-light">
                请输入管理员凭据以访问核心神经中枢。未经授权的尝试将被后台加密协议记录。
              </p>
              <div className="h-px w-12 bg-black/10 hidden sm:block"></div>
              <button 
                onClick={handleGuest}
                className="group flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold hover:opacity-60 transition-opacity"
              >
                Guest Entrance <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
          
          {/* Background Typography Decoration */}
          <div className="absolute right-0 bottom-[-5%] opacity-[0.02] pointer-events-none select-none">
             <span className="text-[25vw] font-serif italic leading-none whitespace-nowrap -tracking-[0.05em]">Protocol</span>
          </div>
        </section>

        {/* Right Section: Form */}
        <section className="relative lg:border-l border-black/[0.05] px-6 md:px-14 lg:px-20 xl:px-24 py-6 md:py-10 lg:py-12 flex flex-col justify-center overflow-hidden">
           <form onSubmit={handleLogin} className="w-full max-w-md mx-auto space-y-7 md:space-y-8">
              <div className="space-y-7">
                <div className="fade-up relative">
                  <span className="absolute -top-6 left-0 text-[9px] uppercase tracking-[0.2em] font-bold text-black/30">Identifier</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Account ID"
                    className="w-full bg-transparent border-b border-black/10 pb-4 text-sm tracking-wide focus:border-black transition-colors focus:ring-0 rounded-none placeholder:text-black/10"
                  />
                </div>

                <div className="fade-up relative">
                  <span className="absolute -top-6 left-0 text-[9px] uppercase tracking-[0.2em] font-bold text-black/30">Security Key</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent border-b border-black/10 pb-4 text-sm focus:border-black transition-colors focus:ring-0 rounded-none placeholder:text-black/5"
                    required
                  />
                </div>
              </div>

              {error ? (
                <p className="error-msg fade-up text-[9px] text-red-500 font-bold tracking-widest text-center border border-red-500/20 py-2 bg-red-500/5">
                  {error}
                </p>
              ) : null}

              <div className="fade-up pt-3 md:pt-4">
                <button
                  ref={magneticRef}
                  onMouseMove={handleMagnetic}
                  onMouseLeave={resetMagnetic}
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-between bg-black text-white px-7 py-4 group transition-transform active:scale-[0.98] disabled:opacity-30"
                >
                  <span className="text-[10px] uppercase tracking-[0.3em] font-bold">
                    {loading ? 'Authenticating...' : 'Establish Connection'}
                  </span>
                  <div className="relative overflow-hidden w-4 h-4">
                    <ChevronRight size={16} className="absolute group-hover:translate-x-full transition-transform duration-500" />
                    <ChevronRight size={16} className="absolute -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                  </div>
                </button>
              </div>

              <div className="fade-up text-center">
                <span className="text-[9px] uppercase tracking-widest opacity-20">
                  Node Status: Online & SSL Secured
                </span>
              </div>
           </form>
        </section>
      </div>

      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 pointer-events-none z-0 hidden lg:block opacity-[0.03]">
         <div className="absolute left-1/2 top-0 bottom-0 w-px bg-black"></div>
         <div className="absolute left-0 right-0 top-1/2 h-px bg-black"></div>
      </div>
    </main>
  );
}
