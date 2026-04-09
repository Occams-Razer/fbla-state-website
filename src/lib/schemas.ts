import { z } from "zod";

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

export const itemListQuerySchema = z
  .object({
    search: z.string().max(500).optional(),
    category: z.string().max(200).optional(),
    sort: z.enum(["newest", "oldest"]).optional().default("newest"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(MAX_PAGE_SIZE)
      .default(DEFAULT_PAGE_SIZE),
  })
  .strict();

export const itemCreateSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(5000).optional().default(""),
    category: z.string().min(1, "Category is required").max(100),
    location: z.string().max(500).optional().default(""),
    dateFound: z.string().max(200).optional().default(""),
    imageUrl: z
      .string()
      .min(1, "Photo URL is required")
      .max(2000)
      .refine(
        (s) => s.startsWith("/") || /^https?:\/\//i.test(s),
        "Photo must be a site path (e.g. /uploads/...) or a full URL",
      ),
  })
  .strict();

export const itemPatchSchema = z
  .object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "CLAIMED"]),
  })
  .strict();

export const claimCreateSchema = z
  .object({
    itemId: z.string().min(1, "Item is required"),
    name: z.string().min(1, "Name is required").max(200),
    email: z.string().email("Valid email is required").max(320),
    proofOfOwnership: z.string().min(1, "Proof of ownership is required").max(8000),
    locationLost: z.string().max(500).optional().default(""),
  })
  .strict();

export const claimPatchSchema = z
  .object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  })
  .strict();

export const claimStatusQuerySchema = z
  .object({
    claimId: z.string().min(1, "claimId is required"),
    email: z.string().email("Valid email is required"),
  })
  .strict();

export const adminItemsQuerySchema = z
  .object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "CLAIMED"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(MAX_PAGE_SIZE)
      .default(DEFAULT_PAGE_SIZE),
  })
  .strict();

export const claimsListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(MAX_PAGE_SIZE)
      .default(DEFAULT_PAGE_SIZE),
  })
  .strict();

export const loginBodySchema = z
  .object({
    username: z.string().min(1, "Username is required").max(200),
    password: z.string().min(1, "Password is required").max(500),
  })
  .strict();

export function formatZodError(error: z.ZodError): { error: string; fields?: Record<string, string[]> } {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_root";
    if (!fields[path]) fields[path] = [];
    fields[path].push(issue.message);
  }
  const first = error.issues[0];
  return {
    error: first ? `${first.path.join(".") || "request"}: ${first.message}` : "Validation failed",
    fields,
  };
}
