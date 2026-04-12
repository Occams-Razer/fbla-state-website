import Image from "next/image";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.brand}>
          <Image
            alt="Foundry logo"
            className={styles.brandLogo}
            height={44}
            src="/logo.svg"
            style={{ height: "auto" }}
            width={48}
          />
          <span>FOUNDRY</span>
        </p>
        <p className={styles.copy}>Middleton High School&apos;s Lost &amp; Found System</p>
        <p className={styles.year}>&copy;2026 MPL</p>
      </div>
    </footer>
  );
}
