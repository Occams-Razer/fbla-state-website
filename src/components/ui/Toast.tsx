"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { Alert } from "./Alert";
import styles from "./Toast.module.css";

type ToastVariant = "success" | "error" | "info";

interface ToastState {
  id: number;
  message: string;
  variant: ToastVariant;
}

export interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const AUTO_HIDE_MS = 4000;

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const nextId = useRef(0);

  const show = useCallback((message: string, variant: ToastVariant) => {
    nextId.current += 1;
    setToast({ id: nextId.current, message, variant });
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!toast || isPaused) {
      return;
    }

    const timeoutId = window.setTimeout(dismiss, AUTO_HIDE_MS);
    return () => window.clearTimeout(timeoutId);
  }, [dismiss, isPaused, toast]);

  const api = useMemo<ToastApi>(
    () => ({
      error: (message) => show(message, "error"),
      info: (message) => show(message, "info"),
      success: (message) => show(message, "success"),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className={styles.region}
        onBlur={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {toast ? (
          <Alert
            className={styles.toast}
            key={toast.id}
            onClose={dismiss}
            variant={toast.variant}
          >
            {toast.message}
          </Alert>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return context;
}
