import { Card } from "@/components/ui";
import styles from "./ReviewsSection.module.css";

const REVIEWS = [
  {
    id: "r1",
    quote:
      "I left my AirPods in the gym and honestly thought they were gone forever. Found them on Foundry the same afternoon. This system is incredible.",
    name: "Jordan M.",
    role: "Junior, Middleton High",
  },
  {
    id: "r2",
    quote:
      "As a teacher, I used to get students knocking on my door asking if I'd seen their stuff. Since Foundry launched, they just check the site. It's saved me so much time.",
    name: "Ms. Hartwell",
    role: "AP Chemistry Teacher",
  },
  {
    id: "r3",
    quote:
      "Got my TI-84 back two days before finals. Whoever built this is a lifesaver — I would have failed without it.",
    name: "Priya K.",
    role: "Senior, Middleton High",
  },
  {
    id: "r4",
    quote:
      "Super easy to submit a found item. Took less than a minute and the admin approved it the same day. Clean design too.",
    name: "Tyler W.",
    role: "Sophomore, Middleton High",
  },
  {
    id: "r5",
    quote:
      "The claim verification process gives me real confidence that items go back to the right person. This is exactly what our school needed.",
    name: "Mr. Okonkwo",
    role: "Vice Principal",
  },
  {
    id: "r6",
    quote:
      "I recovered my North Face jacket within 24 hours of losing it. The photo and description on the listing made it so easy to identify. Love Foundry!",
    name: "Aisha T.",
    role: "Junior, Middleton High",
  },
];

function Stars() {
  return (
    <div className={styles.stars} aria-label="5 out of 5 stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} aria-hidden="true" className={styles.star}>★</span>
      ))}
    </div>
  );
}

export function ReviewsSection() {
  return (
    <section aria-labelledby="reviews-title" className={styles.section}>
      <h2 id="reviews-title" className={styles.title}>
        What the community is saying
      </h2>
      <p className={styles.subtitle}>
        Real feedback from Middleton students and staff
      </p>

      <div className={styles.grid}>
        {REVIEWS.map((review) => (
          <Card key={review.id} className={styles.card}>
            <Stars />
            <p className={styles.quote}>&ldquo;{review.quote}&rdquo;</p>
            <div className={styles.reviewer}>
              <span className={styles.name}>{review.name}</span>
              <span className={styles.role}>{review.role}</span>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
