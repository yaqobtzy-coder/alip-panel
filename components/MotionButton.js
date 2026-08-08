"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

/**
 * Tombol Framer Motion yang 100% kompatibel dengan class Tailwind.
 *
 * Contoh:
 *   <MotionButton className="w-full bg-accent text-white rounded-md py-2.5 font-semibold">
 *     Login
 *   </MotionButton>
 */
export default function MotionButton({
  children,
  className,
  type = "button",
  disabled = false,
  variant = "solid", // solid | ghost | icon
  ...props
}) {
  const prefersReduced = useReducedMotion();

  const base =
    variant === "ghost"
      ? "btn-ghost inline-flex items-center justify-center gap-2"
      : variant === "icon"
      ? "inline-flex items-center justify-center rounded-full"
      : "btn-primary inline-flex items-center justify-center gap-2";

  return (
    <motion.button
      type={type}
      disabled={disabled}
      className={cn(base, className)}
      whileHover={
        prefersReduced || disabled
          ? undefined
          : { scale: 1.02, filter: "brightness(1.06)" }
      }
      whileTap={
        prefersReduced || disabled ? undefined : { scale: 0.96 }
      }
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
