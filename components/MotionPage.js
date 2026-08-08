"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

// Hanya opacity — JANGAN pakai transform/y, karena merusak position:fixed
const variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

export default function MotionPage({ children, className }) {
  const pathname = usePathname();
  const prefersReduced = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{
          duration: prefersReduced ? 0.1 : 0.22,
          ease: "easeOut"
        }}
        className={cn(className)}
        style={{ transform: "none" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
