import Link from "next/link";
import styles from "./Navbar.module.css";
import { NavbarUserMenu } from "./NavbarUserMenu";

const NAV_LINKS = [
  { href: "/search", label: "Search" },
  { href: "/submit", label: "Submit" },
];

export function Navbar() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark} aria-hidden="true">
            ◇
          </span>
          <span className={styles.brandText}>FOUNDRY</span>
        </Link>

        <nav aria-label="Primary" className={styles.nav}>
          {NAV_LINKS.map((link) => (
            <Link key={link.href} className={styles.navLink} href={link.href}>
              {link.label}
            </Link>
          ))}
          <NavbarUserMenu />
        </nav>
      </div>
    </header>
  );
}
