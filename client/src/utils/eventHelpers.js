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

export const getEventImageUrl = (event) => {
  if (event?.banner) return event.banner;
  if (event?.image) return `${PORT_URL}/uploads/event_image/${event.image}`;
  return null;
};

export const getProfileImageUrl = (user) => {
  if (!user?.profilePic) return null;
  if (String(user.profilePic).startsWith("http")) return user.profilePic;
  return `${PORT_URL}/uploads/profile_pic/${user.profilePic}`;
};

export const getCoverImageUrl = (user) => {
  if (!user?.coverPic) return null;
  if (String(user.coverPic).startsWith("http")) return user.coverPic;
  return `${PORT_URL}/uploads/cover_pic/${user.coverPic}`;
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

export const getEventUrl = (eventId) => `${window.location.origin}/Eventdetail/${eventId}`;

export const getProfileUrl = (userId) => `${window.location.origin}/profile/${userId}`;
