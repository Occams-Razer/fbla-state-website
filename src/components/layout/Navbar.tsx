"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileNavDrawer, type NavLinkItem } from "./MobileNavDrawer";
import styles from "./Navbar.module.css";

interface SessionState {
  authenticated: boolean;
  username?: string;
}

const NAV_LINKS: NavLinkItem[] = [
  { href: "/search", label: "Search" },
  { href: "/submit", label: "Submit" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const pathname = usePathname();
  const [session, setSession] = useState<SessionState | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let ignore = false;

    fetch("/api/auth/session")
      .then((response) => response.json() as Promise<SessionState>)
      .then((payload) => {
        if (!ignore) {
          setSession(payload);
        }
      })
      .catch(() => {
        if (!ignore) {
          setSession({ authenticated: false });
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession({ authenticated: false });
    setMobileOpen(false);

    if (pathname.startsWith("/admin")) {
      window.location.href = "/";
      return;
    }

    window.location.reload();
  }

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link className={styles.brand} href="/">
            <Image
              alt="Foundry logo"
              className={styles.brandLogo}
              height={48}
              priority
              src="/logo.svg"
              width={52}
            />
            <span className={styles.brandText}>FOUNDRY</span>
          </Link>

          <nav aria-label="Primary" className={styles.desktopNav}>
            {NAV_LINKS.map((link) => (
              <Link
                className={[styles.navLink, isActive(pathname, link.href) ? styles.navLinkActive : ""]
                  .filter(Boolean)
                  .join(" ")}
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}

            {session?.authenticated ? (
              <>
                <Link
                  className={[
                    styles.navLink,
                    isActive(pathname, "/admin") ? styles.navLinkActive : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  href="/admin"
                >
                  Dashboard
                </Link>
                <span className={styles.divider} />
                <span className={styles.userName}>{session.username ?? "Admin"}</span>
                <button className={styles.signOut} onClick={handleLogout} type="button">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <span className={styles.divider} />
                <Link className={styles.signIn} href="/login">
                  Sign in
                </Link>
              </>
            )}
          </nav>

          <button
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className={styles.menuButton}
            onClick={() => setMobileOpen((open) => !open)}
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <MobileNavDrawer
        isOpen={mobileOpen}
        links={NAV_LINKS}
        onClose={() => setMobileOpen(false)}
        onLogout={handleLogout}
        session={session}
      />
    </>
  );
}
