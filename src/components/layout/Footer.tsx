import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            ◇
          </span>
          <span>FOUNDRY</span>
        </p>
        <p className={styles.copy}>Middleton High School&apos;s Lost &amp; Found System</p>
        <p className={styles.year}>©2026 MPL</p>
      </div>
    </footer>
  );
}
