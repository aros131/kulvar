"use client";

import { useEffect, useRef } from "react";
import SplitType from "split-type";
import { motion, useAnimation, useInView } from "framer-motion";

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export default function AnimatedText({ text, className = "", delay = 0 }: AnimatedTextProps) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const controls = useAnimation();
  const inView = useInView(textRef, { once: true });

  useEffect(() => {
    if (inView && textRef.current) {
      const split = new SplitType(textRef.current, { types: "words" });

      controls.start("visible");

      return () => split.revert(); // cleanup on unmount
    }
  }, [inView, controls]);

  return (
    <motion.p
      ref={textRef}
      className={`overflow-hidden ${className}`}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.07,
            delayChildren: delay,
          },
        },
      }}
    >
      {text.split(" ").map((word, index) => (
        <motion.span
          key={index}
          className="inline-block mr-1"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {word}
        </motion.span>
      ))}
    </motion.p>
  );
}
