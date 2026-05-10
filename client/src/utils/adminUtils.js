export function formatCurrency(value) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export function formatDate(value) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(value) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatStatus(status) {
  if (!status) return "Unknown";
  return String(status).replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getStatusTone(status) {
  const normalized = String(status || "").toLowerCase();

  if (["approved", "success", "paid", "completed", "active"].includes(normalized)) return "emerald";
  if (["pending", "processing", "review"].includes(normalized)) return "amber";
  if (["rejected", "failed", "suspended", "deleted"].includes(normalized)) return "rose";
  if (["featured", "admin"].includes(normalized)) return "pink";
  if (["organizer"].includes(normalized)) return "blue";

  return "slate";
}
