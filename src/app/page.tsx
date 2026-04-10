import { AppShell } from "@/components/layout/AppShell";
import { HomeHero, HowItWorks, ReviewsSection } from "@/components/home";
import styles from "./page.module.css";

export default function Home() {
  return (
    <AppShell>
      <div className={styles.page}>
        <HomeHero />
        <HowItWorks />
        <ReviewsSection />
      </div>
    </AppShell>
  );
}
