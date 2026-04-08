import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./PageContainer.module.css";

interface PageContainerProps {
  as?: ElementType;
  children: ReactNode;
  className?: string;
}

export function PageContainer({
  as: Component = "div",
  children,
  className,
}: PageContainerProps) {
  return <Component className={cn(styles.container, className)}>{children}</Component>;
}
