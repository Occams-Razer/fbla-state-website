import Image from "next/image";
import Link from "next/link";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <Link className={styles.brand} href="/">
          <Image
            alt="Foundry logo"
            className={styles.brandLogo}
            height={44}
            src="/logo.svg"
            width={48}
          />
          <span>FOUNDRY</span>
        </Link>
        <p className={styles.copy}>Middleton High School&apos;s Lost &amp; Found System</p>
        <p className={styles.year}>&copy;2026 MPL</p>
      </div>
    </footer>
  );
}
