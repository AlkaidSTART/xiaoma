'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function CustomCursor({ color = '#fff' }: { color?: string }) {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener('mousemove', onMouseMove);

    const ticker = gsap.ticker.add(() => {
      const dt = 1.0 - Math.pow(1.0 - 0.2, gsap.ticker.deltaRatio());
      cursorX += (mouseX - cursorX) * dt;
      cursorY += (mouseY - cursorY) * dt;
      gsap.set(cursor, { x: cursorX, y: cursorY });
    });

    const addHoverEvents = () => {
      const interactives = document.querySelectorAll('button, a, input, textarea');
      interactives.forEach((el) => {
        el.addEventListener('mouseenter', () => gsap.to(cursor, { scale: 1.8, duration: 0.3, ease: 'power2.out', mixBlendMode: 'difference' }));
        el.addEventListener('mouseleave', () => gsap.to(cursor, { scale: 1, duration: 0.3, ease: 'power2.out', mixBlendMode: 'normal' }));
      });
    };
    
    // MutationObserver to attach to highly dynamic elements
    const observer = new MutationObserver(addHoverEvents);
    observer.observe(document.body, { childList: true, subtree: true });
    addHoverEvents();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      gsap.ticker.remove(ticker);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed left-0 top-0 z-[9999] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
}
