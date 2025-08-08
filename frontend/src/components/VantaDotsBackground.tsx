"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Props {
  children: React.ReactNode;
}

interface VantaInstance {
  destroy: () => void;
}

export default function VantaDotsBackground({ children }: Props) {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaInstance = useRef<VantaInstance | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const VANTA = await import("vanta/dist/vanta.dots.min");
      if (mounted && vantaRef.current && !vantaInstance.current) {
        vantaInstance.current = VANTA.default({
          el: vantaRef.current,
          THREE,
          color: 0xffa500,
          color2: 0xffa500,
          backgroundColor: 0xffffff,
        });
      }
    })();

    return () => {
      mounted = false;
      if (vantaInstance.current) {
        vantaInstance.current.destroy();
        vantaInstance.current = null;
      }
    };
  }, []);

  return (
    <div ref={vantaRef} className="relative">
      <div className="relative z-10">{children}</div>
    </div>
  );
}

