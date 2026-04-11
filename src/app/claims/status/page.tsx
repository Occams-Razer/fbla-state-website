"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Card, Input } from "@/components/ui";
import { fetchClaimStatus } from "@/lib/api";
import { isApiError } from "@/lib/api/errors";
import styles from "./page.module.css";

interface LookupState {
  claimId: string;
  email: string;
}

const INITIAL_LOOKUP: LookupState = { claimId: "", email: "" };

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value || "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric", month: "long", year: "numeric",
    hour: "numeric", minute: "2-digit",
  }).format(d);
}

type ClaimResult = {
  claimId: string;
  status: string;
  createdAt: string;
  item: { id: string; title: string; itemStatus: string } | null;
};

const STATUS_CONFIG: Record<string, { label: string; icon: string; noteClass: string; note: string }> = {
  PENDING: {
    label: "Pending Review",
    icon: "○",
    noteClass: "notePending",
    note: "Your claim is under review. You will be notified by email once a decision is made.",
  },
  APPROVED: {
    label: "Approved",
    icon: "✓",
    noteClass: "noteApproved",
    note: "Your claim was approved! Visit the school's lost and found office to collect your item.",
  },
  REJECTED: {
    label: "Not Approved",
    icon: "✕",
    noteClass: "noteRejected",
    note: "Your claim was not approved. Contact your school's office for more information.",
  },
  PICKED_UP: {
    label: "Picked Up",
    icon: "✓",
    noteClass: "noteApproved",
    note: "Your item has been picked up. Thank you for using Foundry!",
  },
};

function ResultPanel({ result }: { result: ClaimResult }) {
  const cfg = STATUS_CONFIG[result.status] ?? {
    label: result.status.toLowerCase(),
    icon: "◎",
    noteClass: "notePending",
    note: "",
  };

  return (
    <div className={styles.resultWrap}>
      <div className={`${styles.statusBanner} ${styles[`banner_${result.status}`]}`}>
        <span className={styles.statusIcon} aria-hidden="true">{cfg.icon}</span>
        <div>
          <p className={styles.statusBannerLabel}>Claim Status</p>
          <p className={styles.statusBannerValue}>{cfg.label}</p>
        </div>
      </div>

      <dl className={styles.metaList}>
        <div className={styles.metaRow}>
          <dt>Item</dt>
          <dd>{result.item?.title ?? "Unavailable"}</dd>
        </div>
        <div className={styles.metaRow}>
          <dt>Submitted</dt>
          <dd>{formatDate(result.createdAt)}</dd>
        </div>
        <div className={styles.metaRow}>
          <dt>Claim ID</dt>
          <dd className={styles.monoValue}>{result.claimId}</dd>
        </div>
        {result.item ? (
          <div className={styles.metaRow}>
            <dt>Item status</dt>
            <dd>{result.item.itemStatus.toLowerCase().replace(/_/g, " ")}</dd>
          </div>
        ) : null}
      </dl>

      {cfg.note ? (
        <p className={`${styles.statusNote} ${styles[cfg.noteClass]}`}>{cfg.note}</p>
      ) : null}
    </div>
  );
}

function EmptyPanel() {
  return (
    <div className={styles.emptyPanel}>
      <span className={styles.emptyIcon} aria-hidden="true">◎</span>
      <p className={styles.emptyTitle}>No claim looked up yet</p>
      <p className={styles.emptyText}>
        Enter your Claim ID and the email you used when submitting. You can find your Claim ID in the confirmation message you received.
      </p>
    </div>
  );
}

function ClaimStatusContent() {
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
  const [result, setResult] = useState<ClaimResult | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!lookup.claimId.trim() || !lookup.email.trim()) {
      setError("Both fields are required.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetchClaimStatus(lookup.claimId.trim(), lookup.email.trim());
      setResult(response);
    } catch (requestError) {
      setError(
        isApiError(requestError)
          ? requestError.message
          : "Could not find that claim. Check your ID and email and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <section aria-labelledby="claim-status-title" className={styles.header}>
        <h1 className={styles.title} id="claim-status-title">Track your claim</h1>
        <p className={styles.subtitle}>
          Enter your Claim ID and email to check the current status of your submission.
        </p>
      </section>

      <div className={styles.layout}>
        <Card className={styles.formCard}>
          <h2 className={styles.formTitle}>Look up claim</h2>
          <form className={styles.form} noValidate onSubmit={handleSubmit}>
            <Input
              autoComplete="off"
              label="Claim ID"
              onChange={(e) => setLookup((p) => ({ ...p, claimId: e.target.value }))}
              placeholder="e.g. cmnsd52by000168kn5a80dhr9"
              required
              value={lookup.claimId}
            />
            <Input
              autoComplete="email"
              label="Email address"
              onChange={(e) => setLookup((p) => ({ ...p, email: e.target.value }))}
              placeholder="you@example.com"
              required
              type="email"
              value={lookup.email}
            />
            {error ? (
              <p className={styles.errorText} role="alert">{error}</p>
            ) : null}
            <Button loading={isLoading} size="lg" type="submit" fullWidth>
              Check status
            </Button>
          </form>
        </Card>

        <Card className={styles.resultCard}>
          {result ? <ResultPanel result={result} /> : <EmptyPanel />}
        </Card>
      </div>
    </div>
  );
}

export default function ClaimStatusPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className={styles.page}><p>Loading…</p></div>}>
        <ClaimStatusContent />
      </Suspense>
    </AppShell>
  );
}
