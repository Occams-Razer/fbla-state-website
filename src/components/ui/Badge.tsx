import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./Badge.module.css";

export type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  children: ReactNode;
  className?: string;
  variant?: BadgeVariant;
}

export function Badge({ children, className, variant = "neutral" }: BadgeProps) {
  return (
    <span className={cn(styles.badge, styles[`variant_${variant}`], className)}>
      {children}
    </span>
  );
}
