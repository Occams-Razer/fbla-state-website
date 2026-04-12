"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { Button, Card, Input } from "@/components/ui";
import { createItem, uploadItemImage } from "@/lib/api";
import { isApiError } from "@/lib/api/errors";
import type { CreateItemInput } from "@/lib/types";
import styles from "./SubmitItemPage.module.css";

interface SubmitFormState {
  title: string;
  category: string;
  description: string;
  location: string;
  dateFound: string;
}

type FormErrors = Partial<Record<keyof SubmitFormState | "image", string>>;

type UploadStatus = "idle" | "uploading" | "uploaded";

const CATEGORY_OPTIONS = [
  { label: "Select a category", value: "" },
  { label: "Electronics", value: "Electronics" },
  { label: "Clothing", value: "Clothing" },
  { label: "Accessories", value: "Accessories" },
  { label: "School Supplies", value: "School Supplies" },
  { label: "Sports", value: "Sports" },
  { label: "Other", value: "Other" },
] as const;

const INITIAL_FORM: SubmitFormState = {
  category: "",
  dateFound: "",
  description: "",
  location: "",
  title: "",
};

function validateForm(
  form: SubmitFormState,
  imageUrl: string | null,
): FormErrors {
  const errors: FormErrors = {};

  if (form.title.trim().length < 3) {
    errors.title = "Title must be at least 3 characters.";
  }

  if (!form.category) {
    errors.category = "Please choose a category.";
  }

  if (!imageUrl) {
    errors.image = "A photo is required to submit an item.";
  }

  if (
    form.description.trim().length > 0 &&
    form.description.trim().length < 10
  ) {
    errors.description =
      "Description must be at least 10 characters when provided.";
  }

  if (form.dateFound) {
    const foundDate = new Date(form.dateFound);
    const now = new Date();
    if (
      !Number.isNaN(foundDate.getTime()) &&
      foundDate.getTime() > now.getTime()
    ) {
      errors.dateFound = "Date found cannot be in the future.";
    }
  }

  return errors;
}

export function SubmitItemPage() {
  const [form, setForm] = useState<SubmitFormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadedImageName, setUploadedImageName] = useState<string | null>(
    null,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const isBusy = uploadStatus === "uploading" || isSubmitting;

  const uploadButtonLabel = useMemo(() => {
    if (uploadStatus === "uploading") return null; // spinner shown instead
    if (uploadStatus === "uploaded")
      return uploadedImageName
        ? `\u2713 ${uploadedImageName}`
        : "\u2713 Image uploaded";
    return "Choose image";
  }, [uploadStatus, uploadedImageName]);

  function updateField<K extends keyof SubmitFormState>(
    field: K,
    value: SubmitFormState[K],
  ) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => {
      if (!previous[field]) {
        return previous;
      }

      return { ...previous, [field]: undefined };
    });
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadError(null);
    setSubmitError(null);
    setSubmitSuccess(null);
    setErrors((previous) => ({ ...previous, image: undefined }));

    if (!file.type.startsWith("image/")) {
      setUploadStatus("idle");
      setUploadError("Please upload an image file (PNG, JPG, or similar).");
      setUploadedImageUrl(null);
      setUploadedImageName(null);
      return;
    }

    try {
      setUploadStatus("uploading");
      const response = await uploadItemImage(file);
      setUploadedImageUrl(response.url);
      setUploadedImageName(file.name);
      setUploadStatus("uploaded");
    } catch (error) {
      setUploadStatus("idle");
      setUploadedImageUrl(null);
      setUploadedImageName(null);

      if (isApiError(error)) {
        setUploadError(error.message);
      } else {
        setUploadError("We could not upload this image. Please try again.");
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    const nextErrors = validateForm(form, uploadedImageUrl);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (!uploadedImageUrl) {
      return;
    }

    const payload: CreateItemInput = {
      category: form.category,
      dateFound: form.dateFound || undefined,
      description: form.description.trim() || undefined,
      imageUrl: uploadedImageUrl,
      location: form.location.trim() || undefined,
      title: form.title.trim(),
    };

    try {
      setIsSubmitting(true);
      await createItem(payload);
      setSubmitSuccess("Item submitted. It is now pending admin review.");
      setSnackbarOpen(true);
      setForm(INITIAL_FORM);
      setErrors({});
      setUploadedImageUrl(null);
      setUploadedImageName(null);
      setUploadStatus("idle");
      setUploadError(null);
    } catch (error) {
      if (isApiError(error)) {
        setSubmitError(error.message);
      } else {
        setSubmitError("We could not submit the item. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <section aria-labelledby="submit-item-title" className={styles.header}>
        <h1 className={styles.title} id="submit-item-title">
          Submit a Found Item
        </h1>
        <p className={styles.subtitle}>
          Upload a clear photo and add details so the rightful owner can claim
          it.
        </p>
      </section>

      <Card className={styles.formCard}>
        <form className={styles.form} noValidate onSubmit={handleSubmit}>
          <Input
            error={errors.title}
            label="Item title"
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="Example: Black Hydro Flask with sticker"
            required
            value={form.title}
          />

          <div className={styles.field}>
            <label className={styles.label} htmlFor="item-category">
              Category <span className={styles.required}>*</span>
            </label>
            <select
              className={styles.select}
              id="item-category"
              onChange={(event) => updateField("category", event.target.value)}
              value={form.category}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.category ? (
              <p className={styles.fieldError} role="alert">
                {errors.category}
              </p>
            ) : null}
          </div>

          <div className={styles.twoCol}>
            <Input
              label="Found location"
              onChange={(event) => updateField("location", event.target.value)}
              placeholder="Example: Cafeteria table near the windows"
              value={form.location}
            />

            <div className={styles.field}>
              <label className={styles.label} htmlFor="item-date-found">
                Date found
              </label>
              <input
                className={styles.dateInput}
                id="item-date-found"
                max={new Date().toISOString().slice(0, 10)}
                onChange={(event) =>
                  updateField("dateFound", event.target.value)
                }
                type="date"
                value={form.dateFound}
              />
              {errors.dateFound ? (
                <p className={styles.fieldError} role="alert">
                  {errors.dateFound}
                </p>
              ) : null}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="item-description">
              Description
            </label>
            <textarea
              className={styles.textarea}
              id="item-description"
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="Color, brand, unique marks, or any identifying details..."
              rows={4}
              value={form.description}
            />
            {errors.description ? (
              <p className={styles.fieldError} role="alert">
                {errors.description}
              </p>
            ) : null}
          </div>

          <div className={styles.field}>
            <div className={styles.fileInputRow}>
              <span className={styles.label}>
                Item photo <span className={styles.required}>*</span>
              </span>
              <label
                className={[
                  styles.fileInputLabel,
                  isBusy ? styles.fileInputLabelBusy : "",
                  uploadStatus === "uploaded"
                    ? styles.fileInputLabelUploaded
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                htmlFor="item-image"
              >
                {uploadStatus === "uploading" ? (
                  <>
                    <span
                      aria-hidden="true"
                      className={styles.fileInputSpinner}
                    />
                    <span>Uploading...</span>
                  </>
                ) : (
                  uploadButtonLabel
                )}
              </label>
              <input
                accept="image/*"
                className={styles.fileInputHidden}
                disabled={isBusy}
                id="item-image"
                onChange={handleImageUpload}
                type="file"
              />
            </div>
            {errors.image ? (
              <p className={styles.fieldError} role="alert">
                {errors.image}
              </p>
            ) : null}
            {uploadError ? (
              <p className={styles.fieldError} role="alert">
                {uploadError}
              </p>
            ) : null}
            {uploadedImageUrl ? (
              <div className={styles.previewWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Uploaded item preview"
                  className={styles.previewImage}
                  src={uploadedImageUrl}
                />
              </div>
            ) : null}
          </div>

          {submitError ? (
            <p className={styles.submitError} role="alert">
              {submitError}
            </p>
          ) : null}

          {submitSuccess ? (
            <div className={styles.successState} role="status">
              <p className={styles.successText}>{submitSuccess}</p>
              <Link className={styles.successLink} href="/search">
                View browse page
              </Link>
            </div>
          ) : null}

          <div className={styles.actions}>
            <Button loading={isSubmitting} size="lg" type="submit">
              Submit item
            </Button>
          </div>
        </form>
      </Card>

      <Snackbar
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        open={snackbarOpen}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ borderRadius: 2, width: "100%" }}
        >
          Item submitted. It is now pending admin review.
        </Alert>
      </Snackbar>
    </div>
  );
}
