import { CalendarDays, Pencil, Radio, Ticket, Users, BarChart3, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import EventActionMenu from "../EventActionMenu";
import {
  canAccessAnalytics,
  canEditEvent,
  canManageTeam,
  canManageTickets,
  canModerateLivestream,
  getFeaturedRoleLabel,
} from "../../utils/eventPermissions";
import { formatEventDate, getEventImageUrl } from "../../utils/eventHelpers";

export default function FeaturedEventCard({
  event,
  onEdit,
  onManageTeam,
  onToggleLive,
  onDelete,
  onUpgradeAnalytics,
  onUpgradeLive,
  liveBusy = false,
}) {
  const roleLabel = getFeaturedRoleLabel(event);
  const imageUrl = getEventImageUrl(event);
  const showTickets = canManageTickets(event);
  const showAnalytics = canAccessAnalytics(event);
  const showLivestream = canModerateLivestream(event);
  const showTeam = canManageTeam(event);
  const showEdit = canEditEvent(event) && onEdit;

  const menuItems = [
    showLivestream || onUpgradeLive
      ? {
          key: "live",
          label: event.liveStream?.isLive ? "Stop Live" : "Go Live",
          icon: Radio,
          active: Boolean(event.liveStream?.isLive),
          trailing: liveBusy ? "Busy" : null,
          onClick: () => {
            if (showLivestream) {
              onToggleLive?.(event);
            } else {
              onUpgradeLive?.();
            }
          },
          disabled: liveBusy,
        }
      : null,
    showEdit
      ? {
          key: "edit",
          label: "Edit event",
          icon: Pencil,
          onClick: () => onEdit(event._id),
        }
      : null,
    showTickets
      ? {
          key: "tickets",
          label: "Manage tickets",
          icon: Ticket,
          to: `/events/${event._id}/tickets`,
        }
      : null,
    showAnalytics || onUpgradeAnalytics
      ? {
          key: "analytics",
          label: "Analytics",
          icon: BarChart3,
          to: showAnalytics ? `/events/${event._id}/analytics` : undefined,
          onClick: showAnalytics ? undefined : onUpgradeAnalytics,
        }
      : null,
    showTeam
      ? {
          key: "team",
          label: "Manage team",
          icon: Users,
          onClick: () => onManageTeam?.(event._id),
        }
      : null,
    onDelete ? { key: "divider-delete", type: "divider" } : null,
    onDelete
      ? {
          key: "delete",
          label: "Delete event",
          icon: Trash2,
          danger: true,
          onClick: () => onDelete(event._id),
        }
      : null,
  ];

  return (
    <article className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-lg">
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
        <Link to={`/event/${event._id}`} className="block h-full">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={event.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {roleLabel ? (
              <span className="inline-flex h-7 items-center rounded-full bg-white/90 px-3 text-[0.65rem] font-bold uppercase tracking-wide text-pink-600 shadow-sm">
                {roleLabel}
              </span>
            ) : null}
            {event.liveStream?.isLive ? (
              <span className="inline-flex h-7 items-center rounded-full bg-red-500 px-3 text-[0.65rem] font-bold uppercase tracking-wide text-white shadow-sm">
                Live
              </span>
            ) : null}
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="line-clamp-2 text-lg font-extrabold tracking-tight text-white">
              {event.title}
            </h3>
          </div>
        </Link>
        <div className="absolute right-3 top-3 z-20">
          <EventActionMenu items={menuItems} />
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={13} className="text-pink-500" />
            {formatEventDate(event.startDate)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Ticket size={13} className="text-pink-500" />
            {event.ticketsSold || 0} sold
          </span>
        </div>
      </div>
    </article>
  );
}
