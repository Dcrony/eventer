import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import { Link, useNavigate } from "react-router-dom";
import EditEvent from "../components/EditEvent";
import TeamManagement from "../components/TeamManagement";
import EventActionMenu from "../components/EventActionMenu";
import { getCurrentUser } from "../utils/auth";
import {
  ArrowRight,
  PlusCircle,
  LayoutDashboard,
  Ticket,
  BarChart3,
  Radio,
  Calendar,
  MapPin,
  Users,
  Wallet,
  Pencil,
  Trash2,
} from "lucide-react";
import CreateEvent from "./CreateEvent";
import { ticketNetToOrganizer } from "../utils/transactions";
import { getEventImageUrl } from "../utils/eventHelpers";
import useFeatureAccess from "../hooks/useFeatureAccess";
import TrialNotificationBanner from "../components/TrialNotificationBanner";

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [selectedTeamEventId, setSelectedTeamEventId] = useState(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [transactions, setTransactions] = useState([]);

  const { hasAccess: canAccessAnalytics, promptUpgrade: promptUpgradeAnalytics } = useFeatureAccess("analytics");
  const { hasAccess: canAccessLiveStreaming, promptUpgrade: promptUpgradeLive } = useFeatureAccess("live_stream");

  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const user = useMemo(() => getCurrentUser(), []);

  const handleEditClick = (id) => { setSelectedEventId(id); setEditModalOpen(true); };
  const handleModalClose = () => { setEditModalOpen(false); setSelectedEventId(null); };
  const handleTeamClick = (id) => { setSelectedTeamEventId(id); setTeamModalOpen(true); };
  const handleTeamModalClose = () => { setTeamModalOpen(false); setSelectedTeamEventId(null); };

  const handleEventUpdated = () => {
    API.get("/events/my-events", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setEvents(res.data))
      .catch(() => setError("Failed to refresh events"));
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      API.get("/events/my-events", { headers: { Authorization: `Bearer ${token}` } }),
      API.get("/stats/stats", { headers: { Authorization: `Bearer ${token}` } }),
      API.get("/organizer/transactions", { headers: { Authorization: `Bearer ${token}` } }),
    ])
      .then(([eventsRes, statsRes, transactionRes]) => {
        setEvents(eventsRes.data || []);
        setStats(statsRes.data || null);
        setTransactions(transactionRes.data || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load dashboard data");
        setLoading(false);
      });
  }, [token, user]);

  const toggleLive = async (id, currentStatus) => {
    if (!canAccessLiveStreaming) { promptUpgradeLive(); return; }
    try {
      await API.patch("/events/toggle-live", { eventId: id, isLive: !currentStatus });
      setEvents(events.map((ev) =>
        ev._id === id ? { ...ev, liveStream: { ...ev.liveStream, isLive: !currentStatus } } : ev
      ));
      if (!currentStatus) navigate(`/live/${id}`);
    } catch {
      setError("Failed to toggle live status");
    }
  };

  const handleDelete = async (id) => {
    const eventToDelete = events.find((e) => e._id === id);
    if (!window.confirm(`Are you sure you want to delete "${eventToDelete?.title}"?\n\nThis action cannot be undone.`)) return;
    try {
      await API.delete(`/events/delete/${id}`);
      setEvents(events.filter((e) => e._id !== id));
    } catch {
      setError("Failed to delete event. Please try again.");
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined || Number.isNaN(num)) return "0";
    return new Intl.NumberFormat("en-NG").format(num);
  };

  const StatCard = ({ title, value, icon: Icon, color }) => {
    const colorClasses = { blue: "before:bg-blue-500", pink: "before:bg-pink-500", green: "before:bg-green-500", red: "before:bg-red-500" };
    const iconBgClasses = { blue: "bg-blue-50 text-blue-500", pink: "bg-pink-50 text-pink-500", green: "bg-green-50 text-green-500", red: "bg-red-50 text-red-500" };
    return (
      <div className={`group relative bg-white rounded-2xl border border-gray-200 p-5 flex justify-between items-center transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-pink-200/40 before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:rounded-t-2xl before:opacity-0 group-hover:before:opacity-100 ${colorClasses[color]}`}>
        <div>
          <div className="text-[0.68rem] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{title}</div>
          <div className="text-[1.65rem] font-extrabold text-gray-900 tracking-tight leading-none">{value}</div>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3 ${iconBgClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    );
  };

  const latestTransactions = transactions.slice(0, 3);

  // ── Skeleton ────────────────────────────────────────────────────────────────
  const Skeleton = () => (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
        ))}
      </div>
      <div className="h-48 bg-gray-100 rounded-2xl" />
      <div className="h-40 bg-gray-100 rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-geist pt-8 transition-all duration-300 lg:pl-[var(--sidebar-width,0px)]">
      <TrialNotificationBanner />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── Header — always visible ── */}
        <div className="flex flex-wrap items-end justify-between gap-6 pb-6 mb-8 border-b border-gray-200">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-gray-900">
              Organizer Dashboard
            </h1>
            <p className="text-sm text-gray-400 mt-1.5">
              Welcome back{user?.username ? `, ${user.username}` : ""}. Manage your events, sales, and live sessions.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link
              to="/events"
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full border border-gray-200 bg-white text-gray-600 text-sm font-semibold transition-all duration-200 hover:border-pink-500 hover:text-pink-500 hover:bg-pink-50 hover:-translate-y-0.5 shadow-sm"
            >
              Browse events <ArrowRight size={18} />
            </Link>
            <button
              onClick={() => setShowCreateEvent(true)}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full bg-pink-500 text-white text-sm font-semibold transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 shadow-md shadow-pink-500/20"
            >
              Create event <PlusCircle size={18} />
            </button>
          </div>
        </div>

        {/* ── Loading skeleton ── */}
        {loading && <Skeleton />}

        {/* ── Error state ── */}
        {!loading && error && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <p className="text-red-600 font-bold mb-3">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-gray-200 text-sm font-semibold hover:border-pink-500 hover:text-pink-500 transition-all"
            >
              Try again
            </button>
          </div>
        )}

        {/* ── Content ── */}
        {!loading && !error && (
          <>
            {/* Stat Cards */}
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                <StatCard title="Total Events" value={stats.totalEvents} icon={LayoutDashboard} color="blue" />
                <StatCard title="Tickets Sold" value={formatNumber(stats.totalTicketsSold)} icon={Ticket} color="pink" />
                <StatCard title="Revenue" value={`₦${formatNumber(stats.totalRevenue)}`} icon={BarChart3} color="green" />
                <StatCard title="Live Sessions" value={stats.currentlyLive} icon={Radio} color="red" />
                <StatCard title="Available Balance" value={`₦${formatNumber(stats.availableBalance || 0)}`} icon={Wallet} color="green" />
                <StatCard title="Pending Balance" value={`₦${formatNumber(stats.pendingBalance || 0)}`} icon={Wallet} color="green" />
              </div>
            )}

            {/* Top Performing Events */}
            {stats?.topEvents?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="text-sm font-bold text-gray-900">Top Performing Events</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-0">
                    {stats.topEvents.slice(0, 3).map((event, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-[32px_1fr_180px] items-center gap-4 py-3.5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors duration-200 rounded-lg"
                      >
                        <div className="text-sm font-extrabold text-gray-400 text-center">#{index + 1}</div>
                        <div>
                          <div className="text-sm font-bold text-gray-900 mb-0.5 truncate">{event.title}</div>
                          <div className="text-xs text-gray-400">
                            {formatNumber(event.quantitySold || event.ticketsSold || 0)} tickets sold
                          </div>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-pink-500 to-pink-300 rounded-full transition-all duration-1000"
                            style={{
                              width: `${Math.min(100, ((event.quantitySold || event.ticketsSold || 0) / (stats.totalTicketsSold || 1)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Transaction History */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-900">Transaction History</h3>
              </div>
              <div className="p-6">
                {latestTransactions.length === 0 ? (
                  <p className="text-gray-500 text-sm">No transactions yet.</p>
                ) : (
                  <div className="space-y-0">
                    {latestTransactions.map((tx) => (
                      <div
                        key={tx._id}
                        className="flex justify-between items-center py-3.5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors duration-200 rounded-lg px-2"
                      >
                        <div>
                          <strong className="text-sm text-gray-900">{tx.type.toUpperCase()}</strong>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          ₦{formatNumber(ticketNetToOrganizer(tx))}
                        </div>
                        <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                          tx.status === "success" ? "bg-green-50 text-green-600"
                          : tx.status === "pending" ? "bg-amber-50 text-amber-600"
                          : "bg-red-50 text-red-600"
                        }`}>
                          {tx.status}
                        </div>
                      </div>
                    ))}
                    <Link
                      to="/transactions"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-pink-500 hover:text-pink-600 mt-3 transition-colors duration-200"
                    >
                      View All Transactions <ArrowRight size={16} />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Your Events */}
            <h2 className="text-lg font-extrabold text-gray-900 mb-4 tracking-tight">Your events</h2>

            {events.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm text-center py-16 px-8">
                <p className="text-gray-400 text-sm mb-6">
                  You haven't created any events yet. Ready to host your first one?
                </p>
                <button
                  onClick={() => setShowCreateEvent(true)}
                  className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-pink-500 text-white text-sm font-semibold transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 shadow-md shadow-pink-500/20"
                >
                  Create Your First Event <PlusCircle size={18} />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {events.map((event) => (
                  <div
                    key={event._id}
                    className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-pink-200/40 flex flex-col"
                  >
                    <div className="absolute top-3 right-3 z-10">
                      <EventActionMenu
                        items={[
                          {
                            key: "live",
                            label: event.liveStream?.isLive ? "Stop Live" : "Go Live",
                            icon: Radio,
                            active: Boolean(event.liveStream?.isLive),
                            onClick: () => canAccessLiveStreaming ? toggleLive(event._id, event.liveStream?.isLive) : promptUpgradeLive(),
                          },
                          { key: "edit", label: "Edit event", icon: Pencil, onClick: () => handleEditClick(event._id) },
                          { key: "tickets", label: "Manage tickets", icon: Ticket, to: `/events/${event._id}/tickets` },
                          canAccessAnalytics
                            ? { key: "analytics", label: "Analytics", icon: BarChart3, to: `/events/${event._id}/analytics` }
                            : { key: "analytics-upgrade", label: "Analytics", icon: BarChart3, onClick: promptUpgradeAnalytics },
                          { key: "team", label: "Manage team", icon: Users, onClick: () => handleTeamClick(event._id) },
                          { key: "divider-delete", type: "divider" },
                          { key: "delete", label: "Delete event", icon: Trash2, danger: true, onClick: () => handleDelete(event._id) },
                        ]}
                      />
                    </div>

                    {getEventImageUrl(event) ? (
                      <img
                        src={getEventImageUrl(event)}
                        alt={event.title}
                        className="w-full h-44 object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-44 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                        <Calendar size={32} className="text-white/20" />
                      </div>
                    )}

                    <div className="p-4 flex-1 flex flex-col gap-2.5">
                      <div className="flex justify-between items-start gap-3">
                        <h3 className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">{event.title}</h3>
                        {event.liveStream?.isLive && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-500 text-white text-[0.6rem] font-extrabold uppercase tracking-wide shadow-lg shadow-red-500/30 animate-pulse">
                            LIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">{event.description || "No description provided."}</p>
                      <div className="mt-auto space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Calendar size={14} className="text-pink-500 flex-shrink-0" />
                          <span>
                            {new Date(event.startDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} • {event.startTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <MapPin size={14} className="text-pink-500 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Users size={14} className="text-pink-500 flex-shrink-0" />
                          <span>{event.ticketsSold}/{event.totalTickets} tickets sold</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <EditEvent isOpen={editModalOpen} onClose={handleModalClose} eventId={selectedEventId} onEventUpdated={handleEventUpdated} />
      <CreateEvent isOpen={showCreateEvent} onClose={() => setShowCreateEvent(false)} />
      <TeamManagement eventId={selectedTeamEventId} isOpen={teamModalOpen} onClose={handleTeamModalClose} />
    </div>
  );
}