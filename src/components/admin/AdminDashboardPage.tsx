"use client";

import { KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useState } from "react";
import Fade from "@mui/material/Fade";
import Skeleton from "@mui/material/Skeleton";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { Button, Card, Modal } from "@/components/ui";
import {
  clearClaimsByStatus,
  clearItemsByStatus,
  fetchAdminItemById,
  fetchAdminItems,
  fetchClaims,
  updateClaimStatus,
  updateItemStatus,
} from "@/lib/api";
import { isApiError } from "@/lib/api/errors";
import type { Claim, ClaimStatus, Item, ItemStatus } from "@/lib/types";
import styles from "./AdminDashboardPage.module.css";

type MainTab = "items" | "claims";
type ItemFilter = "PENDING" | "APPROVED" | "REJECTED" | "CLAIMED";
type ClaimFilter = "PENDING" | "APPROVED" | "REJECTED" | "PICKED_UP";

function formatDate(value: string) {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return value || "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

function formatStatus(status: string): string {
  return status.toLowerCase().replace("_", " ");
}

function statusClass(status: string) {
  switch (status) {
    case "APPROVED":
      return styles.tagApproved;
    case "REJECTED":
      return styles.tagRejected;
    case "PICKED_UP":
    case "CLAIMED":
      return styles.tagClaimed;
    default:
      return styles.tagPending;
  }
}

function SkeletonCard() {
  return (
    <Card className={styles.entryCard}>
      <div className={styles.entryHeader}>
        <Skeleton height={28} variant="text" width="44%" />
        <Skeleton height={24} variant="rounded" width={78} />
      </div>
      <Skeleton height={18} variant="text" width="72%" />
      <Skeleton height={18} variant="text" width="64%" />
      <Skeleton height={18} variant="text" width="48%" />
      <Skeleton height={56} sx={{ borderRadius: 2, mt: 1 }} variant="rectangular" />
    </Card>
  );
}

export function AdminDashboardPage({ username }: { username: string }) {
  const [mainTab, setMainTab] = useState<MainTab>("claims");
  const [itemFilter, setItemFilter] = useState<ItemFilter>("PENDING");
  const [claimFilter, setClaimFilter] = useState<ClaimFilter>("PENDING");

  const [items, setItems] = useState<Item[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [isLoadingClaims, setIsLoadingClaims] = useState(true);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [claimsError, setClaimsError] = useState<string | null>(null);

  const [snackbar, setSnackbar] = useState<{ message: string; severity: "success" | "error" } | null>(null);
  const [activeActionKey, setActiveActionKey] = useState<string | null>(null);
  const [clearingKey, setClearingKey] = useState<string | null>(null);

  const [viewItemId, setViewItemId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<Item | null>(null);
  const [viewItemLoading, setViewItemLoading] = useState(false);

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
        if (ignore) return;
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
        if (!ignore) {
          setClaims(results.claims);
        }
      } catch (error) {
        if (ignore) return;
        setClaimsError(isApiError(error) ? error.message : "Could not load claims.");
      } finally {
        if (!ignore) setIsLoadingClaims(false);
      }
    }

    void loadItems();
    void loadClaims();

    return () => {
      ignore = true;
    };
  }, []);

  const visibleItems = useMemo(() => items.filter((item) => item.status === itemFilter), [items, itemFilter]);
  const visibleClaims = useMemo(() => claims.filter((claim) => claim.status === claimFilter), [claims, claimFilter]);

  async function handleItemStatusChange(item: Item, nextStatus: ItemStatus) {
    const actionKey = `item:${item.id}:${nextStatus}`;
    setActiveActionKey(actionKey);
    try {
      const updated = await updateItemStatus(item.id, { status: nextStatus });
      setItems((previous) => previous.map((entry) => (entry.id === item.id ? updated : entry)));
      setSnackbar({
        message: `Item "${item.title}" marked ${nextStatus.toLowerCase()}.`,
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        message: isApiError(error) ? error.message : "Could not update item status.",
        severity: "error",
      });
    } finally {
      setActiveActionKey(null);
    }
  }

  async function handleClaimStatusChange(claim: Claim, nextStatus: ClaimStatus) {
    const actionKey = `claim:${claim.id}:${nextStatus}`;
    setActiveActionKey(actionKey);
    try {
      const updated = await updateClaimStatus(claim.id, { status: nextStatus });
      setClaims((previous) =>
        previous.map((entry) =>
          entry.id === claim.id ? { ...entry, ...updated, item: updated.item ?? entry.item } : entry,
        ),
      );

      if (updated.item?.id) {
        setItems((previous) =>
          previous.map((item) =>
            item.id === updated.item!.id ? { ...item, ...updated.item } : item,
          ),
        );
      }

      setSnackbar({
        message: `Claim by ${claim.name} marked ${nextStatus.toLowerCase()}.`,
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        message: isApiError(error) ? error.message : "Could not update claim status.",
        severity: "error",
      });
    } finally {
      setActiveActionKey(null);
    }
  }

  async function handleViewItem(id: string) {
    setViewItemId(id);
    setViewItem(null);
    setViewItemLoading(true);
    try {
      const item = await fetchAdminItemById(id);
      setViewItem(item);
    } catch {
      setViewItem(null);
    } finally {
      setViewItemLoading(false);
    }
  }

  function handleCardKeyDown(event: ReactKeyboardEvent<HTMLElement>, onActivate: () => void) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onActivate();
    }
  }

  async function handleClearItems(status: "APPROVED" | "REJECTED") {
    const totalForStatus = items.filter((item) => item.status === status).length;
    if (totalForStatus === 0) {
      return;
    }

    const key = `clear:items:${status}`;
    setClearingKey(key);
    try {
      const { cleared } = await clearItemsByStatus(status);
      setItems((previous) => previous.filter((item) => item.status !== status));
      setSnackbar({
        message: `Cleared ${cleared} ${status.toLowerCase()} item${cleared === 1 ? "" : "s"}.`,
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        message: isApiError(error) ? error.message : "Could not clear items.",
        severity: "error",
      });
    } finally {
      setClearingKey(null);
    }
  }

  async function handleClearClaims(status: "APPROVED" | "REJECTED" | "PICKED_UP") {
    const totalForStatus = claims.filter((claim) => claim.status === status).length;
    if (totalForStatus === 0) {
      return;
    }

    const key = `clear:claims:${status}`;
    setClearingKey(key);
    try {
      const { cleared } = await clearClaimsByStatus(status);
      setClaims((previous) => previous.filter((claim) => claim.status !== status));
      setSnackbar({
        message: `Cleared ${cleared} ${status.toLowerCase()} claim${cleared === 1 ? "" : "s"}.`,
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        message: isApiError(error) ? error.message : "Could not clear claims.",
        severity: "error",
      });
    } finally {
      setClearingKey(null);
    }
  }

  return (
    <div className={styles.page}>
      <section aria-labelledby="admin-dashboard-title" className={styles.header}>
        <h1 className={styles.title} id="admin-dashboard-title">Admin Dashboard</h1>
        <p className={styles.subtitle}>
          Moderate items and review claim requests. Signed in as <strong>{username}</strong>.
        </p>
      </section>

      <div className={styles.tabBar} role="tablist" aria-label="Admin data tabs">
        <button
          aria-selected={mainTab === "items"}
          className={[styles.tabButton, mainTab === "items" ? styles.tabButtonActive : ""].filter(Boolean).join(" ")}
          onClick={() => setMainTab("items")}
          role="tab"
          type="button"
        >
          Items
        </button>
        <button
          aria-selected={mainTab === "claims"}
          className={[styles.tabButton, mainTab === "claims" ? styles.tabButtonActive : ""].filter(Boolean).join(" ")}
          onClick={() => setMainTab("claims")}
          role="tab"
          type="button"
        >
          Claims
        </button>
      </div>

      <Fade in={mainTab === "items"} timeout={200} unmountOnExit>
        <section className={styles.section} role="tabpanel">
          <div className={styles.filterRow}>
            <select
              className={styles.select}
              onChange={(event) => setItemFilter(event.target.value as ItemFilter)}
              value={itemFilter}
            >
              <option value="PENDING">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CLAIMED">Claimed</option>
            </select>
            <p className={styles.countLabel}>{visibleItems.length} items</p>
          </div>

          {(itemFilter === "APPROVED" || itemFilter === "REJECTED") ? (
            <div className={styles.clearWrap}>
              <Button
                disabled={visibleItems.length === 0}
                loading={clearingKey === `clear:items:${itemFilter}`}
                onClick={() => handleClearItems(itemFilter)}
                size="sm"
                variant="danger"
              >
                {itemFilter === "APPROVED" ? "Clear Approved" : "Clear Rejected"}
              </Button>
            </div>
          ) : null}

          {isLoadingItems ? (
            <div className={styles.list}>
              {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
            </div>
          ) : null}

          {!isLoadingItems && itemsError ? (
            <Alert severity="error" sx={{ borderRadius: 2 }}>{itemsError}</Alert>
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
                  <Card
                    aria-label={`View details for ${item.title}`}
                    className={styles.entryCard}
                    key={item.id}
                    onClick={() => void handleViewItem(item.id)}
                    onKeyDown={(event) => handleCardKeyDown(event, () => void handleViewItem(item.id))}
                    role="button"
                    tabIndex={0}
                  >
                    <div className={styles.entryHeader}>
                      <h2 className={styles.entryTitle}>{item.title}</h2>
                      <span className={[styles.statusTag, statusClass(item.status)].join(" ")}>
                        {formatStatus(item.status)}
                      </span>
                    </div>
                    <p className={styles.inlineMeta}>{item.category || "Unknown"} - {item.location || "Unknown"} - {formatDate(item.createdAt)}</p>
                    <p className={styles.description}>{item.description || "No description provided."}</p>

                    <div className={styles.actions}>
                      <Button
                        disabled={activeActionKey === rejectKey || item.status === "APPROVED"}
                        loading={activeActionKey === approveKey}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleItemStatusChange(item, "APPROVED");
                        }}
                        size="sm"
                        variant="success"
                      >
                        Approve
                      </Button>
                      <Button
                        disabled={activeActionKey === approveKey || item.status === "REJECTED"}
                        loading={activeActionKey === rejectKey}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleItemStatusChange(item, "REJECTED");
                        }}
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
      </Fade>

      <Fade in={mainTab === "claims"} timeout={200} unmountOnExit>
        <section className={styles.section} role="tabpanel">
          <div className={styles.filterRow}>
            <select
              className={styles.select}
              onChange={(event) => setClaimFilter(event.target.value as ClaimFilter)}
              value={claimFilter}
            >
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="PICKED_UP">Picked Up</option>
            </select>
            <p className={styles.countLabel}>{visibleClaims.length} claims</p>
          </div>

          {(claimFilter === "APPROVED" || claimFilter === "REJECTED" || claimFilter === "PICKED_UP") ? (
            <div className={styles.clearWrap}>
              <Button
                disabled={visibleClaims.length === 0}
                loading={clearingKey === `clear:claims:${claimFilter}`}
                onClick={() => handleClearClaims(claimFilter)}
                size="sm"
                variant="danger"
              >
                {claimFilter === "PICKED_UP" ? "Clear Picked Up" : `Clear ${formatStatus(claimFilter)}`}
              </Button>
            </div>
          ) : null}

          {isLoadingClaims ? (
            <div className={styles.list}>
              {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
            </div>
          ) : null}

          {!isLoadingClaims && claimsError ? (
            <Alert severity="error" sx={{ borderRadius: 2 }}>{claimsError}</Alert>
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
                const pickedUpKey = `claim:${claim.id}:PICKED_UP`;
                const claimItemId = claim.item?.id;
                const isCardClickable = Boolean(claimItemId);

                return (
                  <Card
                    aria-label={isCardClickable ? `View item for claim by ${claim.name}` : `Claim by ${claim.name}`}
                    className={styles.entryCard}
                    key={claim.id}
                    onClick={isCardClickable ? () => void handleViewItem(claimItemId as string) : undefined}
                    onKeyDown={
                      isCardClickable
                        ? (event) => handleCardKeyDown(event, () => void handleViewItem(claimItemId as string))
                        : undefined
                    }
                    role={isCardClickable ? "button" : undefined}
                    tabIndex={isCardClickable ? 0 : undefined}
                  >
                    <div className={styles.entryHeader}>
                      <div>
                        <h2 className={styles.entryTitle}>{claim.name}</h2>
                        <p className={styles.inlineMeta}>
                          Claiming: {claim.item?.title ?? "Unknown item"} - {formatDate(claim.createdAt)}
                        </p>
                      </div>
                      <span className={[styles.statusTag, statusClass(claim.status)].join(" ")}>
                        {formatStatus(claim.status)}
                      </span>
                    </div>

                    <div className={styles.claimGrid}>
                      <p><span>Email</span>{claim.email}</p>
                      <p><span>Lost Location</span>{claim.locationLost || "Unknown"}</p>
                    </div>
                    <p className={styles.claimProof}>
                      <span>Proof of Ownership</span>
                      {claim.proofOfOwnership}
                    </p>

                    <div className={styles.actions}>
                      {claimItemId ? (
                        <Button
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleViewItem(claimItemId);
                          }}
                          size="sm"
                          variant="secondary"
                        >
                          View Item
                        </Button>
                      ) : null}
                      <Button
                        disabled={
                          activeActionKey === rejectKey ||
                          activeActionKey === pickedUpKey ||
                          claim.status === "APPROVED" ||
                          claim.status === "PICKED_UP"
                        }
                        loading={activeActionKey === approveKey}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleClaimStatusChange(claim, "APPROVED");
                        }}
                        size="sm"
                        variant="success"
                      >
                        Approve
                      </Button>
                      <Button
                        disabled={
                          activeActionKey === approveKey ||
                          activeActionKey === pickedUpKey ||
                          claim.status === "REJECTED" ||
                          claim.status === "PICKED_UP"
                        }
                        loading={activeActionKey === rejectKey}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleClaimStatusChange(claim, "REJECTED");
                        }}
                        size="sm"
                        variant="danger"
                      >
                        Reject
                      </Button>
                      {claim.status === "APPROVED" ? (
                        <Button
                          disabled={activeActionKey === approveKey || activeActionKey === rejectKey}
                          loading={activeActionKey === pickedUpKey}
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleClaimStatusChange(claim, "PICKED_UP");
                          }}
                          size="sm"
                        >
                          Mark Picked Up
                        </Button>
                      ) : null}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : null}
        </section>
      </Fade>

      <Modal
        isOpen={viewItemId !== null}
        onClose={() => {
          setViewItemId(null);
          setViewItem(null);
        }}
        title={viewItem?.title ?? (viewItemLoading ? "Loading..." : "Item details")}
      >
        {viewItemLoading ? (
          <div className={styles.modalLoading}>
            {[1, 2, 3].map((n) => (
              <Skeleton height={22} key={n} sx={{ borderRadius: 1 }} variant="text" />
            ))}
          </div>
        ) : viewItem ? (
          <div className={styles.modalBody}>
            {viewItem.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={`Photo of ${viewItem.title}`} className={styles.modalImage} src={viewItem.imageUrl} />
            ) : null}
            <p className={styles.modalMeta}><span>Status</span>{formatStatus(viewItem.status)}</p>
            <p className={styles.modalMeta}><span>Category</span>{viewItem.category || "Unknown"}</p>
            <p className={styles.modalMeta}><span>Location</span>{viewItem.location || "Unknown"}</p>
            <p className={styles.modalMeta}><span>Date found</span>{formatDate(viewItem.dateFound)}</p>
            <p className={styles.modalMeta}><span>Submitted</span>{formatDate(viewItem.createdAt)}</p>
            {viewItem.description ? <p className={styles.modalDescription}>{viewItem.description}</p> : null}
          </div>
        ) : (
          <p className={styles.mutedText}>Could not load item details.</p>
        )}
      </Modal>

      <Snackbar
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        open={!!snackbar}
      >
        <Alert
          onClose={() => setSnackbar(null)}
          severity={snackbar?.severity ?? "success"}
          sx={{ borderRadius: 2, width: "100%" }}
        >
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
