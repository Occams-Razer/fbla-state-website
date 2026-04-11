import Image from "next/image";
import Link from "next/link";
import styles from "./Navbar.module.css";
import { NavbarUserMenu } from "./NavbarUserMenu";
import { ThemeToggle } from "./ThemeToggle";

const NAV_LINKS = [
  { href: "/search", label: "Search" },
  { href: "/submit", label: "Submit" },
  { href: "/claims/status", label: "Track Claim" },
];

export function Navbar() {
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

        <nav aria-label="Primary" className={styles.nav}>
          {NAV_LINKS.map((link) => (
            <Link key={link.href} className={styles.navLink} href={link.href}>
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
          <NavbarUserMenu />
        </nav>
      </div>
    </header>
  );
}
