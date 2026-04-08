/** Merge class names; falsy values are skipped. */
export function cn(...inputs) {
  return inputs.filter(Boolean).join(" ");
}
