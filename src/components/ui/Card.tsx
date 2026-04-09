import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./Card.module.css";

type CardVariant = "default" | "outlined" | "muted";

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  headerAction?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  variant?: CardVariant;
}

export function Card({
  title,
  description,
  headerAction,
  footer,
  className,
  children,
  variant = "default",
  ...sectionProps
}: CardProps) {
  const hasHeader = Boolean(title || description || headerAction);

  return (
    <section
      {...sectionProps}
      className={cn(styles.card, styles[`variant_${variant}`], className)}
    >
      {hasHeader ? (
        <header className={styles.header}>
          <div className={styles.headerContent}>
            {title ? <h2 className={styles.title}>{title}</h2> : null}
            {description ? <p className={styles.description}>{description}</p> : null}
          </div>
          {headerAction ? <div className={styles.headerAction}>{headerAction}</div> : null}
        </header>
      ) : null}

      {children ? <div className={styles.body}>{children}</div> : null}
      {footer ? <footer className={styles.footer}>{footer}</footer> : null}
    </section>
  );
}
