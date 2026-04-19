/** Keep in sync with server `IMAGE_MIMES` in `server/utils/cloudinaryMedia.js`. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
]);

/**
 * @param {File | null | undefined} file
 * @returns {string | null} Error message, or null if OK
 */
export function validateImageFile(file) {
  if (!file) return "No file selected.";
  if (file.size > MAX_IMAGE_BYTES) {
    return "Image must be 10MB or smaller.";
  }
  if (file.type && !ALLOWED.has(file.type)) {
    return "Use JPEG, PNG, WebP, GIF, AVIF, or HEIC.";
  }
  return null;
}
