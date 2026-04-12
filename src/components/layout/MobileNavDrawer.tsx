"use client";

import Link from "next/link";
import styles from "./MobileNavDrawer.module.css";

export interface NavLinkItem {
  href: string;
  label: string;
}

interface SessionState {
  authenticated: boolean;
  username?: string;
}

interface MobileNavDrawerProps {
  isOpen: boolean;
  links: NavLinkItem[];
  onClose: () => void;
  onLogout: () => void;
  session: SessionState | null;
}

export function MobileNavDrawer({
  isOpen,
  links,
  onClose,
  onLogout,
  session,
}: MobileNavDrawerProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        aria-label="Mobile navigation menu"
        className={styles.panel}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <nav aria-label="Mobile primary" className={styles.nav}>
          {links.map((link) => (
            <Link className={styles.link} href={link.href} key={link.href} onClick={onClose}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className={styles.auth}>
          {session?.authenticated ? (
            <>
              <Link className={styles.adminLink} href="/admin" onClick={onClose}>
                Dashboard ({session.username ?? "Admin"})
              </Link>
              <button className={styles.signOut} onClick={onLogout} type="button">
                Sign out
              </button>
            </>
          ) : (
            <Link className={styles.signIn} href="/login" onClick={onClose}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
