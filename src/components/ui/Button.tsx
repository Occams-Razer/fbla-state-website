import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./Button.module.css";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  iconLeft,
  iconRight,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        styles.button,
        styles[`variant_${variant}`],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        className,
      )}
      disabled={disabled || loading}
      type={type}
    >
      {loading ? (
        <>
          <span className={styles.spinner} aria-hidden="true" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {iconLeft ? <span className={styles.icon}>{iconLeft}</span> : null}
          <span>{children}</span>
          {iconRight ? <span className={styles.icon}>{iconRight}</span> : null}
        </>
      )}
    </button>
  );
}
