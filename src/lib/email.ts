import { timingSafeEqual } from "node:crypto";

const MAX_EMAIL_BYTES = 320;

/** Constant-time comparison after Unicode normalize + lower-case trim (mitigates trivial timing leaks). */
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
