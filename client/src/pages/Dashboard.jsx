import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import { Link, useNavigate } from "react-router-dom";
import EditEvent from "../components/EditEvent";
import TeamManagement from "../components/TeamManagement";
import EventActionMenu from "../components/EventActionMenu";
import VerificationStatusCard from "../components/VerificationStatusCard";
import { getCurrentUser } from "../utils/auth";
import WhatsAppSharingCenter from "../components/WhatsAppSharingCenter";
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
    Copy,
    FileClock,
    AlertTriangle,
    ShieldAlert,
} from "lucide-react";
import { useCreateEvent } from "../context/CreateEventContext";
import { ticketNetToOrganizer } from "../utils/transactions";
import { getEventImageUrl } from "../utils/eventHelpers";
import useFeatureAccess from "../hooks/useFeatureAccess";
import TrialNotificationBanner from "../components/TrialNotificationBanner";
import AppPage from "../components/layout/AppPage";

const ADMIN_ROLES = ["super_admin", "admin", "moderator", "finance_admin", "support_admin"];
const VERIFIED_ROLES = ["organizer", ...ADMIN_ROLES];

// ── Stat Card ─────────────────────────────────────────────────────────────────
const STAT_COLORS = {
    blue: { bar: "bg-blue-500", icon: "bg-blue-50  text-blue-500" },
    pink: { bar: "bg-pink-500", icon: "bg-pink-50  text-pink-500" },
    green: { bar: "bg-emerald-500", icon: "bg-emerald-50 text-emerald-600" },
    red: { bar: "bg-red-500", icon: "bg-red-50   text-red-500" },
};

const StatCard = ({ title, value, icon: Icon, color = "pink" }) => {
    const c = STAT_COLORS[color] || STAT_COLORS.pink;
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-pink-100">
            {/* top accent bar */}
            <div className={`absolute inset-x-0 top-0 h-[3px] ${c.bar}`} />
            <div className="flex items-start justify-between gap-3 pt-1">
                <div className="min-w-0">
                    <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">{title}</p>
                    <p className="mt-1.5 text-[1.55rem] font-extrabold leading-none tracking-tight text-gray-900 tabular-nums">
                        {value}
                    </p>
                </div>
                <div className={`flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${c.icon}`}>
                    <Icon size={20} />
                </div>
            </div>
        </div>
    );
};

// ── Section header ────────────────────────────────────────────────────────────
const SectionHeader = ({ title, subtitle, action }) => (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
            <h2 className="text-base font-extrabold tracking-tight text-gray-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
        </div>
        {action}
    </div>
);

// ── Status pill ───────────────────────────────────────────────────────────────
const STATUS_MAP = {
    Live: { cls: "bg-red-500 text-white animate-pulse", label: "LIVE" },
    Upcoming: { cls: "bg-blue-500 text-white", label: "Upcoming" },
    Ended: { cls: "bg-gray-400 text-white", label: "Ended" },
    Cancelled: { cls: "bg-red-600 text-white", label: "Cancelled" },
    Suspended: { cls: "bg-red-700 text-white", label: "Suspended" },
    Published: { cls: "bg-emerald-500 text-white", label: "Published" },
};

const StatusPill = ({ status }) => {
    const cfg = STATUS_MAP[status];
    if (!cfg) return null;
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.58rem] font-extrabold uppercase tracking-wide ${cfg.cls}`}>
            {cfg.label}
        </span>
    );
};

// ── Loading skeleton ──────────────────────────────────────────────────────────
const Skeleton = () => (
    <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}
        </div>
        <div className="h-48 bg-gray-100 rounded-2xl" />
        <div className="h-40  bg-gray-100 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-64 bg-gray-100 rounded-2xl" />)}
        </div>
    </div>
);

// ── Panel wrapper ─────────────────────────────────────────────────────────────
const Panel = ({ children, className = "" }) => (
    <div className={`overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm ${className}`}>
        {children}
    </div>
);
const PanelHead = ({ children }) => (
    <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-3.5">
        <h3 className="text-xs font-extrabold text-gray-900">{children}</h3>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
    const [events, setEvents] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [teamModalOpen, setTeamModalOpen] = useState(false);
    const [selectedTeamEventId, setSelectedTeamEventId] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [financeSummary, setFinanceSummary] = useState(null);
    const [fraudInfo, setFraudInfo] = useState(null);
    const [payoutHistory, setPayoutHistory] = useState(null);
    const [userVerification, setUserVerification] = useState(null);

    const { hasAccess: canAccessAnalytics, promptUpgrade: promptUpgradeAnalytics } = useFeatureAccess("analytics");
    const { hasAccess: canAccessLiveStreaming, promptUpgrade: promptUpgradeLive } = useFeatureAccess("live_stream");

    const token = localStorage.getItem("token");
    const navigate = useNavigate();
    const user = useMemo(() => getCurrentUser(), []);
    const { openCreateEvent } = useCreateEvent();

    const handleEditClick = (id) => { setSelectedEventId(id); setEditModalOpen(true); };
    const handleModalClose = () => { setEditModalOpen(false); setSelectedEventId(null); };
    const handleTeamClick = (id) => { setSelectedTeamEventId(id); setTeamModalOpen(true); };
    const handleTeamModalClose = () => { setTeamModalOpen(false); setSelectedTeamEventId(null); };

    const fetchDashboardData = useCallback(() => {
        setLoading(true);
        setError(null);
        Promise.all([
            API.get("/events/my-events?includeDrafts=true", { headers: { Authorization: `Bearer ${token}` } }),
            API.get("/stats/stats", { headers: { Authorization: `Bearer ${token}` } }),
            API.get("/organizer/transactions", { headers: { Authorization: `Bearer ${token}` } }),
            API.get("/users/me", { headers: { Authorization: `Bearer ${token}` } }),
            API.get("/finance/organizer/balances", { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
            API.get("/finance/organizer/payouts?page=1&limit=5", { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        ])
            .then(([eventsRes, statsRes, transactionRes, userRes, balancesRes, payoutsRes]) => {
                setEvents(eventsRes.data || []);
                setStats(statsRes.data || null);
                setTransactions(transactionRes.data || []);
                if (userRes?.data?.verification) setUserVerification(userRes.data.verification);
                if (balancesRes?.data) {
                    setFinanceSummary(balancesRes.data.summary || balancesRes.data);
                    setFraudInfo(balancesRes.data.fraud || null);
                }
                if (payoutsRes?.data) setPayoutHistory(payoutsRes.data.history || payoutsRes.data);
                setLoading(false);
            })
            .catch(() => { setError("Failed to load dashboard data"); setLoading(false); });
    }, [token]);

    useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

    const handleEventUpdated = () => fetchDashboardData();

    // ── Admin verification actions ────────────────────────────────────────────
    const handleApproveVerification = async () => {
        if (!userVerification?._id) return;
        try {
            const { data } = await API.patch(
                `/admin/verifications/${userVerification._id}/approve`, {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUserVerification(data.verification || { ...userVerification, status: "approved", isVerified: true });
        } catch { setError("Failed to approve verification."); }
    };

    const handleRejectVerification = async () => {
        const reason = window.prompt("Enter rejection reason:");
        if (!reason || !userVerification?._id) return;
        try {
            const { data } = await API.patch(
                `/admin/verifications/${userVerification._id}/reject`,
                { reason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUserVerification(data.verification || { ...userVerification, status: "rejected", rejectionReason: reason });
        } catch { setError("Failed to reject verification."); }
    };

    const toggleLive = async (id, currentStatus) => {
        if (!canAccessLiveStreaming) { promptUpgradeLive(); return; }
        try {
            await API.patch("/events/toggle-live", { eventId: id, isLive: !currentStatus });
            setEvents((prev) =>
                prev.map((ev) => ev._id === id ? { ...ev, liveStream: { ...ev.liveStream, isLive: !currentStatus } } : ev)
            );
            if (!currentStatus) navigate(`/live/${id}`);
        } catch { setError("Failed to toggle live status"); }
    };

    const handleDelete = async (id) => {
        const eventToDelete = events.find((e) => e._id === id);
        if (!window.confirm(`Delete "${eventToDelete?.title}"? This cannot be undone.`)) return;
        try {
            await API.delete(`/events/delete/${id}`);
            setEvents((prev) => prev.filter((e) => e._id !== id));
        } catch { setError("Failed to delete event. Please try again."); }
    };

    const handleDeleteDraft = async (id, title) => {
        if (!window.confirm(`Delete draft "${title || "Untitled draft"}"? This cannot be undone.`)) return;
        try {
            await API.delete(`/events/delete/${id}`);
            setEvents((prev) => prev.filter((e) => e._id !== id));
        } catch { setError("Failed to delete draft. Please try again."); }
    };

    const formatNum = (n) =>
        n === null || n === undefined || Number.isNaN(n)
            ? "0"
            : new Intl.NumberFormat("en-NG").format(n);

    const getPayoutTone = (state) => {
        const s = String(state || "").toLowerCase();
        if (s === "released" || s === "completed") return "green";
        if (s === "pending" || s === "processing") return "amber";
        if (s === "under_review") return "pink";
        if (["frozen", "refunded", "failed"].includes(s)) return "red";
        return "blue";
    };

    // Tone → pill class
    const toneClass = (tone) => ({
        green: "bg-emerald-50 text-emerald-700",
        amber: "bg-amber-50  text-amber-700",
        pink: "bg-pink-50   text-pink-600",
        red: "bg-red-50    text-red-600",
        blue: "bg-blue-50   text-blue-700",
    }[tone] || "bg-gray-100 text-gray-600");

    const payoutItems = payoutHistory?.items || payoutHistory?.history || payoutHistory?.payouts || [];
    const draftEvents = events.filter((e) => e.isDraft);
    const publishedEvents = events.filter((e) => !e.isDraft);
    const latestTx = transactions.slice(0, 3);


    const isAdminRole = (role) => ADMIN_ROLES.includes(role);

    return (
        <AppPage
            title="Organizer Dashboard"
            description={`Welcome back${user?.username ? `, ${user.username}` : ""}. Manage your events, sales, and live sessions.`}
        >
            {/* Verification status */}
            {VERIFIED_ROLES.includes(user?.role) && (
                <div className="mb-6">
                    <VerificationStatusCard
                        verification={userVerification}
                        userRole={user?.role}
                        onStartVerification={() => navigate("/verification")}
                        onApprove={handleApproveVerification}
                        onReject={handleRejectVerification}
                        compact={!isAdminRole(user?.role)}
                    />
                </div>
            )}

            <TrialNotificationBanner />

            {/* Top action buttons */}
            <div className="mb-6 flex flex-wrap justify-end gap-2">
                <Link
                    to="/events"
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-600 shadow-sm transition hover:border-pink-300 hover:text-pink-600"
                >
                    Browse events <ArrowRight size={15} />
                </Link>
                <button
                    type="button"
                    onClick={() => openCreateEvent()}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-pink-500 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-pink-600 active:scale-95"
                >
                    Create event <PlusCircle size={15} />
                </button>
            </div>

            {loading && <Skeleton />}

            {!loading && error && (
                <Panel className="p-6">
                    <p className="text-sm font-bold text-red-600 mb-3">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-pink-400 hover:text-pink-600 transition"
                    >
                        Try again
                    </button>
                </Panel>
            )}

            {!loading && !error && (
                <>
                    {/* ── Core stats ── */}
                    {stats && (
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <StatCard title="Total Events" value={stats.totalEvents} icon={LayoutDashboard} color="blue" />
                            <StatCard title="Tickets Sold" value={formatNum(stats.totalTicketsSold)} icon={Ticket} color="pink" />
                            <StatCard title="Revenue" value={`₦${formatNum(stats.totalRevenue)}`} icon={BarChart3} color="green" />
                            <StatCard title="Live Sessions" value={stats.currentlyLive} icon={Radio} color="red" />
                        </div>
                    )}

                    {/* ── Finance summary ── */}
                    {financeSummary && (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
                                <StatCard title="Available Balance" value={`₦${formatNum(financeSummary.availableBalance || 0)}`} icon={Wallet} color="green" />
                                <StatCard title="Escrow Balance" value={`₦${formatNum(financeSummary.escrowBalance || 0)}`} icon={Wallet} color="pink" />
                                <StatCard title="Pending Release" value={`₦${formatNum(financeSummary.pendingReleaseBalance || 0)}`} icon={FileClock} color="blue" />
                                <StatCard title="Released Revenue" value={`₦${formatNum(financeSummary.releasedRevenue || 0)}`} icon={BarChart3} color="green" />
                                <StatCard title="Refunded Revenue" value={`₦${formatNum(financeSummary.refundedRevenue || 0)}`} icon={Wallet} color="red" />
                            </div>

                            {fraudInfo && (
                                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                    <StatCard title="Fraud Alerts" value={formatNum(fraudInfo.flagCount || 0)} icon={AlertTriangle} color="red" />
                                    <StatCard title="Suspicious Transactions" value={formatNum(fraudInfo.suspiciousTransactionsCount || 0)} icon={ShieldAlert} color="pink" />
                                    <StatCard title="Refund Spike" value={`${Math.round((fraudInfo.refundSpike?.ratio || 0) * 100)}%`} icon={AlertTriangle} color="red" />
                                    <StatCard title="Suspicious Payouts" value={formatNum(fraudInfo.suspiciousPayouts?.length || 0)} icon={ShieldAlert} color="pink" />
                                </div>
                            )}

                            {/* Restrictions banner */}
                            {(userVerification?.status !== "approved" ||
                                (fraudInfo?.flagCount || 0) > 0 ||
                                (financeSummary.escrowBalance || 0) > 0) && (
                                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 mb-6">
                                        <h3 className="text-xs font-extrabold text-amber-900 mb-2">Payout Restrictions</h3>
                                        <div className="space-y-1.5 text-xs text-amber-800">
                                            {userVerification?.status !== "approved" && (
                                                <p>Account verification pending — withdrawals are restricted until approved.</p>
                                            )}
                                            {(fraudInfo?.flagCount || 0) > 0 && (
                                                <p>{formatNum(fraudInfo.flagCount)} active fraud alert(s) may hold payout processing. Contact support.</p>
                                            )}
                                            {(financeSummary.escrowBalance || 0) > 0 && (
                                                <p>Escrow rules are holding ₦{formatNum(financeSummary.escrowBalance)} pending review.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                        </>
                    )}

                    <WhatsAppSharingCenter events={events} currentUserId={user?.id} />

                    {/* ── Top events ── */}
                    {stats?.topEvents?.filter((e) => !e.isDraft).length > 0 && (
                        <Panel className="mb-6">
                            <PanelHead>Top Performing Events</PanelHead>
                            <div className="p-5 space-y-1">
                                {stats.topEvents.filter((e) => !e.isDraft).slice(0, 3).map((event, i) => (
                                    <div
                                        key={i}
                                        className="grid grid-cols-[28px_1fr_180px] items-center gap-4 py-3 border-b border-gray-50 last:border-none"
                                    >
                                        <span className="text-xs font-extrabold text-gray-300 text-center">#{i + 1}</span>
                                        <div>
                                            <p className="text-xs font-bold text-gray-900 truncate">{event.title}</p>
                                            <p className="text-[0.6rem] text-gray-400">
                                                {formatNum(event.quantitySold || event.ticketsSold || 0)} tickets sold
                                            </p>
                                        </div>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                                            <div
                                                className="h-full rounded-full bg-pink-400 transition-all duration-700"
                                                style={{
                                                    width: `${Math.min(100, ((event.quantitySold || event.ticketsSold || 0) / (stats.totalTicketsSold || 1)) * 100)}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Panel>
                    )}

                    {/* ── Transaction history ── */}
                    <Panel className="mb-6">
                        <PanelHead>Transaction History</PanelHead>
                        <div className="p-5">
                            {latestTx.length === 0 ? (
                                <p className="text-xs text-gray-400">No transactions yet.</p>
                            ) : (
                                <div>
                                    {latestTx.map((tx) => (
                                        <div
                                            key={tx._id}
                                            className="flex items-center justify-between gap-3 py-3 border-b border-gray-50 last:border-none px-1 rounded-lg hover:bg-gray-50/50 transition-colors"
                                        >
                                            <div>
                                                <p className="text-xs font-bold text-gray-900">{tx.type.toUpperCase()}</p>
                                                <p className="text-[0.6rem] text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <p className="text-xs font-semibold text-gray-900 tabular-nums">
                                                ₦{formatNum(ticketNetToOrganizer(tx))}
                                            </p>
                                            <span className={`rounded-full px-2.5 py-1 text-[0.6rem] font-bold ${tx.status === "success" ? "bg-emerald-50 text-emerald-700"
                                                : tx.status === "pending" ? "bg-amber-50 text-amber-700"
                                                    : "bg-red-50 text-red-600"
                                                }`}>
                                                {tx.status}
                                            </span>
                                        </div>
                                    ))}
                                    <Link
                                        to="/transactions"
                                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-pink-500 hover:text-pink-600 transition-colors"
                                    >
                                        View All Transactions <ArrowRight size={13} />
                                    </Link>
                                </div>
                            )}
                        </div>
                    </Panel>

                    {/* ── Payout history ── */}
                    {payoutItems.length > 0 && (
                        <Panel className="mb-6">
                            <PanelHead>Payout History</PanelHead>
                            <div className="p-5">
                                {payoutItems.map((p) => (
                                    <div
                                        key={p._id || p.id}
                                        className="flex items-center justify-between gap-3 py-3 border-b border-gray-50 last:border-none px-1 rounded-lg hover:bg-gray-50/50 transition-colors"
                                    >
                                        <div>
                                            <p className="text-xs font-bold text-gray-900">
                                                {p.event?.title || "Event Payout"}
                                            </p>
                                            <p className="text-[0.6rem] text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <p className="text-xs font-semibold text-gray-900 tabular-nums">
                                            ₦{formatNum(p.netAmount || p.amount || 0)}
                                        </p>
                                        <span className={`rounded-full px-2.5 py-1 text-[0.6rem] font-bold ${toneClass(getPayoutTone(p.state))}`}>
                                            {p.state || p.status || "unknown"}
                                        </span>
                                    </div>
                                ))}
                                <Link
                                    to="/dashboard/payouts"
                                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-pink-500 hover:text-pink-600 transition-colors"
                                >
                                    View All Payouts <ArrowRight size={13} />
                                </Link>
                            </div>
                        </Panel>
                    )}

                    {/* ── Draft events ── */}
                    {draftEvents.length > 0 && (
                        <div className="mb-8">
                            <SectionHeader
                                title="Saved drafts"
                                subtitle="Jump back into unfinished events without losing progress."
                                action={
                                    <button
                                        type="button"
                                        onClick={() => openCreateEvent({ resumeLatest: true })}
                                        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 hover:border-pink-300 hover:text-pink-600 transition"
                                    >
                                        Resume latest <ArrowRight size={13} />
                                    </button>
                                }
                            />

                            <div className="grid gap-4 lg:grid-cols-2">
                                {draftEvents.map((event) => (
                                    <div
                                        key={event._id}
                                        className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm"
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="min-w-0">
                                                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[0.62rem] font-bold uppercase tracking-widest text-amber-700 border border-amber-200">
                                                    <FileClock size={12} /> Draft
                                                </div>
                                                <h3 className="text-sm font-bold text-gray-900">{event.title || "Untitled draft"}</h3>
                                                <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                                                    {event.description || "This draft is waiting for its final details."}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 flex-shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteDraft(event._id, event.title)}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-white text-red-500 hover:bg-red-50 transition"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openCreateEvent({ draftEvent: event })}
                                                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-pink-500 px-3 text-xs font-semibold text-white hover:bg-pink-600 transition active:scale-95"
                                                >
                                                    Resume <ArrowRight size={13} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-4 grid grid-cols-3 gap-2">
                                            {[
                                                { label: "Last saved", value: new Date(event.draftUpdatedAt || event.createdAt).toLocaleDateString() },
                                                { label: "Progress", value: `Step ${event.draftStep || 1} of 5` },
                                                { label: "Format", value: event.eventType || "In-person" },
                                            ].map(({ label, value }) => (
                                                <div key={label} className="rounded-xl bg-white border border-amber-100 p-3">
                                                    <p className="text-[0.58rem] font-bold uppercase tracking-widest text-gray-400">{label}</p>
                                                    <p className="mt-1 text-xs font-semibold text-gray-900">{value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Published events ── */}
                    <SectionHeader title="Published events" />

                    {publishedEvents.length === 0 ? (
                        <Panel className="py-16 px-8 text-center">
                            <p className="text-xs text-gray-400 mb-5">
                                You haven't created any events yet. Ready to host your first one?
                            </p>
                            <button
                                onClick={() => openCreateEvent()}
                                className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-pink-500 text-white text-xs font-semibold hover:bg-pink-600 transition active:scale-95"
                            >
                                Create Your First Event <PlusCircle size={15} />
                            </button>
                        </Panel>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {publishedEvents.map((event) => (
                                <div
                                    key={event._id}
                                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-pink-100"
                                >
                                    <div className="absolute top-3 right-3 z-10">
                                        <EventActionMenu
                                            items={[
                                                {
                                                    key: "live",
                                                    label: event.liveStream?.isLive ? "Stop Live" : "Go Live",
                                                    icon: Radio,
                                                    active: Boolean(event.liveStream?.isLive),
                                                    onClick: () =>
                                                        canAccessLiveStreaming
                                                            ? toggleLive(event._id, event.liveStream?.isLive)
                                                            : promptUpgradeLive(),
                                                },
                                                { key: "edit", label: "Edit event", icon: Pencil, onClick: () => handleEditClick(event._id) },
                                                { key: "tickets", label: "Manage tickets", icon: Ticket, to: `/events/${event._id}/tickets` },
                                                canAccessAnalytics
                                                    ? { key: "analytics", label: "Analytics", icon: BarChart3, to: `/events/${event._id}/analytics` }
                                                    : { key: "analytics-upgrade", label: "Analytics", icon: BarChart3, onClick: promptUpgradeAnalytics },
                                                { key: "team", label: "Manage team", icon: Users, onClick: () => handleTeamClick(event._id) },
                                                { key: "duplicate", label: "Duplicate event", icon: Copy, onClick: () => openCreateEvent({ duplicateEventId: event._id }) },
                                                { key: "divider-delete", type: "divider" },
                                                { key: "delete", label: "Delete event", icon: Trash2, danger: true, onClick: () => handleDelete(event._id) },
                                            ]}
                                        />
                                    </div>

                                    {getEventImageUrl(event) ? (
                                        <img
                                            src={getEventImageUrl(event)}
                                            alt={event.title}
                                            className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex h-40 w-full items-center justify-center bg-gray-900">
                                            <Calendar size={28} className="text-white/20" />
                                        </div>
                                    )}

                                    <div className="flex flex-1 flex-col gap-2.5 p-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="text-xs font-bold leading-snug text-gray-900 line-clamp-2">{event.title}</h3>
                                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                <StatusPill status={event.eventLifecycleStatus} />
                                                {event.liveStream?.isLive && (
                                                    <span className="inline-flex items-center rounded-full bg-red-500 px-2 py-0.5 text-[0.58rem] font-extrabold uppercase tracking-wide text-white animate-pulse">
                                                        LIVE
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-[0.65rem] text-gray-400 line-clamp-2">{event.description || "No description provided."}</p>

                                        <div className="mt-auto space-y-1.5">
                                            <div className="flex items-center gap-1.5 text-[0.65rem] text-gray-600">
                                                <Calendar size={12} className="text-pink-400 flex-shrink-0" />
                                                <span>
                                                    {new Date(event.startDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {event.startTime}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[0.65rem] text-gray-600">
                                                <MapPin size={12} className="text-pink-400 flex-shrink-0" />
                                                <span className="truncate">{event.location}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[0.65rem] text-gray-600">
                                                <Users size={12} className="text-pink-400 flex-shrink-0" />
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

            <EditEvent
                isOpen={editModalOpen}
                onClose={handleModalClose}
                eventId={selectedEventId}
                onEventUpdated={handleEventUpdated}
            />
            <TeamManagement
                eventId={selectedTeamEventId}
                isOpen={teamModalOpen}
                onClose={handleTeamModalClose}
            />
        </AppPage>
    );
}