'use client';

import React, { useEffect, useRef } from 'react';

export default function FerrariCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    window.addEventListener('resize', resize);
    resize();

    // Subtle floating animation values
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX - width / 2) / (width / 2);
      mouseY = (e.clientY - height / 2) / (height / 2);
    };
    window.addEventListener('mousemove', onMouseMove);

    const drawFerrariLogo = (x: number, y: number, size: number, opacity: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = opacity;
      
      // The Prancing Horse (Refined silhouette, NO SHIELD)
      ctx.beginPath();
      const scale = size * 0.012; // Increased scale for the horse
      ctx.scale(scale, scale);
      ctx.translate(-45, 30); // Center the horse
      
      // Detailed S-curve for the prancing horse
      ctx.moveTo(40, -110); // Head
      ctx.bezierCurveTo(45, -115, 55, -110, 50, -90); // Neck back
      ctx.bezierCurveTo(65, -85, 85, -80, 90, -50); // Back
      ctx.bezierCurveTo(95, -30, 90, -10, 85, 10); // Rear leg outer
      ctx.lineTo(75, 50); // Rear leg down
      ctx.moveTo(85, 10);
      ctx.bezierCurveTo(70, 0, 50, 0, 30, 10); // Belly
      ctx.bezierCurveTo(15, 20, 10, 40, 15, 60); // Front leg 1
      ctx.moveTo(35, 15);
      ctx.bezierCurveTo(25, -10, 20, -30, 25, -60); // Chest
      ctx.bezierCurveTo(10, -70, -10, -50, -5, -30); // Raised leg
      ctx.lineTo(10, -10);
      
      // Tail
      ctx.moveTo(90, -50);
      ctx.bezierCurveTo(110, -65, 115, -90, 105, -110);
      
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.2; // Slightly bolder line for better visibility
      ctx.stroke();

      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Smoothing mouse movemen
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      const centerX = width / 2 + (targetX * 45); // Increased movement range
      const centerY = height / 2 + (targetY * 45);
      
      // Draw a very large, clearly visible black horse
      drawFerrariLogo(centerX, centerY, Math.min(width, height) * 0.5, 0.22);
      
      // Draw a smaller, sharper horse for dynamic layering
      drawFerrariLogo(centerX + 120, centerY - 60, 60, 0.38);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}