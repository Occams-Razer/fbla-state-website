import { Card } from "@/components/ui";
import styles from "./HowItWorks.module.css";
import { Check, Plus, Search } from "lucide-react";

const STEPS = [
  {
    id: "search",
    icon: <Search />,
    title: "Search & Find",
    description: "Browse all found items with search and category filters.",
  },
  {
    id: "report",
    icon: <Plus />,
    title: "Report Items",
    description:
      "Found something? Submit it in seconds with a photo and details.",
  },
  {
    id: "claim",
    icon: <Check />,
    title: "Verified Claims",
    description:
      "Admin moderation ensures only rightful owners get items back.",
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works-title" className={styles.section}>
      <h2 id="how-it-works-title" className={styles.title}>
        How it works
      </h2>
      <p className={styles.subtitle}>
        Three simple steps to reunite with your stuff
      </p>

      <div className={styles.grid}>
        {STEPS.map((step) => (
          <Card key={step.id} className={styles.card}>
            <div className={styles.iconWrap} aria-hidden="true">
              {step.icon}
            </div>
            <h3 className={styles.cardTitle}>{step.title}</h3>
            <p className={styles.cardText}>{step.description}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
