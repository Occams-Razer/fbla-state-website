import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import styles from "./Alert.module.css";

export type AlertVariant = "success" | "error" | "warning" | "info";

export interface AlertProps {
  children: ReactNode;
  variant?: AlertVariant;
  className?: string;
  onClose?: () => void;
}

const ICONS: Record<AlertVariant, typeof Info> = {
  error: CircleAlert,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
};

export function Alert({ children, variant = "info", className, onClose }: AlertProps) {
  const Icon = ICONS[variant];

  return (
    <div
      className={cn(styles.alert, styles[`variant_${variant}`], className)}
      role={variant === "error" ? "alert" : "status"}
    >
      <Icon aria-hidden="true" className={styles.icon} size={20} />
      <div className={styles.content}>{children}</div>
      {onClose ? (
        <button
          aria-label="Dismiss message"
          className={styles.closeButton}
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={16} />
        </button>
      ) : null}
    </div>
  );
}
