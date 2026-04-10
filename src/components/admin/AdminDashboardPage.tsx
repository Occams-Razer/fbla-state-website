"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";
import { fetchAdminItems, fetchClaims, logoutAdmin, updateClaimStatus, updateItemStatus } from "@/lib/api";
import { isApiError } from "@/lib/api/errors";
import type { Claim, ClaimStatus, Item, ItemStatus } from "@/lib/types";
import styles from "./AdminDashboardPage.module.css";

type MainTab = "items" | "claims";
type ItemSubTab = "PENDING" | "APPROVED" | "REJECTED";
type ClaimSubTab = "PENDING" | "APPROVED" | "REJECTED";

function formatDate(value: string) {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value || "Unknown";
  }
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

function statusTagClass(status: string): string {
  switch (status) {
    case "APPROVED": return styles.tagApproved;
    case "REJECTED": return styles.tagRejected;
    case "CLAIMED":  return styles.tagClaimed;
    default:         return styles.tagPending;
  }
}

export function AdminDashboardPage({ username }: { username: string }) {
  const [mainTab, setMainTab] = useState<MainTab>("items");
  const [itemSubTab, setItemSubTab] = useState<ItemSubTab>("PENDING");
  const [claimSubTab, setClaimSubTab] = useState<ClaimSubTab>("PENDING");

  const [sessionExpired, setSessionExpired] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isLoadingClaims, setIsLoadingClaims] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [claimsError, setClaimsError] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [activeActionKey, setActiveActionKey] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadItems() {
      setIsLoadingItems(true);
      setItemsError(null);
      try {
        const results = await fetchAdminItems();
        if (!ignore) setItems(results.items);
      } catch (error) {
        if (ignore) return;
        if (isApiError(error) && error.status === 401) {
          setSessionExpired(true);
          return;
        }
        setItemsError(isApiError(error) ? error.message : "Could not load moderation items.");
      } finally {
        if (!ignore) setIsLoadingItems(false);
      }
    }

    async function loadClaims() {
      setIsLoadingClaims(true);
      setClaimsError(null);
      try {
        const results = await fetchClaims();
        if (!ignore) setClaims(results.claims);
      } catch (error) {
        if (ignore) return;
        if (isApiError(error) && error.status === 401) {
          setSessionExpired(true);
          return;
        }
        setClaimsError(isApiError(error) ? error.message : "Could not load claims.");
      } finally {
        if (!ignore) setIsLoadingClaims(false);
      }
    }

    void loadItems();
    void loadClaims();
    return () => { ignore = true; };
  }, []);

  async function handleItemStatusChange(item: Item, nextStatus: ItemStatus) {
    setActionError(null);
    setActionSuccess(null);
    const actionKey = `item:${item.id}:${nextStatus}`;
    setActiveActionKey(actionKey);
    try {
      const updated = await updateItemStatus(item.id, { status: nextStatus });
      setItems((prev) => prev.map((e) => (e.id === item.id ? updated : e)));
      setActionSuccess(`Item "${item.title}" marked ${nextStatus.toLowerCase()}.`);
    } catch (error) {
      setActionError(isApiError(error) ? error.message : "Could not update item status.");
    } finally {
      setActiveActionKey(null);
    }
  }

  async function handleClaimStatusChange(claim: Claim, nextStatus: ClaimStatus) {
    setActionError(null);
    setActionSuccess(null);
    const actionKey = `claim:${claim.id}:${nextStatus}`;
    setActiveActionKey(actionKey);
    try {
      const updated = await updateClaimStatus(claim.id, { status: nextStatus });
      setClaims((prev) =>
        prev.map((e) =>
          e.id === claim.id ? { ...e, ...updated, item: updated.item ?? e.item } : e,
        ),
      );
      setActionSuccess(`Claim by ${claim.name} marked ${nextStatus.toLowerCase()}.`);
    } catch (error) {
      setActionError(isApiError(error) ? error.message : "Could not update claim status.");
    } finally {
      setActiveActionKey(null);
    }
  }

  async function handleLogout() {
    try { await logoutAdmin(); } catch { /* ignore */ }
    window.location.href = "/login";
  }

  const visibleItems = items.filter((i) => i.status === itemSubTab);
  const visibleClaims = claims.filter((c) => c.status === claimSubTab);

  return (
    <div className={styles.page}>
      <section aria-labelledby="admin-dashboard-title" className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title} id="admin-dashboard-title">
              Admin Dashboard
            </h1>
            <p className={styles.subtitle}>
              Signed in as <strong>{username}</strong>. Moderate item listings and resolve claim requests.
            </p>
          </div>
          <Button onClick={handleLogout} size="sm" variant="ghost">
            Sign out
          </Button>
        </div>
      </section>

      {/* Main tabs */}
      <div className={styles.tabBar} role="tablist" aria-label="Admin data tabs">
        <button
          aria-selected={mainTab === "items"}
          className={styles.tabButton}
          onClick={() => setMainTab("items")}
          role="tab"
          type="button"
        >
          Items
        </button>
        <button
          aria-selected={mainTab === "claims"}
          className={styles.tabButton}
          onClick={() => setMainTab("claims")}
          role="tab"
          type="button"
        >
          Claims
        </button>
      </div>

      {actionError ? <p className={styles.errorText} role="alert">{actionError}</p> : null}
      {actionSuccess ? <p className={styles.successText} role="status">{actionSuccess}</p> : null}
      {sessionExpired ? (
        <p className={styles.errorText} role="alert">
          Your session expired. Please refresh and sign in again.
        </p>
      ) : null}

      {/* Items panel */}
      {mainTab === "items" ? (
        <section className={styles.section} role="tabpanel">
          <div className={styles.subTabBar} role="tablist" aria-label="Item status tabs">
            <button
              aria-selected={itemSubTab === "PENDING"}
              className={styles.subTabButton}
              onClick={() => setItemSubTab("PENDING")}
              role="tab"
              type="button"
            >
              Submitted
              <span className={styles.subTabCount}>
                {items.filter((i) => i.status === "PENDING").length}
              </span>
            </button>
            <button
              aria-selected={itemSubTab === "APPROVED"}
              className={`${styles.subTabButton} ${styles.subTabApproved}`}
              onClick={() => setItemSubTab("APPROVED")}
              role="tab"
              type="button"
            >
              Approved
              <span className={styles.subTabCount}>
                {items.filter((i) => i.status === "APPROVED").length}
              </span>
            </button>
            <button
              aria-selected={itemSubTab === "REJECTED"}
              className={`${styles.subTabButton} ${styles.subTabRejected}`}
              onClick={() => setItemSubTab("REJECTED")}
              role="tab"
              type="button"
            >
              Rejected
              <span className={styles.subTabCount}>
                {items.filter((i) => i.status === "REJECTED").length}
              </span>
            </button>
          </div>

          {isLoadingItems ? <p className={styles.mutedText}>Loading items...</p> : null}
          {!isLoadingItems && itemsError ? (
            <p className={styles.errorText} role="alert">{itemsError}</p>
          ) : null}
          {!isLoadingItems && !itemsError && visibleItems.length === 0 ? (
            <Card variant="muted">
              <p className={styles.mutedText}>No items in this category.</p>
            </Card>
          ) : null}
          {!isLoadingItems && !itemsError && visibleItems.length > 0 ? (
            <div className={styles.list}>
              {visibleItems.map((item) => {
                const approveKey = `item:${item.id}:APPROVED`;
                const rejectKey = `item:${item.id}:REJECTED`;
                return (
                  <Card key={item.id} className={styles.entryCard}>
                    <div className={styles.entryHeader}>
                      <h2 className={styles.entryTitle}>{item.title}</h2>
                      <span className={`${styles.statusTag} ${statusTagClass(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    <dl className={styles.metaList}>
                      <div className={styles.metaRow}>
                        <dt>Category</dt>
                        <dd>{item.category || "Unknown"}</dd>
                      </div>
                      <div className={styles.metaRow}>
                        <dt>Location</dt>
                        <dd>{item.location || "Unknown"}</dd>
                      </div>
                      <div className={styles.metaRow}>
                        <dt>Submitted</dt>
                        <dd>{formatDate(item.createdAt)}</dd>
                      </div>
                    </dl>
                    <p className={styles.description}>
                      {item.description || "No description provided."}
                    </p>
                    <div className={styles.actions}>
                      <Button
                        disabled={activeActionKey === rejectKey || item.status === "APPROVED"}
                        loading={activeActionKey === approveKey}
                        onClick={() => handleItemStatusChange(item, "APPROVED")}
                        size="sm"
                        variant="success"
                      >
                        Approve
                      </Button>
                      <Button
                        disabled={activeActionKey === approveKey || item.status === "REJECTED"}
                        loading={activeActionKey === rejectKey}
                        onClick={() => handleItemStatusChange(item, "REJECTED")}
                        size="sm"
                        variant="danger"
                      >
                        Reject
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Claims panel */}
      {mainTab === "claims" ? (
        <section className={styles.section} role="tabpanel">
          <div className={styles.subTabBar} role="tablist" aria-label="Claim status tabs">
            <button
              aria-selected={claimSubTab === "PENDING"}
              className={styles.subTabButton}
              onClick={() => setClaimSubTab("PENDING")}
              role="tab"
              type="button"
            >
              Pending
              <span className={styles.subTabCount}>
                {claims.filter((c) => c.status === "PENDING").length}
              </span>
            </button>
            <button
              aria-selected={claimSubTab === "APPROVED"}
              className={`${styles.subTabButton} ${styles.subTabApproved}`}
              onClick={() => setClaimSubTab("APPROVED")}
              role="tab"
              type="button"
            >
              Approved
              <span className={styles.subTabCount}>
                {claims.filter((c) => c.status === "APPROVED").length}
              </span>
            </button>
            <button
              aria-selected={claimSubTab === "REJECTED"}
              className={`${styles.subTabButton} ${styles.subTabRejected}`}
              onClick={() => setClaimSubTab("REJECTED")}
              role="tab"
              type="button"
            >
              Rejected
              <span className={styles.subTabCount}>
                {claims.filter((c) => c.status === "REJECTED").length}
              </span>
            </button>
          </div>

          {isLoadingClaims ? <p className={styles.mutedText}>Loading claims...</p> : null}
          {!isLoadingClaims && claimsError ? (
            <p className={styles.errorText} role="alert">{claimsError}</p>
          ) : null}
          {!isLoadingClaims && !claimsError && visibleClaims.length === 0 ? (
            <Card variant="muted">
              <p className={styles.mutedText}>No claims in this category.</p>
            </Card>
          ) : null}
          {!isLoadingClaims && !claimsError && visibleClaims.length > 0 ? (
            <div className={styles.list}>
              {visibleClaims.map((claim) => {
                const approveKey = `claim:${claim.id}:APPROVED`;
                const rejectKey = `claim:${claim.id}:REJECTED`;
                return (
                  <Card key={claim.id} className={styles.entryCard}>
                    <div className={styles.entryHeader}>
                      <h2 className={styles.entryTitle}>
                        {claim.name}
                        {claim.item?.title ? ` · ${claim.item.title}` : ""}
                      </h2>
                      <span className={`${styles.statusTag} ${statusTagClass(claim.status)}`}>
                        {claim.status}
                      </span>
                    </div>
                    <dl className={styles.metaList}>
                      <div className={styles.metaRow}>
                        <dt>Email</dt>
                        <dd>{claim.email}</dd>
                      </div>
                      <div className={styles.metaRow}>
                        <dt>Lost at</dt>
                        <dd>{claim.locationLost || "Unknown"}</dd>
                      </div>
                      <div className={styles.metaRow}>
                        <dt>Submitted</dt>
                        <dd>{formatDate(claim.createdAt)}</dd>
                      </div>
                    </dl>
                    <p className={styles.description}>{claim.proofOfOwnership}</p>
                    <div className={styles.actions}>
                      <Button
                        disabled={activeActionKey === rejectKey || claim.status === "APPROVED"}
                        loading={activeActionKey === approveKey}
                        onClick={() => handleClaimStatusChange(claim, "APPROVED")}
                        size="sm"
                        variant="success"
                      >
                        Approve
                      </Button>
                      <Button
                        disabled={activeActionKey === approveKey || claim.status === "REJECTED"}
                        loading={activeActionKey === rejectKey}
                        onClick={() => handleClaimStatusChange(claim, "REJECTED")}
                        size="sm"
                        variant="danger"
                      >
                        Reject
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
