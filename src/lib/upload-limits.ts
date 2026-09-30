/**
 * Max image upload size. Vercel rejects function request bodies over 4.5MB,
 * so stay under that with room for the multipart overhead.
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MAX_UPLOAD_LABEL = "4MB";
