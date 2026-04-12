"use client";

import { FormEvent, useState } from "react";
import { Button, Input } from "@/components/ui";
import { fetchClaimStatus } from "@/lib/api";
import { isApiError } from "@/lib/api/errors";
import styles from "./ClaimTracker.module.css";

function formatDate(value: string) {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return value || "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric", month: "long", year: "numeric",
  }).format(parsedDate);
}

function statusLabel(status: string) {
  return status.toLowerCase().replace(/_/g, " ");
}

export function ClaimTracker() {
  const [claimId, setClaimId] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    claimId: string;
    status: string;
    createdAt: string;
    item: { id: string; title: string; itemStatus: string } | null;
  } | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!claimId.trim() || !email.trim()) {
      setError("Both Claim ID and email are required.");
      return;
    }

    try {
      setIsLoading(true);
      const data = await fetchClaimStatus(claimId.trim(), email.trim());
      setResult(data);
    } catch (err) {
      setError(isApiError(err) ? err.message : "Could not find that claim. Check your ID and email.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section aria-labelledby="claim-tracker-heading" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.textCol}>
          <h2 className={styles.heading} id="claim-tracker-heading">Track your claim</h2>
          <p className={styles.subheading}>
            Already submitted a claim? Enter your Claim ID and email to see its current status.
          </p>
        </div>

        <div className={styles.formCol}>
          <form className={styles.form} noValidate onSubmit={handleSubmit}>
            <Input
              autoComplete="off"
              label="Claim ID"
              onChange={(e) => setClaimId(e.target.value)}
              placeholder="e.g. cmnsd52by000168kn…"
              value={claimId}
            />
            <Input
              autoComplete="email"
              label="Email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              value={email}
            />
            {error ? (
              <p className={styles.errorText} role="alert">{error}</p>
            ) : null}
            <Button loading={isLoading} type="submit">Check status</Button>
          </form>

          {result ? (
            <div className={styles.result}>
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>Status</span>
                <span className={`${styles.statusBadge} ${styles[`status_${result.status}`]}`}>
                  {statusLabel(result.status)}
                </span>
              </div>
              {result.item ? (
                <div className={styles.resultRow}>
                  <span className={styles.resultLabel}>Item</span>
                  <span className={styles.resultValue}>{result.item.title}</span>
                </div>
              ) : null}
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>Submitted</span>
                <span className={styles.resultValue}>{formatDate(result.createdAt)}</span>
              </div>
              {result.status === "APPROVED" ? (
                <p className={styles.statusNote}>
                  Your claim was approved — visit the lost and found office to collect your item.
                </p>
              ) : result.status === "PENDING" ? (
                <p className={styles.statusNote}>
                  Your claim is under review. You'll be notified by email once a decision is made.
                </p>
              ) : result.status === "REJECTED" ? (
                <p className={styles.statusNote}>
                  Your claim was not approved. Contact your school's office for more information.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
