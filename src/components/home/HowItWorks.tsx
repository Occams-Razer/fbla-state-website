import { Card } from "@/components/ui";
import styles from "./HowItWorks.module.css";

const STEPS = [
  {
    id: "search",
    title: "Search & Find",
    description: "Browse all found items with search and category filters.",
    icon: (
      <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="M20 20L16.5 16.5" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    ),
  },
  {
    id: "report",
    title: "Report Items",
    description: "Found something? Submit it in seconds with a photo and details.",
    icon: (
      <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
        <path d="M12 5V19M5 12H19" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    ),
  },
  {
    id: "claims",
    title: "Verified Claims",
    description: "Admin moderation ensures only rightful owners get items back.",
    icon: (
      <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
        <path
          d="M20 7L10 17L5 12"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    ),
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works-title" className={styles.section}>
      <h2 className={styles.title} id="how-it-works-title">
        How it works
      </h2>
      <p className={styles.subtitle}>Three simple steps to reunite with your stuff</p>

      <div className={styles.grid}>
        {STEPS.map((step) => (
          <Card className={styles.card} key={step.id}>
            <span aria-hidden="true" className={styles.iconWrap}>
              {step.icon}
            </span>
            <h3 className={styles.cardTitle}>{step.title}</h3>
            <p className={styles.cardText}>{step.description}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
