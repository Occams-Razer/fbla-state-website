/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Card } from "@/components/ui";
import type { Item } from "@/lib/types";
import styles from "./ListingCard.module.css";

interface ListingCardProps {
  item: Item;
}

function formatDate(value: string) {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value || "Date not provided";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

export function ListingCard({ item }: ListingCardProps) {
  const displayDate = item.dateFound || item.createdAt;

  return (
    <Link aria-label={`View details for ${item.title}`} className={styles.cardLink} href={`/items/${item.id}`}>
      <Card className={styles.card}>
        <div className={styles.imageWrap}>
          {item.imageUrl ? (
            <img
              alt={`Photo of ${item.title}`}
              className={styles.image}
              loading="lazy"
              src={item.imageUrl}
            />
          ) : (
            <div className={styles.imageFallback} />
          )}
        </div>

        <div className={styles.content}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>{item.title}</h3>
            <span className={styles.categoryTag}>{item.category || "Other"}</span>
          </div>

          <p className={styles.metaRow}>
            <span className={styles.metaIcon} aria-hidden="true">Loc</span>
            <span>{item.location || "Unknown location"}</span>
          </p>
          <p className={styles.metaRow}>
            <span className={styles.metaIcon} aria-hidden="true">Date</span>
            <span>{formatDate(displayDate)}</span>
          </p>
        </div>
      </Card>
    </Link>
  );
}
