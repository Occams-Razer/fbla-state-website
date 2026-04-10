"use client";

import { useEffect, useState } from "react";
import Fade from "@mui/material/Fade";
import Skeleton from "@mui/material/Skeleton";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Tooltip from "@mui/material/Tooltip";
import { Button, Card } from "@/components/ui";
import { fetchAdminItems, fetchClaims, updateClaimStatus, updateItemStatus } from "@/lib/api";
import { isApiError } from "@/lib/api/errors";
import type { Claim, ClaimStatus, Item, ItemStatus } from "@/lib/types";
import styles from "./AdminDashboardPage.module.css";

type MainTab = "items" | "claims";
type ItemSubTab = "PENDING" | "APPROVED" | "REJECTED";
type ClaimSubTab = "PENDING" | "APPROVED" | "REJECTED";

function formatDate(value: string) {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return value || "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric", month: "short", year: "numeric",
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

function SkeletonCard() {
  return (
    <Card className={styles.entryCard}>
      <div className={styles.entryHeader}>
        <Skeleton variant="text" width="55%" height={26} />
        <Skeleton variant="rounded" width={70} height={22} />
      </div>
      <Skeleton variant="text" width="35%" height={18} />
      <Skeleton variant="text" width="40%" height={18} />
      <Skeleton variant="text" width="30%" height={18} />
      <Skeleton variant="rectangular" height={48} sx={{ mt: 1, borderRadius: 2 }} />
    </Card>
  );
}

export function AdminDashboardPage({ username }: { username: string }) {
  const [mainTab, setMainTab] = useState<MainTab>("items");
  const [itemSubTab, setItemSubTab] = useState<ItemSubTab>("PENDING");
  const [claimSubTab, setClaimSubTab] = useState<ClaimSubTab>("PENDING");

  const [items, setItems] = useState<Item[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [isLoadingClaims, setIsLoadingClaims] = useState(true);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [claimsError, setClaimsError] = useState<string | null>(null);

  const [snackbar, setSnackbar] = useState<{ message: string; severity: "success" | "error" } | null>(null);
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
    const actionKey = `item:${item.id}:${nextStatus}`;
    setActiveActionKey(actionKey);
    try {
      const updated = await updateItemStatus(item.id, { status: nextStatus });
      setItems((prev) => prev.map((e) => (e.id === item.id ? updated : e)));
      setSnackbar({ message: `Item "${item.title}" marked ${nextStatus.toLowerCase()}.`, severity: "success" });
    } catch (error) {
      setSnackbar({ message: isApiError(error) ? error.message : "Could not update item status.", severity: "error" });
    } finally {
      setActiveActionKey(null);
    }
  }

  async function handleClaimStatusChange(claim: Claim, nextStatus: ClaimStatus) {
    const actionKey = `claim:${claim.id}:${nextStatus}`;
    setActiveActionKey(actionKey);
    try {
      const updated = await updateClaimStatus(claim.id, { status: nextStatus });
      setClaims((prev) =>
        prev.map((e) =>
          e.id === claim.id ? { ...e, ...updated, item: updated.item ?? e.item } : e,
        ),
      );
      setSnackbar({ message: `Claim by ${claim.name} marked ${nextStatus.toLowerCase()}.`, severity: "success" });
    } catch (error) {
      setSnackbar({ message: isApiError(error) ? error.message : "Could not update claim status.", severity: "error" });
    } finally {
      setActiveActionKey(null);
    }
  }

  const visibleItems  = items.filter((i) => i.status === itemSubTab);
  const visibleClaims = claims.filter((c) => c.status === claimSubTab);

  return (
    <div className={styles.page}>
      {/* Header */}
      <section aria-labelledby="admin-dashboard-title" className={styles.header}>
        <h1 className={styles.title} id="admin-dashboard-title">Admin Dashboard</h1>
        <p className={styles.subtitle}>
          Signed in as <strong>{username}</strong>. Moderate item listings and resolve claim requests.
        </p>
      </section>

      {/* Main tabs */}
      <div className={styles.tabBar} role="tablist" aria-label="Admin data tabs">
        {(["items", "claims"] as MainTab[]).map((tab) => (
          <button
            key={tab}
            aria-selected={mainTab === tab}
            className={styles.tabButton}
            onClick={() => setMainTab(tab)}
            role="tab"
            type="button"
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Items panel */}
      <Fade in={mainTab === "items"} timeout={250} unmountOnExit>
        <section className={styles.section} role="tabpanel">
          {/* Sub-tabs */}
          <div className={styles.subTabBar} role="tablist" aria-label="Item status tabs">
            {([
              { key: "PENDING",  label: "Submitted", cls: "" },
              { key: "APPROVED", label: "Approved",  cls: styles.subTabApproved },
              { key: "REJECTED", label: "Rejected",  cls: styles.subTabRejected },
            ] as { key: ItemSubTab; label: string; cls: string }[]).map(({ key, label, cls }) => (
              <button
                key={key}
                aria-selected={itemSubTab === key}
                className={`${styles.subTabButton} ${cls}`}
                onClick={() => setItemSubTab(key)}
                role="tab"
                type="button"
              >
                {label}
                <span className={styles.subTabCount}>
                  {items.filter((i) => i.status === key).length}
                </span>
              </button>
            ))}
          </div>

          {/* Loading skeletons */}
          {isLoadingItems ? (
            <div className={styles.list}>
              {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
            </div>
          ) : null}

          {!isLoadingItems && itemsError ? (
            <Alert severity="error" sx={{ borderRadius: 2 }}>{itemsError}</Alert>
          ) : null}

          {!isLoadingItems && !itemsError && visibleItems.length === 0 ? (
            <Fade in timeout={300}>
              <div>
                <Card variant="muted">
                  <p className={styles.mutedText}>No items in this category.</p>
                </Card>
              </div>
            </Fade>
          ) : null}

          {!isLoadingItems && !itemsError && visibleItems.length > 0 ? (
            <Fade in timeout={300}>
              <div className={styles.list}>
                {visibleItems.map((item) => {
                  const approveKey = `item:${item.id}:APPROVED`;
                  const rejectKey  = `item:${item.id}:REJECTED`;
                  return (
                    <Card key={item.id} className={styles.entryCard}>
                      <div className={styles.entryHeader}>
                        <h2 className={styles.entryTitle}>{item.title}</h2>
                        <span className={`${styles.statusTag} ${statusTagClass(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <dl className={styles.metaList}>
                        <div className={styles.metaRow}><dt>Category</dt><dd>{item.category || "Unknown"}</dd></div>
                        <div className={styles.metaRow}><dt>Location</dt><dd>{item.location || "Unknown"}</dd></div>
                        <div className={styles.metaRow}><dt>Submitted</dt><dd>{formatDate(item.createdAt)}</dd></div>
                      </dl>
                      <p className={styles.description}>{item.description || "No description provided."}</p>
                      <div className={styles.actions}>
                        <Tooltip title="Make this item visible to the public" arrow>
                          <span>
                            <Button
                              disabled={activeActionKey === rejectKey || item.status === "APPROVED"}
                              loading={activeActionKey === approveKey}
                              onClick={() => handleItemStatusChange(item, "APPROVED")}
                              size="sm"
                              variant="success"
                            >
                              Approve
                            </Button>
                          </span>
                        </Tooltip>
                        <Tooltip title="Hide this item from the public" arrow>
                          <span>
                            <Button
                              disabled={activeActionKey === approveKey || item.status === "REJECTED"}
                              loading={activeActionKey === rejectKey}
                              onClick={() => handleItemStatusChange(item, "REJECTED")}
                              size="sm"
                              variant="danger"
                            >
                              Reject
                            </Button>
                          </span>
                        </Tooltip>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Fade>
          ) : null}
        </section>
      </Fade>

      {/* Claims panel */}
      <Fade in={mainTab === "claims"} timeout={250} unmountOnExit>
        <section className={styles.section} role="tabpanel">
          {/* Sub-tabs */}
          <div className={styles.subTabBar} role="tablist" aria-label="Claim status tabs">
            {([
              { key: "PENDING",  label: "Pending",  cls: "" },
              { key: "APPROVED", label: "Approved", cls: styles.subTabApproved },
              { key: "REJECTED", label: "Rejected", cls: styles.subTabRejected },
            ] as { key: ClaimSubTab; label: string; cls: string }[]).map(({ key, label, cls }) => (
              <button
                key={key}
                aria-selected={claimSubTab === key}
                className={`${styles.subTabButton} ${cls}`}
                onClick={() => setClaimSubTab(key)}
                role="tab"
                type="button"
              >
                {label}
                <span className={styles.subTabCount}>
                  {claims.filter((c) => c.status === key).length}
                </span>
              </button>
            ))}
          </div>

          {isLoadingClaims ? (
            <div className={styles.list}>
              {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
            </div>
          ) : null}

          {!isLoadingClaims && claimsError ? (
            <Alert severity="error" sx={{ borderRadius: 2 }}>{claimsError}</Alert>
          ) : null}

          {!isLoadingClaims && !claimsError && visibleClaims.length === 0 ? (
            <Fade in timeout={300}>
              <div>
                <Card variant="muted">
                  <p className={styles.mutedText}>No claims in this category.</p>
                </Card>
              </div>
            </Fade>
          ) : null}

          {!isLoadingClaims && !claimsError && visibleClaims.length > 0 ? (
            <Fade in timeout={300}>
              <div className={styles.list}>
                {visibleClaims.map((claim) => {
                  const approveKey = `claim:${claim.id}:APPROVED`;
                  const rejectKey  = `claim:${claim.id}:REJECTED`;
                  return (
                    <Card key={claim.id} className={styles.entryCard}>
                      <div className={styles.entryHeader}>
                        <h2 className={styles.entryTitle}>
                          {claim.name}{claim.item?.title ? ` · ${claim.item.title}` : ""}
                        </h2>
                        <span className={`${styles.statusTag} ${statusTagClass(claim.status)}`}>
                          {claim.status}
                        </span>
                      </div>
                      <dl className={styles.metaList}>
                        <div className={styles.metaRow}><dt>Email</dt><dd>{claim.email}</dd></div>
                        <div className={styles.metaRow}><dt>Lost at</dt><dd>{claim.locationLost || "Unknown"}</dd></div>
                        <div className={styles.metaRow}><dt>Submitted</dt><dd>{formatDate(claim.createdAt)}</dd></div>
                      </dl>
                      <p className={styles.description}>{claim.proofOfOwnership}</p>
                      <div className={styles.actions}>
                        <Tooltip title="Approve this claim and notify the claimant" arrow>
                          <span>
                            <Button
                              disabled={activeActionKey === rejectKey || claim.status === "APPROVED"}
                              loading={activeActionKey === approveKey}
                              onClick={() => handleClaimStatusChange(claim, "APPROVED")}
                              size="sm"
                              variant="success"
                            >
                              Approve
                            </Button>
                          </span>
                        </Tooltip>
                        <Tooltip title="Reject this ownership claim" arrow>
                          <span>
                            <Button
                              disabled={activeActionKey === approveKey || claim.status === "REJECTED"}
                              loading={activeActionKey === rejectKey}
                              onClick={() => handleClaimStatusChange(claim, "REJECTED")}
                              size="sm"
                              variant="danger"
                            >
                              Reject
                            </Button>
                          </span>
                        </Tooltip>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Fade>
          ) : null}
        </section>
      </Fade>

      {/* Snackbar for success/error feedback */}
      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
      >
        <Alert
          severity={snackbar?.severity ?? "success"}
          onClose={() => setSnackbar(null)}
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
