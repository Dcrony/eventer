/**
 * EventDayDashboard.jsx
 *
 * Real-time event-day operations dashboard.
 * Reuses:
 *  - API (existing axios instance)
 *  - formatDate, formatCurrency from eventHelpers
 *  - TicketScanner component (existing)
 *  - EventTickets table (existing)
 *  - authMiddleware / event permissions (server-enforced)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, Users, CheckCircle2, Clock, XCircle,
  Search, QrCode, RefreshCw, AlertTriangle, Wifi, WifiOff,
  BarChart2, Activity, Ticket, ChevronRight, Undo2,
} from "lucide-react";
import API from "../api/axios";
import Modal from "../components/ui/modal";
import { useToast } from "../components/ui/toast";
import { canCheckIn } from "../utils/eventPermissions";
import { formatDate } from "../utils/eventHelpers";

/* ─── Offline cache key ───────────────────────────────────────────────────── */
const CACHE_KEY = (id) => `tickispot_checkin_cache_${id}`;

/* ─── Stat pill ──────────────────────────────────────────────────────────── */
function StatPill({ label, value, color }) {
  const colors = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pink: "bg-pink-50 text-pink-700 border-pink-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    gray: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <div className={`flex flex-col items-center px-4 py-3 rounded-xl border ${colors[color] || colors.gray}`}>
      <span className="text-2xl font-extrabold tracking-tight">{value}</span>
      <span className="text-[0.65rem] font-bold uppercase tracking-wider mt-0.5 opacity-70">{label}</span>
    </div>
  );
}

/* ─── Activity feed item ─────────────────────────────────────────────────── */
function ActivityItem({ item }) {
  const icons = {
    "checked-in": <CheckCircle2 size={14} className="text-emerald-500" />,
    "failed": <XCircle size={14} className="text-red-400" />,
    "duplicate": <AlertTriangle size={14} className="text-amber-500" />,
    "manual": <Users size={14} className="text-blue-500" />,
  };
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
      <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
        {icons[item.type] || icons["checked-in"]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{item.name || "Guest"}</p>
        <p className="text-xs text-gray-400">{item.ticketType} · {item.time}</p>
      </div>
      <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full ${item.type === "checked-in" ? "bg-emerald-50 text-emerald-700" :
        item.type === "duplicate" ? "bg-amber-50 text-amber-700" :
          item.type === "manual" ? "bg-blue-50 text-blue-700" :
            "bg-red-50 text-red-700"
        }`}>{item.type}</span>
    </div>
  );
}

/* ─── Manual search row ──────────────────────────────────────────────────── */
function AttendeeRow({ ticket, onCheckIn, onRefund, checkingIn, processingRefund }) {
  const statusColors = {
    "checked-in": "bg-emerald-50 text-emerald-700",
    "active": "bg-gray-100 text-gray-600",
    "refunded": "bg-red-50 text-red-700",
  };
  return (
    <tr className="hover:bg-gray-50/60 transition-colors">
      <td className="px-4 py-3">
        <p className="text-sm font-semibold text-gray-900">{ticket.buyer?.name || "Unknown"}</p>
        <p className="text-xs text-gray-400">{ticket.buyer?.email}</p>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{ticket.ticketType}</td>
      <td className="px-4 py-3">
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColors[ticket.status] || statusColors.active}`}>
          {ticket.status === "checked-in" ? "Checked In" : ticket.status === "refunded" ? "Refunded" : ticket.status || "Active"}
        </span>
      </td>
      <td className="px-4 py-3 flex flex-wrap items-center gap-2">
        {(ticket.status === "active" || !ticket.status) && (
          <>
            <button
              onClick={() => onCheckIn(ticket._id)}
              disabled={checkingIn === ticket._id}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-50 transition-all"
            >
              {checkingIn === ticket._id
                ? <RefreshCw size={11} className="animate-spin" />
                : <CheckCircle2 size={11} />}
              Check In
            </button>
            <button
              onClick={() => onRefund(ticket)}
              disabled={processingRefund === ticket._id}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-100 hover:bg-red-100 disabled:opacity-50 transition-all"
            >
              {processingRefund === ticket._id
                ? <RefreshCw size={11} className="animate-spin" />
                : <Undo2 size={11} />}
              Refund
            </button>
          </>
        )}
      </td>
    </tr>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function EventDayDashboard() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [search, setSearch] = useState("");
  const [checkingIn, setCheckingIn] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activity, setActivity] = useState([]);
  const [activeTab, setActiveTab] = useState("search"); // "search" | "activity" | "stats"
  const [refundModal, setRefundModal] = useState({ open: false, ticket: null, reason: "" });
  const [processingRefund, setProcessingRefund] = useState(false);
  const toast = useToast();
  const pollRef = useRef(null);

  /* ─── Online / offline listener ─────────────────────────────────────────── */
  useEffect(() => {
    const goOnline = () => { setIsOnline(true); loadTickets(); };
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => { window.removeEventListener("online", goOnline); window.removeEventListener("offline", goOffline); };
  }, []);

  /* ─── Load tickets (with offline fallback) ──────────────────────────────── */
  const loadTickets = useCallback(async () => {
    setUnauthorized(false);
    try {
      const [evRes, tkRes] = await Promise.all([
        API.get(`/events/${eventId}`),
        API.get(`/tickets/event/${eventId}`),
      ]);
      setEvent(evRes.data);
      setTickets(tkRes.data || []);
      setError(null);
      // Cache for offline use
      try {
        sessionStorage.setItem(CACHE_KEY(eventId), JSON.stringify({
          event: evRes.data,
          tickets: tkRes.data,
          cachedAt: Date.now(),
        }));
      } catch { /* storage full — ignore */ }
    } catch (err) {
      if (err.response?.status === 403) {
        setUnauthorized(true);
        setError(err.response?.data?.message || "You do not have permission to access this event's ticket dashboard.");
      } else {
        // Try offline cache
        try {
          const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY(eventId)) || "null");
          if (cached) {
            setEvent(cached.event);
            setTickets(cached.tickets);
            setError(`Offline mode — showing data cached at ${new Date(cached.cachedAt).toLocaleTimeString()}`);
          } else {
            setError(err.response?.data?.message || "Failed to load event data");
          }
        } catch {
          setError("Failed to load event data");
        }
      }
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadTickets();
    // Poll every 15 s for live check-in count updates
    pollRef.current = setInterval(loadTickets, 15000);
    return () => clearInterval(pollRef.current);
  }, [loadTickets]);

  /* ─── Manual check-in ───────────────────────────────────────────────────── */
  const handleCheckIn = async (ticketId) => {
    try {
      setCheckingIn(ticketId);
      await API.post(`/tickets/${ticketId}/checkin`);

      // Optimistic update
      setTickets((prev) =>
        prev.map((t) => t._id === ticketId ? { ...t, status: "checked-in", used: true, usedAt: new Date() } : t)
      );

      const ticket = tickets.find((t) => t._id === ticketId);
      pushActivity({
        type: "manual",
        name: ticket?.buyer?.name || "Guest",
        ticketType: ticket?.ticketType || "—",
      });
    } catch (err) {
      alert(err.response?.data?.message || "Check-in failed");
    } finally {
      setCheckingIn(null);
    }
  };

  const pushActivity = (item) => {
    setActivity((prev) => [
      { ...item, time: new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }), id: Date.now() },
      ...prev.slice(0, 49),
    ]);
  };

  const openRefundModal = (ticket) => {
    setRefundModal({ open: true, ticket, reason: "" });
  };

  const closeRefundModal = () => {
    setRefundModal({ open: false, ticket: null, reason: "" });
  };

  const handleRefundSubmit = async () => {
    if (!refundModal.ticket) return;
    setProcessingRefund(refundModal.ticket._id);

    try {
      await API.post(`/tickets/${refundModal.ticket._id}/refund`, {
        refundReason: refundModal.reason,
      });
      toast.success("Refund submitted successfully");
      setTickets((prev) => prev.map((ticket) =>
        ticket._id === refundModal.ticket._id ? { ...ticket, status: "refunded" } : ticket
      ));
      closeRefundModal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to issue refund");
    } finally {
      setProcessingRefund(null);
    }
  };

  /* ─── Stats ─────────────────────────────────────────────────────────────── */
  const total = tickets.length;
  const checkedIn = tickets.filter((t) => t.status === "checked-in").length;
  const remaining = total - checkedIn;
  const pct = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

  /* ─── Filter ─────────────────────────────────────────────────────────────── */
  const filtered = tickets.filter((t) => {
    const q = search.toLowerCase();
    return !q || (
      t.buyer?.name?.toLowerCase().includes(q) ||
      t.buyer?.email?.toLowerCase().includes(q) ||
      t.ticketType?.toLowerCase().includes(q) ||
      String(t._id).includes(q)
    );
  });

  /* ─── Loading / error states ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center gap-3 font-geist">
        <RefreshCw size={20} className="animate-spin text-pink-500" />
        <p className="text-sm text-gray-500">Loading event day dashboard…</p>
      </div>
    );
  }

  if (unauthorized || (event && !canCheckIn(event))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8 text-center">
        <div className="max-w-xl bg-white border border-gray-200 rounded-3xl shadow-sm p-10">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Access denied</h1>
          <p className="text-sm text-gray-500 mb-6">
            You do not have permission to view or manage event day operations for this event.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to={`/event/${eventId}`} className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-pink-500 text-white text-sm font-semibold hover:bg-pink-600 transition-all">
              Back to event
            </Link>
            <Link to="/dashboard" className="inline-flex items-center justify-center px-5 py-3 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
              Go to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-geist">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

        {/* ── Header ── */}
        <div className="mb-6">
          <Link to={`/event/${eventId}`} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-pink-500 font-semibold mb-2 transition-colors">
            <ArrowLeft size={15} /> Back to event
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">{event?.title || "Event Day"}</h1>
              <p className="text-sm text-gray-400 mt-0.5">{formatDate(event?.startDate)} · {event?.location || "—"}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${isOnline ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                {isOnline ? "Online" : "Offline"}
              </div>
              <button onClick={loadTickets} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-gray-200 text-gray-600 hover:border-pink-300 hover:text-pink-500 transition-all">
                <RefreshCw size={12} /> Refresh
              </button>
              <Link to="/scanner" className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-pink-500 text-white text-xs font-bold hover:bg-pink-600 transition-all shadow-sm">
                <QrCode size={12} /> Scan QR
              </Link>
            </div>
          </div>
        </div>

        {/* Offline banner */}
        {error && (
          <div className="flex items-center gap-2 p-3 mb-5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* ── Stats Bar ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatPill label="Total" value={total} color="gray" />
          <StatPill label="Checked In" value={checkedIn} color="green" />
          <StatPill label="Remaining" value={remaining} color="amber" />
          <StatPill label="% Arrived" value={`${pct}%`} color="pink" />
        </div>

        {/* Progress bar */}
        <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500">Check-in progress</span>
            <span className="text-xs font-bold text-emerald-600">{checkedIn}/{total} attendees</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* ── Tab Nav ── */}
        <div className="flex gap-1 mb-4 p-1 bg-gray-100 rounded-xl w-fit">
          {[
            { id: "search", label: "Search & Check-in", icon: <Search size={13} /> },
            { id: "activity", label: "Live Activity", icon: <Activity size={13} /> },
            { id: "stats", label: "Stats", icon: <BarChart2 size={13} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── Search & Check-in Tab ── */}
        {activeTab === "search" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or ticket type…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-50 text-sm transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    {["Attendee", "Ticket Type", "Status", "Action"].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-[0.65rem] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ticket) => (
                    <AttendeeRow
                      key={ticket._id}
                      ticket={ticket}
                      onCheckIn={handleCheckIn}
                      onRefund={openRefundModal}
                      checkingIn={checkingIn}
                      processingRefund={processingRefund}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && (
              <div className="py-12 text-center text-gray-400">
                <Ticket size={36} className="mx-auto mb-2 opacity-25" />
                <p className="text-sm font-semibold">{search ? "No matching attendees" : "No tickets found"}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Activity Tab ── */}
        <Modal
          open={refundModal.open}
          title="Confirm refund"
          description={refundModal.ticket ? `Refund ticket for ${refundModal.ticket.buyer?.name || "attendee"}` : ""}
          onClose={closeRefundModal}
        >
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              This will mark the ticket as refunded and return the buyer's payment to the original method if available.
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Reason</label>
              <textarea
                value={refundModal.reason}
                onChange={(e) => setRefundModal((prev) => ({ ...prev, reason: e.target.value }))}
                rows={4}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-pink-400 focus:ring-pink-50 focus:outline-none"
                placeholder="Optional: note for buyer and audit log"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={closeRefundModal}
                className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRefundSubmit}
                disabled={processingRefund === refundModal.ticket?._id}
                className="inline-flex items-center justify-center rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-all"
              >
                {processingRefund === refundModal.ticket?._id ? "Processing…" : "Refund ticket"}
              </button>
            </div>
          </div>
        </Modal>

        {activeTab === "activity" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">Live check-in feed</span>
              <span className="text-xs text-gray-400">{activity.length} events</span>
            </div>
            <div className="px-4 py-2 max-h-[480px] overflow-y-auto">
              {activity.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <Activity size={32} className="mx-auto mb-2 opacity-25" />
                  <p className="text-sm">No activity yet, check-ins will appear here</p>
                </div>
              ) : (
                activity.map((item) => <ActivityItem key={item.id} item={item} />)
              )}
            </div>
          </div>
        )}

        {/* ── Stats Tab ── */}
        {activeTab === "stats" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "Ticket types", value: [...new Set(tickets.map((t) => t.ticketType))].length, icon: <Ticket size={16} /> },
                { label: "Check-in rate", value: `${pct}%`, icon: <CheckCircle2 size={16} /> },
                { label: "Manual check-ins", value: activity.filter((a) => a.type === "manual").length, icon: <Users size={16} /> },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-pink-50 flex items-center justify-center text-pink-500">
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Ticket type breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">By ticket type</h3>
              {[...new Set(tickets.map((t) => t.ticketType))].map((type) => {
                const typeTickets = tickets.filter((t) => t.ticketType === type);
                const typeIn = typeTickets.filter((t) => t.status === "checked-in").length;
                const typePct = typeTickets.length ? Math.round((typeIn / typeTickets.length) * 100) : 0;
                return (
                  <div key={type} className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-700">{type}</span>
                      <span className="text-xs text-gray-400">{typeIn}/{typeTickets.length} · {typePct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-pink-400 rounded-full transition-all" style={{ width: `${typePct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}