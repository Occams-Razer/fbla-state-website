import type { CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./Skeleton.module.css";

type SkeletonVariant = "text" | "block";

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  className?: string;
}

export function Skeleton({ variant = "text", width, height, className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(styles.skeleton, styles[`variant_${variant}`], className)}
      style={{ height, width }}
    />
  );
}
