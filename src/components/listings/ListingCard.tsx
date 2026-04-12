/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import type { BadgeVariant } from "@/components/ui/Badge";
import type { Item } from "@/lib/types";
import styles from "./ListingCard.module.css";

interface ListingCardProps {
  item: Item;
}

const STATUS_VARIANT: Record<Item["status"], BadgeVariant> = {
  APPROVED: "success",
  CLAIMED: "info",
  PENDING: "warning",
  REJECTED: "danger",
};

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
  const badgeVariant = STATUS_VARIANT[item.status] ?? "neutral";

  return (
    <Link
      aria-label={`View details for ${item.title}`}
      className={styles.cardLink}
      href={`/items/${item.id}`}
    >
      <Card className={styles.card}>
        <div className={styles.imageWrap}>
          {item.imageUrl ? (
            <img
              alt={item.title}
              className={styles.image}
              loading="lazy"
              src={item.imageUrl}
            />
          ) : (
            <div className={styles.imageFallback}>No photo available</div>
          )}
        </div>

        <div className={styles.content}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>{item.title}</h3>
            {/* <Badge variant={badgeVariant}>{item.status.toLowerCase()}</Badge> */}
          </div>

          <p className={styles.description}>
            {item.description || "No description provided."}
          </p>

          <dl className={styles.metaList}>
            <div className={styles.metaRow}>
              <dt className={styles.metaLabel}>Category</dt>
              <dd className={styles.metaValue}>
                {item.category || "Uncategorized"}
              </dd>
            </div>
            <div className={styles.metaRow}>
              <dt className={styles.metaLabel}>Location</dt>
              <dd className={styles.metaValue}>{item.location || "Unknown"}</dd>
            </div>
            <div className={styles.metaRow}>
              <dt className={styles.metaLabel}>Date found</dt>
              <dd className={styles.metaValue}>{formatDate(displayDate)}</dd>
            </div>
          </dl>
        </div>
      </Card>
    </Link>
  );
}
