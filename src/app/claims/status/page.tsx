"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Card, Input } from "@/components/ui";
import { fetchClaimStatus } from "@/lib/api";
import { isApiError } from "@/lib/api/errors";
import styles from "./page.module.css";

interface LookupState {
  claimId: string;
  email: string;
}

const INITIAL_LOOKUP: LookupState = {
  claimId: "",
  email: "",
};

function formatDate(value: string) {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value || "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsedDate);
}

function claimStatusLabel(status: string) {
  return status.toLowerCase().replace(/_/g, " ");
}

export default function ClaimStatusPage() {
  const searchParams = useSearchParams();
  const [lookup, setLookup] = useState<LookupState>(() => ({
    ...INITIAL_LOOKUP,
    claimId: searchParams.get("claimId") ?? "",
  }));

  useEffect(() => {
    const id = searchParams.get("claimId");
    if (id) setLookup((prev) => ({ ...prev, claimId: id }));
  }, [searchParams]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    claimId: string;
    status: string;
    createdAt: string;
    item: {
      id: string;
      title: string;
      itemStatus: string;
    } | null;
  } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!lookup.claimId.trim() || !lookup.email.trim()) {
      setError("Claim ID and email are required.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetchClaimStatus(lookup.claimId.trim(), lookup.email.trim());
      setResult(response);
    } catch (requestError) {
      if (isApiError(requestError)) {
        setError(requestError.message);
      } else {
        setError("Could not look up this claim right now. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <section aria-labelledby="claim-status-title" className={styles.header}>
        <h1 className={styles.title} id="claim-status-title">Check Claim Status</h1>
        <p className={styles.subtitle}>
          Enter your claim ID and email to see your latest claim status.
        </p>
      </section>

      <Card className={styles.formCard}>
        <form className={styles.form} noValidate onSubmit={handleSubmit}>
          <Input
            autoComplete="off"
            label="Claim ID"
            onChange={(event) => setLookup((previous) => ({ ...previous, claimId: event.target.value }))}
            placeholder="Example: cmnsd52by000168kn5a80dhr9"
            required
            value={lookup.claimId}
          />
          <Input
            autoComplete="email"
            label="Email"
            onChange={(event) => setLookup((previous) => ({ ...previous, email: event.target.value }))}
            placeholder="you@example.com"
            required
            type="email"
            value={lookup.email}
          />

          {error ? (
            <p className={styles.errorText} role="alert">{error}</p>
          ) : null}

          <div className={styles.actions}>
            <Button loading={isLoading} size="lg" type="submit">Check status</Button>
          </div>
        </form>
      </Card>

      {result ? (
        <Card className={styles.resultCard} variant="outlined">
          <div className={styles.resultHeader}>
            <h2 className={styles.resultTitle}>Claim Details</h2>
            <span className={`${styles.statusBadge} ${styles[`status_${result.status}`]}`}>
              {claimStatusLabel(result.status)}
            </span>
          </div>
          <dl className={styles.metaList}>
            <div className={styles.metaRow}>
              <dt>Claim ID</dt>
              <dd>{result.claimId}</dd>
            </div>
            <div className={styles.metaRow}>
              <dt>Submitted</dt>
              <dd>{formatDate(result.createdAt)}</dd>
            </div>
            <div className={styles.metaRow}>
              <dt>Item</dt>
              <dd>{result.item?.title ?? "Item unavailable"}</dd>
            </div>
            {result.item ? (
              <div className={styles.metaRow}>
                <dt>Item status</dt>
                <dd>{claimStatusLabel(result.item.itemStatus)}</dd>
              </div>
            ) : null}
          </dl>
          {result.status === "APPROVED" ? (
            <p className={styles.approvedNote}>
              Your claim has been approved. Please visit the school&apos;s lost and found office to collect your item.
            </p>
          ) : result.status === "PENDING" ? (
            <p className={styles.pendingNote}>
              Your claim is under review. You will be notified by email when a decision is made.
            </p>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
