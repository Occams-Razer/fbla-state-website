"use client";

import { useId, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./Tooltip.module.css";

export interface TooltipProps {
  label: string;
  children: ReactNode;
  className?: string;
}

/**
 * Shows a short hint on hover or keyboard focus. The wrapper carries
 * aria-describedby so the hint is read along with the control inside it.
 */
export function Tooltip({ label, children, className }: TooltipProps) {
  const tooltipId = useId();
  const [isDismissed, setIsDismissed] = useState(false);

  function handleKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    if (event.key === "Escape") {
      setIsDismissed(true);
    }
  }

  return (
    <span
      aria-describedby={tooltipId}
      className={cn(styles.wrap, isDismissed && styles.dismissed, className)}
      onBlur={() => setIsDismissed(false)}
      onKeyDown={handleKeyDown}
      onMouseLeave={() => setIsDismissed(false)}
    >
      {children}
      <span className={styles.tooltip} id={tooltipId} role="tooltip">
        {label}
      </span>
    </span>
  );
}
