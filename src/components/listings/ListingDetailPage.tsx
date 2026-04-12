"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, Input, Modal } from "@/components/ui";
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

interface SessionState {
  authenticated: boolean;
  username?: string;
}

type ClaimFormErrors = Partial<Record<keyof ClaimFormState, string>>;

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
  const [session, setSession] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [formValues, setFormValues] = useState<ClaimFormState>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<ClaimFormErrors>({});
  const [claimSubmitError, setClaimSubmitError] = useState<string | null>(null);
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  const [submittedClaimId, setSubmittedClaimId] = useState<string | null>(null);
  const [copiedClaimId, setCopiedClaimId] = useState(false);

  useEffect(() => {
    let ignore = false;

    fetch("/api/auth/session")
      .then((response) => response.json() as Promise<SessionState>)
      .then((payload) => {
        if (!ignore) {
          setSession(payload);
        }
      })
      .catch(() => {
        if (!ignore) {
          setSession({ authenticated: false });
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

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
            setLoadError("This listing was not found or may have been removed.");
          } else {
            setLoadError(error.message);
          }
          return;
        }

        setLoadError("We could not load this listing right now. Please try again.");
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

  function handleRequestClick() {
    if (session && !session.authenticated) {
      router.push("/login");
      return;
    }

    setClaimSubmitError(null);
    setFormErrors({});
    setIsClaimModalOpen(true);
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
        setClaimSubmitError("We could not submit your claim. Please try again.");
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
          <p className={styles.stateText}>Please wait while we fetch the item details.</p>
        </Card>
      </section>
    );
  }

  if (loadError || !item) {
    return (
      <section className={styles.page}>
        <Card className={styles.stateCard} role="alert" variant="muted">
          <h1 className={styles.stateTitle}>Unable to load listing</h1>
          <p className={styles.stateText}>{loadError ?? "Listing not found."}</p>
          <div className={styles.stateActions}>
            <Button onClick={() => setRetryCount((count) => count + 1)} variant="secondary">
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
  const requestLabel = session?.authenticated ? "Request This Item" : "Sign In to Request";
  const proofErrorId = formErrors.proofOfOwnership ? "proof-of-ownership-error" : undefined;

  return (
    <div className={styles.page}>
      <Link className={styles.backLink} href="/search">
        < Back to Search
      </Link>

      <section aria-labelledby="listing-detail-title" className={styles.detailLayout}>
        <div className={styles.mediaWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={`Photo of ${item.title}`}
            className={styles.image}
            src={item.imageUrl}
          />
        </div>

        <div className={styles.infoPanel}>
          <span className={styles.categoryPill}>{item.category || "Other"}</span>

          <h1 className={styles.title} id="listing-detail-title">
            {item.title}
          </h1>

          <p className={styles.description}>
            {item.description || "No additional description was provided for this item."}
          </p>

          <div className={styles.metaBlock}>
            <p className={styles.metaTitle}>Found at</p>
            <p className={styles.metaValue}>{item.location || "Unknown location"}</p>
          </div>

          <div className={styles.metaBlock}>
            <p className={styles.metaTitle}>Date found</p>
            <p className={styles.metaValue}>{formatDate(displayDate)}</p>
          </div>

          <Button
            className={styles.requestButton}
            disabled={!isClaimable}
            onClick={handleRequestClick}
            size="lg"
            type="button"
          >
            {requestLabel}
          </Button>

          {!isClaimable ? (
            <p className={styles.actionHint}>
              This item is currently {item.status.toLowerCase()} and cannot be claimed.
            </p>
          ) : null}
        </div>
      </section>

      <Modal
        description="Fill in the details below so our team can verify ownership."
        isOpen={isClaimModalOpen}
        onClose={() => {
          if (!isSubmittingClaim) {
            setIsClaimModalOpen(false);
          }
        }}
        title={`Claim "${item.title}"`}
      >
        <form className={styles.claimForm} noValidate onSubmit={handleClaimSubmit}>
          <Input
            autoComplete="name"
            error={formErrors.name}
            label="Full Name"
            onChange={(event) => updateFormValue("name", event.target.value)}
            required
            value={formValues.name}
          />

          <Input
            autoComplete="email"
            error={formErrors.email}
            label="School Email"
            onChange={(event) => updateFormValue("email", event.target.value)}
            required
            type="email"
            value={formValues.email}
          />

          <div className={styles.textareaField}>
            <label className={styles.textareaLabel} htmlFor="proof-of-ownership">
              Proof of Ownership <span className={styles.required}>*</span>
            </label>
            <textarea
              aria-describedby={proofErrorId}
              aria-invalid={formErrors.proofOfOwnership ? true : undefined}
              className={styles.textarea}
              id="proof-of-ownership"
              onChange={(event) => updateFormValue("proofOfOwnership", event.target.value)}
              placeholder="Describe unique details about the item to prove that it is yours..."
              required
              rows={4}
              value={formValues.proofOfOwnership}
            />
            {formErrors.proofOfOwnership ? (
              <p className={styles.textareaError} id={proofErrorId} role="alert">
                {formErrors.proofOfOwnership}
              </p>
            ) : null}
          </div>

          <Input
            error={formErrors.locationLost}
            label="Location Lost"
            onChange={(event) => updateFormValue("locationLost", event.target.value)}
            required
            value={formValues.locationLost}
          />

          {claimSubmitError ? (
            <p className={styles.submitError} role="alert">
              {claimSubmitError}
            </p>
          ) : null}

          <Button fullWidth loading={isSubmittingClaim} size="lg" type="submit">
            Submit claim
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={submittedClaimId !== null}
        onClose={() => { setSubmittedClaimId(null); setCopiedClaimId(false); }}
        title="Claim submitted"
      >
        <div className={styles.claimSuccessBody}>
          <p className={styles.claimSuccessText}>
            Your claim has been received. Save your Claim ID. You will need it with your
            email to track your claim status.
          </p>
          <div className={styles.claimIdBox}>
            <span className={styles.claimIdValue}>{submittedClaimId}</span>
            <button
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
              Track claim status
            </Link>
            <Button
              onClick={() => { setSubmittedClaimId(null); setCopiedClaimId(false); }}
              variant="secondary"
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
