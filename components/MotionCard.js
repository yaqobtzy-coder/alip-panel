"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

/**
 * Kartu dengan micro-interaksi, pakai class Tailwind + .card
 *
 *   <MotionCard className="p-4">...</MotionCard>
 *   <MotionCard href="/rayy-store/saldo" className="p-3">...</MotionCard>
 */
export default function MotionCard({
  children,
  className,
  href,
  onClick,
  ...props
}) {
  const prefersReduced = useReducedMotion();
  const Comp = href ? motion.a : motion.div;

  return (
    <Comp
      href={href}
      onClick={onClick}
      className={cn("card block", className)}
      whileHover={
        prefersReduced
          ? undefined
          : { y: -3, borderColor: "rgba(193,67,46,0.7)" }
      }
      whileTap={prefersReduced ? undefined : { scale: 0.98, y: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
      {...props}
    >
      {children}
    </Comp>
  );
}
