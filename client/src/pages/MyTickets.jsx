import { useEffect, useState, useMemo } from "react";
import {
  Ticket, Calendar, MapPin, Download, MessageSquare,
  Search, ExternalLink, QrCode, Clock, PlusCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import useProfileNavigation from "../hooks/useProfileNavigation";
import API from "../api/axios";
import { PORT_URL } from "../utils/config";
import { getEventImageUrl } from "../utils/eventHelpers";
import { UserAvatar } from "../components/ui/avatar";
import { getCurrentUser } from "../utils/auth";
import CreateEvent from "./CreateEvent";

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

const fmtTime = (d) =>
  new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

const fmtMoney = (n) => `₦${Number(n ?? 0).toLocaleString("en-NG")}`;

/* ── shared input class ── */
const pillInput =
  "h-10 rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-700 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all";

export default function MyTickets() {
  const [tickets,         setTickets]         = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [searchQuery,     setSearchQuery]     = useState("");
  const [filter,          setFilter]          = useState("all");
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  const user        = getCurrentUser();
  const { toProfile } = useProfileNavigation();

  useEffect(() => {
    API.get("/tickets/my-tickets")
      .then((r) => setTickets(r.data))
      .finally(() => setLoading(false));
  }, []);

  const filteredTickets = useMemo(() => {
    const q   = searchQuery.toLowerCase();
    const now = new Date();
    return tickets.filter((t) => {
      const ev = t?.event;
      if (!ev) return false;
      const matchSearch = !q || ev.title?.toLowerCase().includes(q) || ev.location?.toLowerCase().includes(q);
      const d = new Date(ev.startDate);
      if (filter === "upcoming") return matchSearch && d >= now;
      if (filter === "past")     return matchSearch && d <  now;
      return matchSearch;
    });
  }, [tickets, searchQuery, filter]);

  const canScan = user?.role === "organizer" || user?.role === "admin";

  return (
    <div className="min-h-screen bg-slate-50 lg:pl-[var(--sidebar-width,0px)] pt-10 pb-20 transition-[padding-left] duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* ── Page header ── */}
        <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-pink-500 mb-1">Passes</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">My Tickets</h1>
            <p className="mt-1 text-sm text-slate-500">Manage your event access and digital passes</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowCreateEvent(true)}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-pink-500 text-white text-sm font-bold shadow-md shadow-pink-200 hover:bg-pink-600 transition-all"
            >
              <PlusCircle size={16} />
              Create event
            </button>
            {canScan && (
              <Link
                to="/scanner"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:border-pink-300 hover:text-pink-500 transition-all"
              >
                <QrCode size={16} />
                Scanner
              </Link>
            )}
          </div>
        </div>

        {/* ── Search + filter bar ── */}
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Search tickets…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${pillInput} w-full pl-9 pr-4`}
            />
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full p-1">
            {["all", "upcoming", "past"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`h-8 px-4 rounded-full text-xs font-bold capitalize transition-all ${
                  filter === f
                    ? "bg-pink-500 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {f === "all" ? "All" : f === "upcoming" ? "Upcoming" : "Past"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-44 bg-slate-200" />
                <div className="p-4 space-y-2.5">
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && filteredTickets.length === 0 && (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-400 mx-auto mb-4">
              <Ticket size={26} />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              {searchQuery ? "No tickets match your search" : "No tickets yet"}
            </h3>
            <p className="text-sm text-slate-400 mb-5 max-w-xs mx-auto">
              {searchQuery
                ? "Try adjusting your filters or search terms."
                : "You haven't purchased any tickets. Discover amazing events near you!"}
            </p>
            {!searchQuery && (
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to="/events"
                  className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-pink-500 text-white text-sm font-bold shadow-md shadow-pink-200 hover:bg-pink-600 transition-all"
                >
                  Browse events
                </Link>
                <button
                  onClick={() => setShowCreateEvent(true)}
                  className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full border border-pink-300 text-pink-500 text-sm font-bold hover:bg-pink-50 transition-all"
                >
                  <PlusCircle size={15} />
                  Create an event
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Ticket cards grid ── */}
        {!loading && filteredTickets.length > 0 && (
          <>
            <p className="text-xs text-slate-400 font-medium">
              <strong className="text-slate-700">{filteredTickets.length}</strong> ticket{filteredTickets.length !== 1 ? "s" : ""} found
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredTickets.map((ticket) => {
                const event = ticket?.event;
                if (!event) return null;
                const isPast = new Date(event.startDate) < new Date();
                const imgSrc = getEventImageUrl(event);

                return (
                  <article
                    key={ticket._id}
                    className={`bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col transition-all hover:-translate-y-1 hover:shadow-md ${
                      isPast
                        ? "border-slate-200 opacity-70 grayscale-[0.3] hover:opacity-100 hover:grayscale-0"
                        : "border-slate-200 hover:border-pink-200"
                    }`}
                  >
                    {/* Image / cover */}
                    <div className="relative h-44 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 shrink-0">
                      {imgSrc
                        ? <img src={imgSrc} alt={event.title} className="w-full h-full object-cover" />
                        : null
                      }

                      {/* Live badge */}
                      {event.liveStream?.isLive && !isPast && (
                        <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 bg-red-500 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-md shadow-red-300 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          LIVE
                        </span>
                      )}

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

                      {/* Title + organizer over image */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-extrabold text-sm leading-tight line-clamp-2 mb-1.5">
                          {event.title}
                        </h3>
                        <button
                          onClick={() => toProfile(event.createdBy)}
                          className="flex items-center gap-1.5 group"
                        >
                          <UserAvatar user={event.createdBy} className="w-6 h-6 rounded-full border border-white/70" />
                          <span className="text-white/80 text-xs group-hover:text-white transition-colors">
                            by {event.createdBy?.username || "Organizer"}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Dashed stub divider */}
                    <div className="border-t-2 border-dashed border-slate-100" />

                    {/* Body */}
                    <div className="p-4 flex flex-col gap-3 flex-1">
                      {/* Details */}
                      <div className="space-y-2">
                        {/* When */}
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 w-10 shrink-0 pt-0.5">When</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                              <Calendar size={12} className="text-pink-500 shrink-0" />
                              {event.startDate ? fmtDate(event.startDate) : "TBD"}
                            </div>
                            {event.startDate && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                                <Clock size={11} className="text-pink-400 shrink-0" />
                                {fmtTime(event.startDate)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Where */}
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 w-10 shrink-0 pt-0.5">Where</span>
                          <div className="flex items-start gap-1.5 text-xs font-semibold text-slate-700 min-w-0">
                            <MapPin size={12} className="text-pink-500 shrink-0 mt-0.5" />
                            <span className="truncate">{event.location || "Online"}</span>
                          </div>
                        </div>

                        {/* Passes + Paid */}
                        <div className="flex items-center gap-4 pt-1 border-t border-slate-100">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Passes</p>
                            <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 mt-0.5">
                              <Ticket size={11} className="text-pink-500" />
                              {ticket.quantity} {ticket.quantity === 1 ? "ticket" : "tickets"}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Paid</p>
                            <p className="text-xs font-extrabold text-slate-900 mt-0.5">
                              {ticket.isFree || ticket.amount === 0 ? "Free" : fmtMoney(ticket.amount)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Footer — QR + actions */}
                      <div className="flex items-center gap-2.5 mt-auto pt-3 border-t border-slate-100 flex-wrap">
                        {/* QR */}
                        {ticket.qrCode && (
                          <div className="flex flex-col items-center gap-0.5 p-2 border border-slate-200 rounded-xl bg-slate-50 shrink-0">
                            <img
                              src={`${PORT_URL}/uploads/${ticket.qrCode}`}
                              alt="QR code"
                              className="w-14 h-14 object-contain"
                            />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Show at entry</span>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                          {ticket.qrCode && (
                            <a
                              href={`${PORT_URL}/uploads/${ticket.qrCode}`}
                              download={`ticket-${ticket._id}.png`}
                              className="inline-flex items-center justify-center gap-1.5 h-8 rounded-lg bg-pink-500 text-white text-xs font-bold hover:bg-pink-600 transition-all"
                            >
                              <Download size={13} /> Download
                            </a>
                          )}
                          {event.liveStream?.isLive && !isPast && (
                            <Link
                              to={`/live/${event._id}`}
                              className="inline-flex items-center justify-center gap-1.5 h-8 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-all"
                            >
                              <MessageSquare size={13} /> Watch Live
                            </Link>
                          )}
                          <Link
                            to={`/event/${event._id}`}
                            className="inline-flex items-center justify-center gap-1.5 h-8 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:border-pink-300 hover:text-pink-500 transition-all"
                          >
                            <ExternalLink size={12} /> Event page
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>

      <CreateEvent isOpen={showCreateEvent} onClose={() => setShowCreateEvent(false)} />
    </div>
  );
}