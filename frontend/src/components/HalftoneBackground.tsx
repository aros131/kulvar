"use client";
import { useEffect, useRef } from "react";

export default function HalftoneBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const GRID = 22;
    const mouse = { x: -9999, y: -9999, vx: 0, vy: 0 };
    let t = 0;
    let raf: number;

    function resize() {
      canvas!.width  = canvas!.offsetWidth  * devicePixelRatio;
      canvas!.height = canvas!.offsetHeight * devicePixelRatio;
      ctx!.scale(devicePixelRatio, devicePixelRatio);
    }
    resize();

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
    window.addEventListener("resize",     resize);

    function draw() {
      t += 0.008;
      const W = canvas!.offsetWidth;
      const H = canvas!.offsetHeight;
      ctx!.clearRect(0, 0, W, H);

      const cols = Math.ceil(W / GRID) + 2;
      const rows = Math.ceil(H / GRID) + 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * GRID;
          const y = r * GRID;

          // multi-frequency wave for organic feel
          const wave =
            Math.sin(t + x * 0.022 + y * 0.015) * 0.4 +
            Math.sin(t * 0.6 - x * 0.014 + y * 0.021) * 0.35 +
            Math.sin(t * 1.1 + x * 0.009 - y * 0.018) * 0.25;

          const norm = (wave + 1) / 2; // 0..1

          // mouse ripple
          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const ripple = Math.max(0, 1 - dist / 180) * 0.55;

          const size = 0.8 + norm * 3.8 + ripple * 4.2;

          ctx!.beginPath();
          ctx!.arc(x, y, Math.max(0.1, size), 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(49,44,143,${0.10 + norm * 0.13 + ripple * 0.18})`;
          ctx!.fill();
        }
      }

      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove",  onMove);
      window.removeEventListener("touchmove",  onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize",     resize);
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
