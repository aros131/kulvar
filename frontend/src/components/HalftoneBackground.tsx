"use client";
import { useEffect, useRef } from "react";

const GRID = 30;
const BASE_R = 2;
const MAX_R = 9;
const SPEED = 0.11;
const MOUSE_STR = 0.18;
const MOUSE_RADIUS = 220;

export default function HalftoneBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const raf = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let t = 0;
    let cols = 0, rows = 0;

    function resize() {
      canvas!.width = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
      cols = Math.ceil(canvas!.width / GRID) + 2;
      rows = Math.ceil(canvas!.height / GRID) + 2;
    }
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent | TouchEvent) => {
      const rect = canvas!.getBoundingClientRect();
      const src = "touches" in e ? e.touches[0] : e;
      mouse.current = { x: src.clientX - rect.left, y: src.clientY - rect.top };
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });

    function draw() {
      t += SPEED * 0.012;
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx!.fillStyle = "#312C8F";

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * GRID - GRID / 2;
          const y = r * GRID - GRID / 2;

          const wave = (Math.sin(t + x * 0.018 + y * 0.014) * 0.5 + 0.5)
                     * (Math.sin(t * 0.7 + x * 0.012 - y * 0.02) * 0.5 + 0.5);

          const dx = x - mouse.current.x;
          const dy = y - mouse.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const mouseEffect = MOUSE_STR * Math.max(0, 1 - dist / MOUSE_RADIUS);

          const radius = BASE_R + (MAX_R - BASE_R) * Math.min(1, wave + mouseEffect);

          ctx!.beginPath();
          ctx!.arc(x, y, radius, 0, Math.PI * 2);
          ctx!.globalAlpha = 0.12 + wave * 0.1;
          ctx!.fill();
        }
      }

      ctx!.globalAlpha = 1;
      raf.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
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
