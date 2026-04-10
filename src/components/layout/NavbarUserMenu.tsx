"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./Navbar.module.css";

interface SessionState {
  authenticated: boolean;
  username?: string;
}

export function NavbarUserMenu() {
  const [session, setSession] = useState<SessionState | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data: SessionState) => setSession(data))
      .catch(() => setSession({ authenticated: false }));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession({ authenticated: false });
    window.location.href = "/";
  }

  if (!session) {
    return <div className={styles.authPlaceholder} />;
  }

  if (session.authenticated && session.username) {
    return (
      <div className={styles.profileGroup}>
        <Link className={styles.profileBadge} href="/admin">
          <span className={styles.profileIcon} aria-hidden="true">◈</span>
          <span>{session.username}</span>
        </Link>
        <button className={styles.signOut} onClick={handleLogout} type="button">
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className={styles.profileGroup}>
      <span className={styles.userTile}>
        <span className={styles.profileIcon} aria-hidden="true">○</span>
        <span>User</span>
      </span>
      <Link className={styles.signIn} href="/login">
        Sign in
      </Link>
    </div>
  );
}
