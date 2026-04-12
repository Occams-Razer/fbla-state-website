"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { Badge, Button, Card, Input, Modal } from "@/components/ui";
import type { BadgeVariant } from "@/components/ui/Badge";
import { createClaim, fetchItemById } from "@/lib/api";
import { isApiError } from "@/lib/api/errors";
import type { CreateClaimInput, Item } from "@/lib/types";
import styles from "./ListingDetailPage.module.css";

interface ClaimFormState {
  name: string;
  email: string;
  proofOfOwnership: string;
  locationLost: string;
}

type ClaimFormErrors = Partial<Record<keyof ClaimFormState, string>>;

const STATUS_VARIANT: Record<Item["status"], BadgeVariant> = {
  APPROVED: "success",
  CLAIMED: "info",
  PENDING: "warning",
  REJECTED: "danger",
};

const INITIAL_FORM: ClaimFormState = {
  email: "",
  locationLost: "",
  name: "",
  proofOfOwnership: "",
};

function formatDate(value: string) {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value || "Date not provided";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
}

function validateClaimForm(values: ClaimFormState): ClaimFormErrors {
  const errors: ClaimFormErrors = {};

  if (values.name.trim().length < 2) {
    errors.name = "Please enter your full name.";
  }

  const normalizedEmail = values.email.trim();
  if (!normalizedEmail) {
    errors.email = "Email is required so we can contact you.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.email = "Enter a valid email address.";
  }

  if (values.proofOfOwnership.trim().length < 10) {
    errors.proofOfOwnership =
      "Share enough details to prove this is your item (at least 10 characters).";
  }

  if (values.locationLost.trim().length < 2) {
    errors.locationLost = "Tell us where you last had this item.";
  }

  return errors;
}

function readItemId(rawParam: string | string[] | undefined) {
  if (typeof rawParam === "string" && rawParam.trim().length > 0) {
    return rawParam;
  }

  if (Array.isArray(rawParam) && rawParam.length > 0) {
    return rawParam[0] ?? "";
  }

  return "";
}

export function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = useMemo(() => readItemId(params.id), [params.id]);

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [formValues, setFormValues] = useState<ClaimFormState>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<ClaimFormErrors>({});
  const [claimSubmitError, setClaimSubmitError] = useState<string | null>(null);
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [claimSnackbarOpen, setClaimSnackbarOpen] = useState(false);
  const [submittedClaimId, setSubmittedClaimId] = useState<string | null>(null);
  const [copiedClaimId, setCopiedClaimId] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadItem() {
      if (!itemId) {
        setLoading(false);
        setLoadError("The listing link is invalid.");
        return;
      }

      setLoading(true);
      setLoadError(null);

      try {
        const result = await fetchItemById(itemId);
        if (!ignore) {
          setItem(result);
        }
      } catch (error) {
        if (ignore) {
          return;
        }

        if (isApiError(error)) {
          if (error.status === 404) {
            setLoadError(
              "This listing was not found or may have been removed.",
            );
          } else {
            setLoadError(error.message);
          }
          return;
        }

        setLoadError(
          "We could not load this listing right now. Please try again.",
        );
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadItem();

    return () => {
      ignore = true;
    };
  }, [itemId, retryCount]);

  function handleOpenClaimModal() {
    setFormErrors({});
    setClaimSubmitError(null);
    setIsClaimModalOpen(true);
  }

  function handleCloseClaimModal() {
    if (isSubmittingClaim) {
      return;
    }

    setIsClaimModalOpen(false);
  }

  function updateFormValue(field: keyof ClaimFormState, value: string) {
    setFormValues((previous) => ({
      ...previous,
      [field]: value,
    }));

    setFormErrors((previous) => {
      if (!previous[field]) {
        return previous;
      }

      return { ...previous, [field]: undefined };
    });
  }

  async function handleClaimSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!item) {
      return;
    }

    const nextErrors = validateClaimForm(formValues);
    setFormErrors(nextErrors);
    setClaimSubmitError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload: CreateClaimInput = {
      email: formValues.email.trim(),
      itemId: item.id,
      locationLost: formValues.locationLost.trim(),
      name: formValues.name.trim(),
      proofOfOwnership: formValues.proofOfOwnership.trim(),
    };

    try {
      setIsSubmittingClaim(true);
      const result = await createClaim(payload);
      setFormValues(INITIAL_FORM);
      setFormErrors({});
      setIsClaimModalOpen(false);
      setSubmittedClaimId(result.id);
    } catch (error) {
      if (isApiError(error)) {
        setClaimSubmitError(error.message);
      } else {
        setClaimSubmitError(
          "We could not submit your claim. Please try again.",
        );
      }
    } finally {
      setIsSubmittingClaim(false);
    }
  }

  if (loading) {
    return (
      <section aria-busy="true" aria-live="polite" className={styles.page}>
        <Card className={styles.stateCard} variant="muted">
          <h1 className={styles.stateTitle}>Loading listing...</h1>
          <p className={styles.stateText}>
            Please wait while we fetch the item details.
          </p>
        </Card>
      </section>
    );
  }

  if (loadError || !item) {
    return (
      <section className={styles.page}>
        <Card className={styles.stateCard} role="alert" variant="muted">
          <h1 className={styles.stateTitle}>Unable to load listing</h1>
          <p className={styles.stateText}>
            {loadError ?? "Listing not found."}
          </p>
          <div className={styles.stateActions}>
            <Button
              onClick={() => setRetryCount((count) => count + 1)}
              variant="secondary"
            >
              Try again
            </Button>
            <Button onClick={() => router.push("/search")} variant="ghost">
              Back to search
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  const displayDate = item.dateFound || item.createdAt;
  const isClaimable = item.status === "APPROVED";
  const badgeVariant = STATUS_VARIANT[item.status] ?? "neutral";
  const proofErrorId = formErrors.proofOfOwnership
    ? "proof-of-ownership-error"
    : undefined;

  return (
    <div className={styles.page}>
      <section
        aria-labelledby="listing-detail-title"
        className={styles.detailLayout}
      >
        <div className={styles.mediaWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={item.title}
            className={styles.image}
            src={item.imageUrl}
          />
        </div>

        <Card className={styles.infoCard}>
          <div className={styles.headerRow}>
            <h1 className={styles.title} id="listing-detail-title">
              {item.title}
            </h1>
            {/* <Badge variant={badgeVariant}>{item.status.toLowerCase()}</Badge> */}
          </div>

          <p className={styles.description}>
            {item.description ||
              "No additional description was provided for this item."}
          </p>

          <dl className={styles.metaList}>
            <div className={styles.metaRow}>
              <dt className={styles.metaLabel}>Category</dt>
              <dd className={styles.metaValue}>
                {item.category || "Uncategorized"}
              </dd>
            </div>
            <div className={styles.metaRow}>
              <dt className={styles.metaLabel}>Found at</dt>
              <dd className={styles.metaValue}>
                {item.location || "Unknown location"}
              </dd>
            </div>
            <div className={styles.metaRow}>
              <dt className={styles.metaLabel}>Date found</dt>
              <dd className={styles.metaValue}>{formatDate(displayDate)}</dd>
            </div>
            <div className={styles.metaRow}>
              <dt className={styles.metaLabel}>Listing ID</dt>
              <dd className={styles.metaValue}>{item.id}</dd>
            </div>
          </dl>

          <div className={styles.actionRow}>
            <Button
              aria-label={`Claim ${item.title}`}
              disabled={!isClaimable}
              onClick={handleOpenClaimModal}
              size="lg"
            >
              Claim this item
            </Button>
            {!isClaimable ? (
              <p className={styles.actionHint}>
                This item is currently {item.status.toLowerCase()} and cannot be
                claimed.
              </p>
            ) : null}
          </div>
        </Card>
      </section>

      <Modal
        description="Fill in the details below so our team can verify ownership."
        isOpen={isClaimModalOpen}
        onClose={handleCloseClaimModal}
        title="Submit a claim"
      >
        <form
          className={styles.claimForm}
          noValidate
          onSubmit={handleClaimSubmit}
        >
          <Input
            autoComplete="name"
            error={formErrors.name}
            label="Full name"
            onChange={(event) => updateFormValue("name", event.target.value)}
            required
            value={formValues.name}
          />

          <Input
            autoComplete="email"
            error={formErrors.email}
            label="Email address"
            onChange={(event) => updateFormValue("email", event.target.value)}
            required
            type="email"
            value={formValues.email}
          />

          <Input
            error={formErrors.locationLost}
            hint="Example: Gym locker room, cafeteria table, room 204."
            label="Where did you lose it?"
            onChange={(event) =>
              updateFormValue("locationLost", event.target.value)
            }
            required
            value={formValues.locationLost}
          />

          <div className={styles.textareaField}>
            <label
              className={styles.textareaLabel}
              htmlFor="proof-of-ownership"
            >
              Proof of ownership <span className={styles.required}>*</span>
            </label>
            <textarea
              aria-describedby={proofErrorId}
              aria-invalid={formErrors.proofOfOwnership ? true : undefined}
              className={styles.textarea}
              id="proof-of-ownership"
              onChange={(event) =>
                updateFormValue("proofOfOwnership", event.target.value)
              }
              placeholder="Describe unique details (brand, color, stickers, lock screen, etc.)"
              required
              rows={5}
              value={formValues.proofOfOwnership}
            />
            {formErrors.proofOfOwnership ? (
              <p
                className={styles.textareaError}
                id={proofErrorId}
                role="alert"
              >
                {formErrors.proofOfOwnership}
              </p>
            ) : null}
          </div>

          {claimSubmitError ? (
            <p className={styles.submitError} role="alert">
              {claimSubmitError}
            </p>
          ) : null}

          <div className={styles.claimActions}>
            <Button
              aria-label="Cancel claim form"
              disabled={isSubmittingClaim}
              onClick={handleCloseClaimModal}
              type="button"
              variant="secondary"
            >
              Cancel
            </Button>
            <Button aria-label="Submit claim" loading={isSubmittingClaim} type="submit">
              Submit claim
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={submittedClaimId !== null}
        onClose={() => {
          setSubmittedClaimId(null);
          setCopiedClaimId(false);
        }}
        title="Claim submitted!"
      >
        <div className={styles.claimSuccessBody}>
          <p className={styles.claimSuccessText}>
            Your claim has been received. Save your Claim ID — you will need it
            along with your email to track your claim status.
          </p>
          <div className={styles.claimIdBox}>
            <span className={styles.claimIdValue}>{submittedClaimId}</span>
            <button
              aria-label="Copy claim ID"
              className={styles.claimIdCopy}
              onClick={() => {
                if (submittedClaimId) {
                  void navigator.clipboard.writeText(submittedClaimId);
                  setCopiedClaimId(true);
                  setTimeout(() => setCopiedClaimId(false), 2000);
                }
              }}
              type="button"
            >
              {copiedClaimId ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className={styles.claimSuccessActions}>
            <Link
              className={styles.claimTrackLink}
              href={`/claims/status?claimId=${submittedClaimId ?? ""}`}
            >
              Track claim status →
            </Link>
            <Button
              onClick={() => {
                setSubmittedClaimId(null);
                setCopiedClaimId(false);
              }}
              variant="secondary"
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>

      <Snackbar
        autoHideDuration={4000}
        onClose={() => setClaimSnackbarOpen(false)}
        open={claimSnackbarOpen}
      >
        <Alert
          onClose={() => setClaimSnackbarOpen(false)}
          severity="success"
          sx={{ borderRadius: 2, width: "100%" }}
        >
          Claim submitted successfully. An admin will review it soon.
        </Alert>
      </Snackbar>
    </div>
  );
}
