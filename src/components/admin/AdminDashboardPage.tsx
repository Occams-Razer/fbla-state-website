"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card } from "@/components/ui";
import { fetchAdminItems, fetchClaims, logoutAdmin, updateClaimStatus, updateItemStatus } from "@/lib/api";
import { isApiError } from "@/lib/api/errors";
import type { Claim, ClaimStatus, Item, ItemStatus } from "@/lib/types";
import styles from "./AdminDashboardPage.module.css";

type TabKey = "items" | "claims";
type ItemFilter = "ALL" | ItemStatus;

const ITEM_FILTER_OPTIONS: Array<{ label: string; value: ItemFilter }> = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Claimed", value: "CLAIMED" },
];

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

export function AdminDashboardPage({ username }: { username: string }) {
  const [activeTab, setActiveTab] = useState<TabKey>("items");
  const [itemFilter, setItemFilter] = useState<ItemFilter>("ALL");
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

  const visibleItems = useMemo(() => {
    if (itemFilter === "ALL") {
      return items;
    }

    return items.filter((item) => item.status === itemFilter);
  }, [itemFilter, items]);

  useEffect(() => {
    let ignore = false;

    async function loadItems() {
      setIsLoadingItems(true);
      setItemsError(null);

      try {
        const results = await fetchAdminItems();
        if (!ignore) {
          setItems(results.items);
        }
      } catch (error) {
        if (ignore) {
          return;
        }

        if (isApiError(error) && error.status === 401) {
          setSessionExpired(true);
          setItems([]);
          setClaims([]);
          return;
        }

        if (isApiError(error)) {
          setItemsError(error.message);
        } else {
          setItemsError("Could not load moderation items.");
        }
      } finally {
        if (!ignore) {
          setIsLoadingItems(false);
        }
      }
    }

    async function loadClaims() {
      setIsLoadingClaims(true);
      setClaimsError(null);

      try {
        const results = await fetchClaims();
        if (!ignore) {
          setClaims(results.claims);
        }
      } catch (error) {
        if (ignore) {
          return;
        }

        if (isApiError(error) && error.status === 401) {
          setSessionExpired(true);
          setItems([]);
          setClaims([]);
          return;
        }

        if (isApiError(error)) {
          setClaimsError(error.message);
        } else {
          setClaimsError("Could not load claims.");
        }
      } finally {
        if (!ignore) {
          setIsLoadingClaims(false);
        }
      }
    }

    void loadItems();
    void loadClaims();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleItemStatusChange(item: Item, nextStatus: ItemStatus) {
    setActionError(null);
    setActionSuccess(null);
    const actionKey = `item:${item.id}:${nextStatus}`;
    setActiveActionKey(actionKey);

    try {
      const updated = await updateItemStatus(item.id, { status: nextStatus });
      setItems((previous) =>
        previous.map((entry) => (entry.id === item.id ? updated : entry)),
      );
      setActionSuccess(`Item "${item.title}" marked ${nextStatus.toLowerCase()}.`);
    } catch (error) {
      if (isApiError(error)) {
        setActionError(error.message);
      } else {
        setActionError("Could not update item status.");
      }
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
      setClaims((previous) =>
        previous.map((entry) =>
          entry.id === claim.id
            ? { ...entry, ...updated, item: updated.item ?? entry.item }
            : entry,
        ),
      );
      setActionSuccess(`Claim by ${claim.name} marked ${nextStatus.toLowerCase()}.`);
    } catch (error) {
      if (isApiError(error)) {
        setActionError(error.message);
      } else {
        setActionError("Could not update claim status.");
      }
    } finally {
      setActiveActionKey(null);
    }
  }

  async function handleLogout() {
    try {
      await logoutAdmin();
    } catch {
      // ignore
    }
    window.location.href = "/login";
  }

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

      <div className={styles.tabBar} role="tablist" aria-label="Admin data tabs">
        <button
          aria-selected={activeTab === "items"}
          className={styles.tabButton}
          onClick={() => setActiveTab("items")}
          role="tab"
          type="button"
        >
          Items
        </button>
        <button
          aria-selected={activeTab === "claims"}
          className={styles.tabButton}
          onClick={() => setActiveTab("claims")}
          role="tab"
          type="button"
        >
          Claims
        </button>
      </div>

      {actionError ? (
        <p className={styles.errorText} role="alert">
          {actionError}
        </p>
      ) : null}
      {actionSuccess ? (
        <p className={styles.successText} role="status">
          {actionSuccess}
        </p>
      ) : null}
      {sessionExpired ? (
        <p className={styles.errorText} role="alert">
          Your session expired. Please refresh and sign in again.
        </p>
      ) : null}

      {activeTab === "items" ? (
        <section className={styles.section} role="tabpanel">
          <Card className={styles.filterCard} variant="outlined">
            <label className={styles.filterLabel} htmlFor="item-status-filter">
              Filter by status
            </label>
            <select
              className={styles.select}
              id="item-status-filter"
              onChange={(event) => setItemFilter(event.target.value as ItemFilter)}
              value={itemFilter}
            >
              {ITEM_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Card>

          {isLoadingItems ? <p className={styles.mutedText}>Loading items...</p> : null}
          {!isLoadingItems && itemsError ? (
            <p className={styles.errorText} role="alert">
              {itemsError}
            </p>
          ) : null}

          {!isLoadingItems && !itemsError && visibleItems.length === 0 ? (
            <Card variant="muted">
              <p className={styles.mutedText}>No items match this filter.</p>
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
                      <span className={styles.statusTag}>{item.status}</span>
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

      {activeTab === "claims" ? (
        <section className={styles.section} role="tabpanel">
          {isLoadingClaims ? <p className={styles.mutedText}>Loading claims...</p> : null}
          {!isLoadingClaims && claimsError ? (
            <p className={styles.errorText} role="alert">
              {claimsError}
            </p>
          ) : null}

          {!isLoadingClaims && !claimsError && claims.length === 0 ? (
            <Card variant="muted">
              <p className={styles.mutedText}>No claims have been submitted yet.</p>
            </Card>
          ) : null}

          {!isLoadingClaims && !claimsError && claims.length > 0 ? (
            <div className={styles.list}>
              {claims.map((claim) => {
                const approveKey = `claim:${claim.id}:APPROVED`;
                const rejectKey = `claim:${claim.id}:REJECTED`;

                return (
                  <Card key={claim.id} className={styles.entryCard}>
                    <div className={styles.entryHeader}>
                      <h2 className={styles.entryTitle}>
                        {claim.name}
                        {claim.item?.title ? ` · ${claim.item.title}` : ""}
                      </h2>
                      <span className={styles.statusTag}>{claim.status}</span>
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
