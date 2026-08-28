"use client";
import { useEffect, useRef } from "react";

const GRID   = 16;
const C1     = { r: 49,  g: 44,  b: 143 }; // indigo  #312C8F
const C2     = { r: 228, g: 87,  b: 46  }; // terracotta #E4572E

export default function HalftoneBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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
    window.addEventListener("mousemove",   onMove);
    window.addEventListener("touchmove",   onMove, { passive: true });
    window.addEventListener("mouseleave",  onLeave);

    // flowing ribbon density field — diagonal band crossing
    function ribbonDensity(x: number, y: number): number {
      const a = Math.sin(t * 0.4  + x * 0.038 - y * 0.030);
      const b = Math.sin(t * 0.25 - x * 0.022 + y * 0.044);
      const c = Math.sin(t * 0.15 + x * 0.012 + y * 0.018);
      return ((a + b + c) / 3 + 1) / 2; // 0..1
    }

    // second band for color split — offset phase
    function colorBias(x: number, y: number): number {
      return Math.sin(t * 0.3 + x * 0.030 - y * 0.024 + 1.2);
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

          const d = ribbonDensity(x, y);
          const powered = Math.pow(d, 2.2); // sharpen the ribbon shape

          // mouse ripple
          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const ripple = Math.max(0, 1 - dist / 160) * 0.5;

          const size = 0.4 + powered * 7.5 + ripple * 4;
          if (size < 0.35) continue;

          // color: split by colorBias — indigo vs terracotta
          const bias = colorBias(x, y);
          const col = bias > 0 ? C1 : C2;
          const alpha = 0.18 + powered * 0.72 + ripple * 0.2;

          ctx!.beginPath();
          ctx!.arc(x, y, size, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(${col.r},${col.g},${col.b},${Math.min(alpha, 0.92)})`;
          ctx!.fill();
        }
      }

      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize",     resize);
      window.removeEventListener("mousemove",  onMove);
      window.removeEventListener("touchmove",  onMove);
      window.removeEventListener("mouseleave", onLeave);
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
