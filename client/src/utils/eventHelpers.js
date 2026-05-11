import { PORT_URL } from "./config";

export const formatCompactNumber = (value) =>
  new Intl.NumberFormat("en-NG", { notation: "compact", maximumFractionDigits: 1 }).format(
    Number(value || 0),
  );

export const formatFullNumber = (value) =>
  new Intl.NumberFormat("en-NG").format(Number(value || 0));

export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const getEventPrice = (event) => {
  if (Array.isArray(event?.pricing) && event.pricing.length) {
    return Math.min(...event.pricing.map((ticket) => Number(ticket.price || 0)));
  }

  if (Array.isArray(event?.ticketTypes) && event.ticketTypes.length) {
    return Math.min(...event.ticketTypes.map((ticket) => Number(ticket.price || 0)));
  }

  return Number(event?.ticketPrice || 0);
};

export const formatEventPrice = (event) => {
  const amount = getEventPrice(event);
  return amount > 0 ? formatCurrency(amount) : "Free";
};

/** Stored value is either a Cloudinary HTTPS URL or a legacy local filename / uploads path. */
export const resolveStoredMediaUrl = (value, legacySubdir) => {
  if (value == null || value === "") return null;
  const s = String(value);
  if (/^https?:\/\//i.test(s)) return s;
  const normalized = s.replace(/^\/+/, "");
  if (
    normalized.startsWith("uploads") ||
    /profile_pic|cover_pic|event_image/.test(normalized)
  ) {
    return `${PORT_URL}/${normalized}`;
  }
  if (!normalized.includes("/")) {
    return `${PORT_URL}${legacySubdir}${normalized}`;
  }
  return `${PORT_URL}/${normalized}`;
};

export const getEventImageUrl = (event) => {
  if (event?.banner) return event.banner;
  if (!event?.image) return null;
  return resolveStoredMediaUrl(event.image, "/uploads/event_image/");
};

export const getProfileImageUrl = (user) => {
  if (!user?.profilePic) return null;
  return resolveStoredMediaUrl(user.profilePic, "/uploads/profile_pic/");
};

export const getCoverImageUrl = (user) => {
  if (!user?.coverPic) return null;
  return resolveStoredMediaUrl(user.coverPic, "/uploads/cover_pic/");
};

export const isVerifiedOrganizer = (user) =>
  user?.role === "admin" || (user?.role === "organizer" && user?.billing?.plan !== "Free");

export const formatEventDate = (value, options = { month: "short", day: "numeric", year: "numeric" }) => {
  if (!value) return "Date TBD";

  try {
    return new Date(value).toLocaleDateString("en-US", options);
  } catch {
    return "Date TBD";
  }
};

export const formatEventDateRange = (startDate, endDate) => {
  if (!startDate) return "Date TBD";

  const start = new Date(startDate);
  if (!endDate) {
    return formatEventDate(startDate, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  const end = new Date(endDate);
  if (start.toDateString() === end.toDateString()) {
    return formatEventDate(startDate, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  return `${formatEventDate(startDate, {
    month: "short",
    day: "numeric",
  })} - ${formatEventDate(endDate, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
};

export const formatDate = (value, options = { month: "short", day: "numeric", year: "numeric" }) => {
  if (!value) return "Date TBD";

  try {
    return new Date(value).toLocaleDateString("en-US", options);
  } catch {
    return "Date TBD";
  }
};

export const formatEventTimeRange = (startTime, endTime) => {
  if (!startTime) return "Time TBD";
  return endTime ? `${startTime} - ${endTime}` : startTime;
};

export const formatRelativeTime = (value) => {
  if (!value) return "Just now";

  const date = new Date(value);
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const units = [
    ["year", 525600],
    ["month", 43200],
    ["week", 10080],
    ["day", 1440],
    ["hour", 60],
    ["minute", 1],
  ];

  for (const [unit, divisor] of units) {
    if (Math.abs(diffMinutes) >= divisor || unit === "minute") {
      return formatter.format(Math.round(diffMinutes / divisor), unit);
    }
  }

  return "Just now";
};

export const getEventUrl = (eventId) => `${window.location.origin}/event/${eventId}`;

export const getProfileUrl = (userId) => `${window.location.origin}/profile/${userId}`;
