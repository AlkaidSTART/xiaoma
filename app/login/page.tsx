'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(bgRef.current,
        { scale: 1.1, opacity: 0, filter: 'blur(10px)' },
        { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 1.8, ease: 'power3.out' }
      );
      gsap.fromTo(formRef.current!.children,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: 'power3.out', delay: 0.5 }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'm y j' && password === '123456') {
      login(username);
      router.push('/');
    } else {
      setError('Invalid username or password');
      gsap.fromTo(formRef.current,
        { x: -10 },
        { x: 10, duration: 0.1, yoyo: true, repeat: 3, ease: 'linear', onComplete: () => { gsap.set(formRef.current, { x: 0 }); } }
      );
    }
  };

  const handleSkip = () => {
    router.push('/');
  };

  return (
    <div ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black text-white selection:bg-white selection:text-black">
      <div 
        ref={bgRef}
        className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(50,50,50,1),_rgba(0,0,0,1))] opacity-50"
      />
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

      <div className="z-10 w-full max-w-md p-8 sm:p-12 relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-gray-500 to-gray-800 rounded-[2rem] blur-xl opacity-20" />
        <div className="relative bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">
          <form ref={formRef} onSubmit={handleLogin} className="flex flex-col space-y-6">
            <div className="text-center mb-4">
              <h1 className="text-3xl font-light tracking-tight mb-2">Welcome Back</h1>
              <p className="text-white/40 text-sm">Sign in to continue your journey.</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/50 uppercase tracking-widest pl-1">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-all duration-300"
                  placeholder="m y j"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/50 uppercase tracking-widest pl-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-all duration-300"
                  placeholder="••••••"
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <div className="pt-4 space-y-4">
              <button 
                type="submit"
                className="w-full bg-white text-black font-medium rounded-xl px-4 py-3 hover:bg-white/90 active:scale-[0.98] transition-all duration-300"
              >
                Sign In
              </button>
              <button 
                type="button"
                onClick={handleSkip}
                className="w-full bg-transparent text-white/60 font-medium rounded-xl px-4 py-3 hover:text-white hover:bg-white/5 transition-all duration-300"
              >
                Continue as Guest
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}