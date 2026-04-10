import { timingSafeEqual } from "node:crypto";
import nodemailer from "nodemailer";

// ─── Existing utilities ───────────────────────────────────────────────────────

const MAX_EMAIL_BYTES = 320;

export function emailsEqual(a: string, b: string): boolean {
  const na = a.normalize("NFKC").trim().toLowerCase().slice(0, MAX_EMAIL_BYTES);
  const nb = b.normalize("NFKC").trim().toLowerCase().slice(0, MAX_EMAIL_BYTES);
  const bufA = Buffer.alloc(MAX_EMAIL_BYTES, 0);
  const bufB = Buffer.alloc(MAX_EMAIL_BYTES, 0);
  bufA.write(na, "utf8");
  bufB.write(nb, "utf8");
  return timingSafeEqual(bufA, bufB);
}

export function normalizeEmail(email: string): string {
  return email.normalize("NFKC").trim().toLowerCase();
}

// ─── Email sending ────────────────────────────────────────────────────────────

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[email] SMTP not configured — skipping email to:", to);
    return;
  }
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  await transporter.sendMail({ from, to, subject, html });
}

// ─── Templates ────────────────────────────────────────────────────────────────

function baseTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
        <tr>
          <td style="background:#1a1a2e;padding:24px 32px;">
            <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:.05em;">◇ FOUNDRY</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 16px;font-size:22px;color:#111;">${title}</h1>
            ${body}
            <p style="margin:32px 0 0;font-size:12px;color:#888;">
              Middleton High School Lost &amp; Found — Foundry
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:#666;font-size:14px;width:130px;vertical-align:top;">${label}</td>
    <td style="padding:6px 0;color:#111;font-size:14px;font-weight:600;vertical-align:top;">${value}</td>
  </tr>`;
}

// ─── Notification functions ───────────────────────────────────────────────────

/** Email the claimant when their claim is approved. */
export async function sendClaimApprovedEmail(claim: {
  name: string;
  email: string;
  id: string;
}, item: {
  title: string;
  category: string;
  location: string;
}): Promise<void> {
  const pickupLocation = process.env.PICKUP_LOCATION ?? "the Main Office";
  const contactEmail   = process.env.ADMIN_EMAIL ?? "";

  const body = `
    <p style="margin:0 0 16px;color:#333;line-height:1.6;">
      Hi <strong>${claim.name}</strong>,<br><br>
      Great news — your claim for the item below has been <strong style="color:#16a34a;">approved</strong>.
      Please come to <strong>${pickupLocation}</strong> to pick it up.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      ${row("Item", item.title)}
      ${row("Category", item.category || "—")}
      ${row("Found at", item.location || "—")}
      ${row("Claim ID", claim.id)}
    </table>
    <p style="margin:0 0 8px;color:#333;line-height:1.6;">
      Please bring a valid photo ID when picking up your item.
      ${contactEmail ? `If you have questions, contact us at <a href="mailto:${contactEmail}" style="color:#4f46e5;">${contactEmail}</a>.` : ""}
    </p>`;

  try {
    await sendEmail(claim.email, `Your claim for "${item.title}" has been approved`, baseTemplate("Claim Approved ✓", body));
  } catch (err) {
    console.error("[email] sendClaimApprovedEmail failed:", err);
  }
}

/** Email the claimant when pickup has been completed. */
export async function sendClaimPickedUpEmail(claim: {
  name: string;
  email: string;
  id: string;
}, item: {
  title: string;
  category: string;
  location: string;
}): Promise<void> {
  const contactEmail = process.env.ADMIN_EMAIL ?? "";

  const body = `
    <p style="margin:0 0 16px;color:#333;line-height:1.6;">
      Hi <strong>${claim.name}</strong>,<br><br>
      Your pickup has been marked as <strong style="color:#2563eb;">completed</strong> for the item below.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      ${row("Item", item.title)}
      ${row("Category", item.category || "—")}
      ${row("Found at", item.location || "—")}
      ${row("Claim ID", claim.id)}
    </table>
    <p style="margin:0;color:#333;line-height:1.6;">
      Thanks for using Foundry.
      ${contactEmail ? `If you need anything else, contact us at <a href="mailto:${contactEmail}" style="color:#4f46e5;">${contactEmail}</a>.` : ""}
    </p>`;

  try {
    await sendEmail(
      claim.email,
      `Pickup completed for "${item.title}"`,
      baseTemplate("Pickup Confirmed", body),
    );
  } catch (err) {
    console.error("[email] sendClaimPickedUpEmail failed:", err);
  }
}

/** Email the admin when a new item is submitted for review. */
export async function sendNewItemAdminEmail(item: {
  id: string;
  title: string;
  category: string;
  location: string;
  dateFound: string;
  description: string;
}): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const body = `
    <p style="margin:0 0 16px;color:#333;line-height:1.6;">
      A new item has been submitted and is waiting for your review.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      ${row("Title", item.title)}
      ${row("Category", item.category || "—")}
      ${row("Found at", item.location || "—")}
      ${row("Date found", item.dateFound || "—")}
      ${row("Description", item.description || "—")}
    </table>
    <p style="margin:0;color:#333;">
      Log in to the admin dashboard to approve or reject this submission.
    </p>`;

  try {
    await sendEmail(adminEmail, `New item submitted for review: "${item.title}"`, baseTemplate("New Item Submission", body));
  } catch (err) {
    console.error("[email] sendNewItemAdminEmail failed:", err);
  }
}

/** Email the admin when someone submits a claim. */
export async function sendNewClaimAdminEmail(claim: {
  id: string;
  name: string;
  email: string;
  proofOfOwnership: string;
  locationLost: string;
}, itemTitle: string): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const body = `
    <p style="margin:0 0 16px;color:#333;line-height:1.6;">
      Someone has submitted a claim for a found item and it is waiting for your review.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      ${row("Item", itemTitle)}
      ${row("Claimant", claim.name)}
      ${row("Email", claim.email)}
      ${row("Lost at", claim.locationLost || "—")}
      ${row("Proof", claim.proofOfOwnership)}
      ${row("Claim ID", claim.id)}
    </table>
    <p style="margin:0;color:#333;">
      Log in to the admin dashboard to approve or reject this claim.
    </p>`;

  try {
    await sendEmail(adminEmail, `New claim submitted for: "${itemTitle}"`, baseTemplate("New Claim Submitted", body));
  } catch (err) {
    console.error("[email] sendNewClaimAdminEmail failed:", err);
  }
}
