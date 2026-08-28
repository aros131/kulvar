"use client";
import { useEffect, useRef } from "react";

export default function HalftoneBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const GRID   = 15;
    const MAX_R  = GRID / 2 - 0.5;
    let t = 0;
    let raf: number;
    const mouse = { x: -9999, y: -9999 };

    function resize() {
      const dpr = devicePixelRatio || 1;
      canvas!.width  = canvas!.offsetWidth  * dpr;
      canvas!.height = canvas!.offsetHeight * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent | TouchEvent) => {
      const rect = canvas!.getBoundingClientRect();
      const p = "touches" in e ? e.touches[0] : e;
      mouse.x = p.clientX - rect.left;
      mouse.y = p.clientY - rect.top;
    };
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; };
    window.addEventListener("mousemove",  onMove);
    window.addEventListener("touchmove",  onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);

    // Terracotta ribbon field — diagonal SW→NE
    function bandA(x: number, y: number): number {
      const v  = Math.sin(t * 0.35 + x * 0.0135 - y * 0.0135);
      const v2 = Math.sin(t * 0.20 + x * 0.007  - y * 0.018) * 0.35;
      return Math.max(0, v + v2);
    }

    // Indigo ribbon — same diagonal, offset phase so they interleave
    function bandB(x: number, y: number): number {
      const v  = Math.sin(t * 0.35 + x * 0.0135 - y * 0.0135 + 1.9);
      const v2 = Math.sin(t * 0.20 + x * 0.007  - y * 0.018  + 0.8) * 0.35;
      return Math.max(0, v + v2);
    }

    function mouseBoost(x: number, y: number): number {
      const dx = x - mouse.x, dy = y - mouse.y;
      return Math.max(0, 1 - Math.sqrt(dx*dx + dy*dy) / 170) * 0.6;
    }

    function dot(x: number, y: number, r: number, ri: number, gi: number, bi: number, alpha: number) {
      if (r < 0.3) return;
      ctx!.beginPath();
      ctx!.arc(x, y, r, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(${ri},${gi},${bi},${Math.min(alpha, 0.95)})`;
      ctx!.fill();
    }

    function draw() {
      t += 0.006;
      const W = canvas!.offsetWidth;
      const H = canvas!.offsetHeight;
      ctx!.clearRect(0, 0, W, H);

      const cols = Math.ceil(W / GRID) + 2;
      const rows = Math.ceil(H / GRID) + 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * GRID;
          const y = r * GRID;
          const boost = mouseBoost(x, y);

          // terracotta layer
          const a = bandA(x, y);
          const sizeA = Math.pow(a, 1.8) * MAX_R + boost * MAX_R * 0.5;
          dot(x, y, sizeA, 228, 87, 46, 0.15 + a * 0.75 + boost * 0.2);

          // indigo layer (on top)
          const b = bandB(x, y);
          const sizeB = Math.pow(b, 1.8) * MAX_R + boost * MAX_R * 0.4;
          dot(x, y, sizeB, 49, 44, 143, 0.15 + b * 0.75 + boost * 0.2);
        }
      }

      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize",    resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseleave",onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full -z-10 pointer-events-none"
      aria-hidden="true"
    />
  );
}
