import { AppShell } from "@/components/layout/AppShell";
import { ClaimTracker, HomeHero, HowItWorks, ReviewsSection } from "@/components/home";
import styles from "./page.module.css";

export default function Home() {
  return (
    <AppShell>
      <div className={styles.page}>
        <div aria-hidden="true" className={styles.shapeCanvas}>
          <span className={`${styles.shape} ${styles.shapeYellow}`} />
          <span className={`${styles.shape} ${styles.shapeGreen}`} />
          <span className={`${styles.shape} ${styles.shapeRed}`} />
          <span className={`${styles.shape} ${styles.shapeBlue}`} />
          <span className={`${styles.shape} ${styles.shapePink}`} />
        </div>
        <HomeHero />
        <ClaimTracker />
        <HowItWorks />
        <ReviewsSection />
      </div>
    </AppShell>
  );
}
