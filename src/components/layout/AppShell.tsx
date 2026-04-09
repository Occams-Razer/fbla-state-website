import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";
import { PageContainer } from "./PageContainer";
import styles from "./AppShell.module.css";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className={styles.main}>
        <PageContainer>{children}</PageContainer>
      </main>
      <Footer />
    </div>
  );
}
