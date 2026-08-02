"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;

  constructor(width: number, height: number) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.radius = Math.random() * 1.5 + 0.5;
  }

  update(width: number, height: number) {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;
  }
}

const LINK_DIST_SQ = 15000;
const LINK_DIST = Math.sqrt(LINK_DIST_SQ); // ~122.47
const WIDTH_BUCKETS = 6; // quantized line-width buckets so we batch draw calls into a handful of paths

export default function ParticlePhysicsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resizeCanvas = () => {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resizeCanvas();

    // Adjust particle count based on screen size (prevent lag on big screens)
    const particleCount = Math.min(Math.floor((width * height) / 10000), 100);
    const particles = Array.from({ length: particleCount }, () => new Particle(width, height));

    // Reused across frames to avoid per-frame array allocation.
    const buckets: { x1: number; y1: number; x2: number; y2: number }[][] = Array.from(
      { length: WIDTH_BUCKETS },
      () => []
    );

    let animationFrameId: number;

    const render = () => {
      if (!document.hidden) {
        ctx.clearRect(0, 0, width, height);

        ctx.fillStyle = "rgba(255, 181, 154, 0.5)"; // primary color
        ctx.strokeStyle = "rgba(67, 225, 136, 0.15)"; // secondary color

        for (let b = 0; b < WIDTH_BUCKETS; b++) buckets[b].length = 0;

        for (let i = 0; i < particles.length; i++) {
          const p1 = particles[i];
          p1.update(width, height);

          ctx.beginPath();
          ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
          ctx.fill();

          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < LINK_DIST_SQ) {
              const t = Math.sqrt(distSq) / LINK_DIST; // 0..1
              const bucket = Math.min(WIDTH_BUCKETS - 1, Math.floor(t * WIDTH_BUCKETS));
              buckets[bucket].push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
            }
          }
        }

        // One beginPath/stroke per width bucket instead of one per line segment
        // (was up to ~4950 individual stroke() calls/frame at 100 particles).
        for (let b = 0; b < WIDTH_BUCKETS; b++) {
          const segs = buckets[b];
          if (segs.length === 0) continue;
          ctx.lineWidth = 1 - (b + 0.5) / WIDTH_BUCKETS;
          ctx.beginPath();
          for (const s of segs) {
            ctx.moveTo(s.x1, s.y1);
            ctx.lineTo(s.x2, s.y2);
          }
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    let resizeTimeout: ReturnType<typeof setTimeout> | undefined;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        width = window.innerWidth;
        height = window.innerHeight;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        resizeCanvas();
      }, 150);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
      cancelAnimationFrame(animationFrameId);
    };
  }, [prefersReduced]);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-background pointer-events-none z-0">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-60"
      />
      {/* Subtle overlay gradients for atmosphere */}
      <div className="absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-background via-background/80 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent mix-blend-screen" />
    </div>
  );
}
