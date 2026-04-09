import { useId } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./Input.module.css";

function mergeDescribedBy(
  describedBy: string | undefined,
  hintId: string | undefined,
  errorId: string | undefined,
) {
  return [describedBy, hintId, errorId].filter(Boolean).join(" ") || undefined;
}

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
  inputClassName?: string;
}

export function Input({
  id,
  label,
  hint,
  error,
  required,
  className,
  containerClassName,
  inputClassName,
  "aria-describedby": describedBy,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? `field-${generatedId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const mergedDescribedBy = mergeDescribedBy(describedBy, hintId, errorId);

  return (
    <div className={cn(styles.field, containerClassName, className)}>
      {label ? (
        <label className={styles.label} htmlFor={inputId}>
          {label}
          {required ? <span className={styles.required}> *</span> : null}
        </label>
      ) : null}

      <input
        {...props}
        aria-describedby={mergedDescribedBy}
        aria-invalid={error ? true : props["aria-invalid"]}
        className={cn(styles.input, error && styles.inputError, inputClassName)}
        id={inputId}
        required={required}
      />

      {hint ? (
        <p className={styles.hint} id={hintId}>
          {hint}
        </p>
      ) : null}

      {error ? (
        <p className={styles.error} id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
