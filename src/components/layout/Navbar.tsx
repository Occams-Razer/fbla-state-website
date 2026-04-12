"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import styles from "./Navbar.module.css";
import { NavbarUserMenu } from "./NavbarUserMenu";
import { ThemeToggle } from "./ThemeToggle";

const NAV_LINKS = [
  { href: "/search", label: "Search" },
  { href: "/submit", label: "Submit" },
  { href: "/claims/status", label: "Track Claim" },
];

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleResize = () => {
      if (window.innerWidth > 720) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isMenuOpen]);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brand} href="/">
          <Image
            alt="Foundry logo"
            className={styles.brandLogo}
            height={37}
            priority
            src="/logo.svg"
            style={{ height: "auto" }}
            width={40}
          />
          <span className={styles.brandText}>FOUNDRY</span>
        </Link>

        <button
          aria-controls={menuId}
          aria-expanded={isMenuOpen}
          aria-label={
            isMenuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          className={styles.menuButton}
          onClick={() => setIsMenuOpen((open) => !open)}
          type="button"
        >
          {isMenuOpen ? (
            <X aria-hidden="true" className={styles.menuIcon} size={18} />
          ) : (
            <Menu aria-hidden="true" className={styles.menuIcon} size={18} />
          )}
        </button>

        <nav
          aria-label="Primary"
          className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ""}`}
          id={menuId}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              className={styles.navLink}
              href={link.href}
              onClick={closeMenu}
            >
              {link.label}
            </Link>
          ))}
          <NavbarUserMenu />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
