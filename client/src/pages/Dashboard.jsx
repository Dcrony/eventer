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
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    Eye,
    Zap,
    CheckCircle2,
    Clock,
    ChevronRight,
    RefreshCw,
    Play,
    Activity,
} from "lucide-react";
import { useCreateEvent } from "../context/CreateEventContext";
import { ticketNetToOrganizer } from "../utils/transactions";
import { getEventImageUrl } from "../utils/eventHelpers";
import useFeatureAccess from "../hooks/useFeatureAccess";
import TrialNotificationBanner from "../components/TrialNotificationBanner";
import AppPage from "../components/layout/AppPage";

const ADMIN_ROLES = ["super_admin", "admin", "moderator", "finance_admin", "support_admin"];
const VERIFIED_ROLES = ["organizer", ...ADMIN_ROLES];

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
    n == null || Number.isNaN(n) ? "0" : new Intl.NumberFormat("en-NG").format(n);

const fmtShort = (n) => {
    if (!n || isNaN(n)) return "0";
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
};

const payoutTone = (state) => {
    const s = String(state || "").toLowerCase();
    if (["released", "completed", "success"].includes(s)) return "green";
    if (["pending", "processing"].includes(s)) return "amber";
    if (s === "under_review") return "pink";
    if (["frozen", "refunded", "failed"].includes(s)) return "red";
    return "blue";
};

const toneStyles = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50  text-amber-700  border-amber-100",
    pink: "bg-pink-50   text-pink-600   border-pink-100",
    red: "bg-red-50    text-red-600    border-red-100",
    blue: "bg-blue-50   text-blue-700   border-blue-100",
};

const LIFECYCLE_STYLES = {
    Live: { bar: "bg-red-500", dot: "animate-ping bg-red-400", label: "Live now" },
    Upcoming: { bar: "bg-blue-500", dot: "bg-blue-400", label: "Upcoming" },
    Ended: { bar: "bg-gray-400", dot: "bg-gray-300", label: "Ended" },
    Cancelled: { bar: "bg-red-600", dot: "bg-red-500", label: "Cancelled" },
    Suspended: { bar: "bg-orange-500", dot: "bg-orange-400", label: "Suspended" },
    Published: { bar: "bg-emerald-500", dot: "bg-emerald-400", label: "Published" },
};

// ─── micro-components ─────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, color = "pink", trend }) {
    const colors = {
        pink: { accent: "bg-pink-500", icon: "bg-pink-50 text-pink-500", text: "text-pink-600" },
        blue: { accent: "bg-blue-500", icon: "bg-blue-50 text-blue-500", text: "text-blue-600" },
        green: { accent: "bg-emerald-500", icon: "bg-emerald-50 text-emerald-600", text: "text-emerald-600" },
        red: { accent: "bg-red-500", icon: "bg-red-50 text-red-500", text: "text-red-500" },
        violet: { accent: "bg-violet-500", icon: "bg-violet-50 text-violet-500", text: "text-violet-600" },
    };
    const c = colors[color] || colors.pink;
    return (
        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm group hover:border-pink-100 hover:shadow-md transition-all duration-200">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.accent}`} />
            <div className="flex items-start justify-between gap-3 pl-2">
                <div className="min-w-0 flex-1">
                    <p className="text-[0.58rem] font-black uppercase tracking-widest text-gray-400">{label}</p>
                    <p className="mt-2 text-2xl font-black leading-none tracking-tight text-gray-900 tabular-nums">
                        {value}
                    </p>
                    {sub && <p className="mt-1.5 text-[0.65rem] text-gray-400">{sub}</p>}
                    {trend != null && (
                        <div className={`mt-2 inline-flex items-center gap-1 text-[0.6rem] font-bold ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {trend >= 0 ? "+" : ""}{trend}% this month
                        </div>
                    )}
                </div>
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${c.icon}`}>
                    <Icon size={18} />
                </div>
            </div>
        </div>
    );
}

function MiniBarChart({ data = [], color = "bg-pink-500" }) {
    const max = Math.max(...data, 1);
    const today = new Date();
    const days = Array.from({ length: data.length }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (data.length - 1 - i));
        return d.toLocaleDateString("en-US", { weekday: "short" }).charAt(0);
    });
    return (
        <div className="flex items-end gap-1.5 h-28">
            {data.map((v, i) => {
                const pct = Math.max(6, (v / max) * 100);
                const isLast = i === data.length - 1;
                return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                        <div
                            className={`w-full rounded-t-lg transition-all duration-700 ${isLast ? color : "bg-pink-100"}`}
                            style={{ height: `${pct}%` }}
                        />
                        <span className="text-[0.5rem] font-medium text-gray-300">{days[i]}</span>
                    </div>
                );
            })}
        </div>
    );
}

function ChartCard({ title, subtitle, children, action }) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-gray-50 px-5 py-4">
                <div>
                    <p className="text-sm font-black text-gray-900">{title}</p>
                    {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
                </div>
                {action}
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

function Badge({ tone = "gray", children }) {
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.6rem] font-bold capitalize ${toneStyles[tone] || "bg-gray-50 text-gray-600 border-gray-100"}`}>
            {children}
        </span>
    );
}

function Skeleton() {
    return (
        <div className="space-y-5 animate-pulse">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-gray-100" />)}
            </div>
            <div className="grid lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 h-60 rounded-2xl bg-gray-100" />
                <div className="h-60 rounded-2xl bg-gray-100" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <div key={i} className="h-52 rounded-2xl bg-gray-100" />)}
            </div>
        </div>
    );
}

function SectionLabel({ children }) {
    return (
        <p className="mb-4 text-[0.6rem] font-black uppercase tracking-widest text-gray-400">{children}</p>
    );
}

function EmptyEvents({ onCreateEvent }) {
    return (
        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-pink-100 bg-pink-50/20 text-center px-8 py-12">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-100">
                <Calendar size={24} className="text-pink-500" />
            </div>
            <p className="text-sm font-black text-gray-900">No events published yet</p>
            <p className="mt-1.5 max-w-xs text-xs text-gray-400 leading-relaxed">
                Create your first event, sell tickets, run a live stream, or host a free meetup.
            </p>
            <button
                onClick={onCreateEvent}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-pink-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-pink-500/25 hover:bg-pink-600 transition-all active:scale-95"
            >
                <PlusCircle size={14} />
                Create your first event
            </button>
        </div>
    );
}

// ─── main component ───────────────────────────────────────────────────────────
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
    const [activeTab, setActiveTab] = useState("overview");

    const { hasAccess: canAccessAnalytics, promptUpgrade: promptUpgradeAnalytics } = useFeatureAccess("analytics");
    const { hasAccess: canAccessLiveStreaming, promptUpgrade: promptUpgradeLive } = useFeatureAccess("live_stream");

    const token = localStorage.getItem("token");
    const navigate = useNavigate();
    const user = useMemo(() => getCurrentUser(), []);
    const isAdminUser = useMemo(() => ADMIN_ROLES.includes(user?.role), [user]);
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
            .then(([eventsRes, statsRes, txRes, userRes, balancesRes, payoutsRes]) => {
                setEvents(eventsRes.data || []);
                setStats(statsRes.data || null);
                setTransactions(txRes.data || []);
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

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 60000); // refresh every 60s
        return () => clearInterval(interval);
    }, [fetchDashboardData]);

    const handleApproveVerification = async () => {
        if (!userVerification?._id) return;
        try {
            const { data } = await API.patch(`/admin/verifications/${userVerification._id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setUserVerification(data.verification || { ...userVerification, status: "approved", isVerified: true });
        } catch { setError("Failed to approve verification."); }
    };

    const handleRejectVerification = async () => {
        const reason = window.prompt("Enter rejection reason:");
        if (!reason || !userVerification?._id) return;
        try {
            const { data } = await API.patch(`/admin/verifications/${userVerification._id}/reject`, { reason }, { headers: { Authorization: `Bearer ${token}` } });
            setUserVerification(data.verification || { ...userVerification, status: "rejected", rejectionReason: reason });
        } catch { setError("Failed to reject verification."); }
    };

    const toggleLive = async (id, currentStatus) => {
        if (!canAccessLiveStreaming) { promptUpgradeLive(); return; }
        try {
            await API.patch("/events/toggle-live", { eventId: id, isLive: !currentStatus });
            setEvents((prev) => prev.map((ev) => ev._id === id ? { ...ev, liveStream: { ...ev.liveStream, isLive: !currentStatus } } : ev));
            if (!currentStatus) navigate(`/live/${id}`);
        } catch { setError("Failed to toggle live status"); }
    };

    const handleDelete = async (id) => {
        const ev = events.find((e) => e._id === id);
        if (!window.confirm(`Delete "${ev?.title}"? This cannot be undone.`)) return;
        try {
            await API.delete(`/events/delete/${id}`);
            setEvents((prev) => prev.filter((e) => e._id !== id));
        } catch { setError("Failed to delete event."); }
    };

    const handleDeleteDraft = async (id, title) => {
        if (!window.confirm(`Delete draft "${title || "Untitled draft"}"? This cannot be undone.`)) return;
        try {
            await API.delete(`/events/delete/${id}`);
            setEvents((prev) => prev.filter((e) => e._id !== id));
        } catch { setError("Failed to delete draft."); }
    };

    const payoutItems = payoutHistory?.items || payoutHistory?.history || payoutHistory?.payouts || [];
    const draftEvents = events.filter((e) => e.isDraft);
    const publishedEvents = events.filter((e) => !e.isDraft);
    const liveEvents = publishedEvents.filter((e) => e.liveStream?.isLive);
    const latestTx = transactions.slice(0, 5);

    const sparkData = stats?.ticketSalesSpark || Array.from({ length: 7 }, () => 0);

    const isAdminRole = (role) => ADMIN_ROLES.includes(role);

    // ── greeting ──────────────────────────────────────────────────────────────
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    const TABS = ["overview", "events", "finance"];


    return (
        <AppPage
            title="Dashboard"
            description={`${greeting}${user?.username ? `, ${user.username}` : ""}. Here's what's happening.`}
        >
            {/* ── Verification banner ── */}
            {VERIFIED_ROLES.includes(user?.role) && userVerification && (
                <div className="mb-5">
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

            {/* ── Dashboard header ── */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-black tracking-tight text-gray-900">
                        {greeting}{user?.username ? `, ${user.username}` : ""}
                    </h1>
                    <p className="mt-0.5 text-xs text-gray-400">
                        {new Date().toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchDashboardData}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-500 hover:border-pink-200 hover:text-pink-500 transition-colors"
                    >
                        <RefreshCw size={13} />
                        Refresh
                    </button>
                    <Link
                        to="/events"
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 hover:border-pink-200 hover:text-pink-600 transition-colors"
                    >
                        Browse events
                    </Link>
                    <button
                        onClick={() => openCreateEvent()}
                        className="inline-flex h-9 items-center gap-2 rounded-xl bg-pink-500 px-4 text-xs font-bold text-white shadow-md shadow-pink-500/25 hover:bg-pink-600 transition-all active:scale-95"
                    >
                        <PlusCircle size={14} />
                        Create event
                    </button>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="mb-6 flex gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1 w-fit">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`rounded-lg px-4 py-1.5 text-xs font-bold capitalize transition-all ${activeTab === tab
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-400 hover:text-gray-700"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {loading && <Skeleton />}

            {!loading && error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-5 mb-5">
                    <p className="text-sm font-bold text-red-700 mb-3">{error}</p>
                    <button onClick={() => window.location.reload()}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors">
                        <RefreshCw size={12} /> Try again
                    </button>
                </div>
            )}

            {!loading && !error && (
                <>
                    {/* ════════════════════════════════════════════════════
                        OVERVIEW TAB
                    ════════════════════════════════════════════════════ */}
                    {activeTab === "overview" && (
                        <div className="space-y-5">
                            {/* KPI row */}
                            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                <KpiCard
                                    icon={LayoutDashboard}
                                    label="Total events"
                                    value={stats?.totalEvents ?? 0}
                                    sub={`${publishedEvents.length} published`}
                                    color="blue"
                                    trend={stats?.eventsCreatedTrend ?? 0}
                                />
                                <KpiCard
                                    icon={Ticket}
                                    label="Tickets sold"
                                    value={fmtShort(stats?.totalTicketsSold)}
                                    sub="All time"
                                    color="pink"
                                    trend={stats?.ticketsSoldTrend ?? 0}
                                />
                                <KpiCard
                                    icon={BarChart3}
                                    label="Revenue"
                                    value={`₦${fmtShort(stats?.totalRevenue)}`}
                                    sub="Gross, all events"
                                    color="green"
                                    trend={stats?.revenueTrend ?? 0}
                                />
                                <KpiCard
                                    icon={Radio}
                                    label="Live now"
                                    value={liveEvents.length || stats?.currentlyLive || 0}
                                    sub={liveEvents.length > 0 ? "Events broadcasting" : "No active streams"}
                                    color="red"
                                />

                            </div>

                            {/* Chart + activity row */}
                            <div className="grid gap-4 lg:grid-cols-3">
                                {/* Sales chart */}
                                <div className="lg:col-span-2">
                                    <ChartCard
                                        title="Ticket sales"
                                        subtitle="Last 7 days"
                                        action={
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.6rem] font-bold ${stats?.ticketsSoldTrend >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                                                {stats?.ticketsSoldTrend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                {stats?.ticketsSoldTrend >= 0 ? "+" : ""}{stats?.ticketsSoldTrend ?? 0}%
                                            </span>
                                        }
                                    >
                                        <div className="mb-4 flex items-end justify-between gap-3">
                                            <div>
                                                <p className="text-3xl font-black text-gray-900 tabular-nums">
                                                    {fmt(stats?.totalTicketsSold || 0)}
                                                </p>
                                                <p className="mt-0.5 text-xs text-gray-400">tickets sold total</p>
                                            </div>
                                            {financeSummary && (
                                                <div className="text-right">
                                                    <p className="text-lg font-black text-gray-900 tabular-nums">
                                                        ₦{fmt(financeSummary.availableBalance || 0)}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-gray-400">available balance</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Bar chart */}
                                        <MiniBarChart data={sparkData} color="bg-pink-500" />

                                        {/* Finance quick stats */}
                                        {financeSummary && (
                                            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-50 pt-4">
                                                {[
                                                    { label: "Escrow", val: `₦${fmtShort(financeSummary.escrowBalance || 0)}` },
                                                    { label: "Pending release", val: `₦${fmtShort(financeSummary.pendingReleaseBalance || 0)}` },
                                                    { label: "Released", val: `₦${fmtShort(financeSummary.releasedRevenue || 0)}` },
                                                ].map(({ label, val }) => (
                                                    <div key={label} className="rounded-xl bg-gray-50 p-3">
                                                        <p className="text-[0.55rem] font-bold uppercase tracking-widest text-gray-400">{label}</p>
                                                        <p className="mt-1 text-sm font-black text-gray-900 tabular-nums">{val}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </ChartCard>
                                </div>

                                {/* Top events + quick actions */}
                                <div className="flex flex-col gap-4">
                                    {/* Live events card */}
                                    {liveEvents.length > 0 ? (
                                        <div className="rounded-2xl border border-red-100 bg-red-50/40 p-4">
                                            <div className="mb-3 flex items-center gap-2">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
                                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                                                </span>
                                                <p className="text-xs font-black text-red-700">{liveEvents.length} streaming now</p>
                                            </div>
                                            <div className="space-y-2">
                                                {liveEvents.slice(0, 2).map((ev) => (
                                                    <div key={ev._id} className="flex items-center justify-between gap-2 rounded-xl bg-white border border-red-100 px-3 py-2.5">
                                                        <p className="text-xs font-bold text-gray-900 truncate">{ev.title}</p>
                                                        <button
                                                            onClick={() => navigate(`/live/${ev._id}`)}
                                                            className="flex-shrink-0 flex items-center gap-1 rounded-lg bg-red-500 px-2 py-1 text-[0.6rem] font-bold text-white hover:bg-red-600 transition-colors"
                                                        >
                                                            <Play size={9} fill="white" /> View
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border border-gray-100 bg-white p-4">
                                            <p className="text-[0.58rem] font-black uppercase tracking-widest text-gray-400 mb-3">Quick actions</p>
                                            <div className="space-y-2">
                                                {[
                                                    { label: "Create an event", icon: PlusCircle, action: () => openCreateEvent(), color: "text-pink-500" },
                                                    { label: "Browse all events", icon: Eye, action: () => navigate("/events"), color: "text-blue-500" },
                                                    { label: "View transactions", icon: BarChart3, action: () => navigate("/transactions"), color: "text-emerald-600" },
                                                    { label: "Go to payouts", icon: Wallet, action: () => navigate("/dashboard/payouts"), color: "text-violet-500" },
                                                ].map(({ label, icon: Icon, action, color }) => (
                                                    <button key={label} onClick={action}
                                                        className="flex w-full items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs font-semibold text-gray-700 hover:border-pink-100 hover:bg-pink-50/30 transition-colors group">
                                                        <Icon size={14} className={`${color} flex-shrink-0`} />
                                                        {label}
                                                        <ArrowRight size={12} className="ml-auto text-gray-300 group-hover:text-pink-400 transition-colors" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Top performing event */}
                                    {stats?.topEvents?.filter((e) => !e.isDraft)?.[0] && (
                                        <div className="rounded-2xl border border-gray-100 bg-white p-4 flex-1">
                                            <p className="text-[0.58rem] font-black uppercase tracking-widest text-gray-400 mb-3">Top event</p>
                                            <div className="space-y-2">
                                                {stats.topEvents.filter((e) => !e.isDraft).slice(0, 3).map((ev, i) => (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-lg bg-pink-50 text-[0.6rem] font-black text-pink-500">
                                                            {i + 1}
                                                        </span>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-bold text-gray-900 truncate">{ev.title}</p>
                                                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                                                                <div
                                                                    className="h-full rounded-full bg-pink-400 transition-all duration-700"
                                                                    style={{ width: `${Math.min(100, ((ev.quantitySold || ev.ticketsSold || 0) / (stats.totalTicketsSold || 1)) * 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <span className="flex-shrink-0 text-[0.6rem] font-bold text-gray-400 tabular-nums">
                                                            {fmt(ev.quantitySold || ev.ticketsSold || 0)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payout restrictions */}
                            {financeSummary && !isAdminUser && (
                                (userVerification?.status !== "approved" || (fraudInfo?.flagCount || 0) > 0 || (financeSummary.escrowBalance || 0) > 0) && (
                                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h3 className="text-xs font-black text-amber-900">Payout restrictions active</h3>
                                                <div className="mt-1.5 space-y-1 text-xs text-amber-700">
                                                    {userVerification?.status !== "approved" && (
                                                        <p>Verification pending, withdrawals are blocked until your account is approved.</p>
                                                    )}
                                                    {(fraudInfo?.flagCount || 0) > 0 && (
                                                        <p>{fmt(fraudInfo.flagCount)} fraud alert(s) are holding payouts. Contact support.</p>
                                                    )}
                                                    {(financeSummary.escrowBalance || 0) > 0 && (
                                                        <p>₦{fmt(financeSummary.escrowBalance)} is in escrow pending post-event review.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}

                            {/* Fraud row */}
                            {fraudInfo && ((fraudInfo.flagCount || 0) > 0 || (fraudInfo.suspiciousTransactionsCount || 0) > 0) && (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    <KpiCard icon={AlertTriangle} label="Fraud alerts" value={fmt(fraudInfo.flagCount || 0)} sub="Active flags" color="red" />
                                    <KpiCard icon={ShieldAlert} label="Suspicious transactions" value={fmt(fraudInfo.suspiciousTransactionsCount || 0)} sub="Under review" color="pink" />
                                    <KpiCard icon={TrendingUp} label="Refund spike" value={`${Math.round((fraudInfo.refundSpike?.ratio || 0) * 100)}%`} sub="vs normal rate" color="red" />
                                    <KpiCard icon={Activity} label="Suspicious payouts" value={fmt(fraudInfo.suspiciousPayouts?.length || 0)} sub="Flagged transfers" color="violet" />
                                </div>
                            )}

                            {/* WhatsApp sharing */}
                            <WhatsAppSharingCenter events={events} currentUserId={user?.id} />

                            {/* Recent transactions */}
                            <ChartCard
                                title="Recent transactions"
                                subtitle="Your last 5 ticket sales"
                                action={
                                    <Link to="/transactions"
                                        className="inline-flex items-center gap-1 text-xs font-bold text-pink-500 hover:text-pink-600 transition-colors">
                                        View all <ChevronRight size={13} />
                                    </Link>
                                }
                            >
                                {latestTx.length === 0 ? (
                                    <p className="py-6 text-center text-xs text-gray-400">No transactions yet.</p>
                                ) : (
                                    <div className="space-y-1">
                                        {latestTx.map((tx) => (
                                            <div key={tx._id}
                                                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-gray-50/80 transition-colors">
                                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-500">
                                                    <Ticket size={13} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-bold text-gray-900 capitalize">{tx.type}</p>
                                                    <p className="text-[0.58rem] text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <p className="text-xs font-black text-gray-900 tabular-nums flex-shrink-0">
                                                    ₦{fmt(ticketNetToOrganizer(tx))}
                                                </p>
                                                <Badge tone={tx.status === "success" ? "green" : tx.status === "pending" ? "amber" : "red"}>
                                                    {tx.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ChartCard>

                            {/* Payout history */}
                            {payoutItems.length > 0 && (
                                <ChartCard
                                    title="Payout history"
                                    subtitle="Your 5 most recent payouts"
                                    action={
                                        <Link to="/dashboard/payouts"
                                            className="inline-flex items-center gap-1 text-xs font-bold text-pink-500 hover:text-pink-600 transition-colors">
                                            View all <ChevronRight size={13} />
                                        </Link>
                                    }
                                >
                                    <div className="space-y-1">
                                        {payoutItems.slice(0, 5).map((p) => (
                                            <div key={p._id || p.id}
                                                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-gray-50/80 transition-colors">
                                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                                    <Wallet size={13} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-bold text-gray-900 truncate">{p.event?.title || "Event Payout"}</p>
                                                    <p className="text-[0.58rem] text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <p className="text-xs font-black text-gray-900 tabular-nums flex-shrink-0">
                                                    ₦{fmt(p.netAmount || p.amount || 0)}
                                                </p>
                                                <Badge tone={payoutTone(p.state)}>
                                                    {p.state || p.status || "unknown"}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </ChartCard>
                            )}
                        </div>
                    )}

                    {/* ════════════════════════════════════════════════════
                        EVENTS TAB
                    ════════════════════════════════════════════════════ */}
                    {activeTab === "events" && (
                        <div className="space-y-6">
                            {/* Draft events */}
                            {draftEvents.length > 0 && (
                                <div>
                                    <div className="mb-4 flex items-center justify-between">
                                        <div>
                                            <SectionLabel>Saved drafts</SectionLabel>
                                            <h2 className="-mt-2 text-sm font-black text-gray-900">Continue where you left off</h2>
                                        </div>
                                        <button
                                            onClick={() => openCreateEvent({ resumeLatest: true })}
                                            className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-600 hover:border-pink-200 hover:text-pink-600 transition-colors"
                                        >
                                            Resume latest <ArrowRight size={12} />
                                        </button>
                                    </div>
                                    <div className="grid gap-3 lg:grid-cols-2">
                                        {draftEvents.map((event) => (
                                            <div key={event._id}
                                                className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-5">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-2.5 py-0.5 text-[0.58rem] font-black uppercase tracking-widest text-amber-700">
                                                            <FileClock size={11} /> Draft
                                                        </div>
                                                        <h3 className="text-sm font-black text-gray-900">{event.title || "Untitled draft"}</h3>
                                                        <p className="mt-1 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                                            {event.description || "Waiting for its final details."}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-shrink-0 gap-1.5">
                                                        <button
                                                            onClick={() => handleDeleteDraft(event._id, event.title)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-100 bg-white text-red-400 hover:bg-red-50 transition-colors">
                                                            <Trash2 size={13} />
                                                        </button>
                                                        <button
                                                            onClick={() => openCreateEvent({ draftEvent: event })}
                                                            className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-pink-500 px-3 text-xs font-bold text-white hover:bg-pink-600 transition-all active:scale-95">
                                                            Resume <ArrowRight size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="mt-4 grid grid-cols-3 gap-2">
                                                    {[
                                                        { label: "Last saved", value: new Date(event.draftUpdatedAt || event.createdAt).toLocaleDateString() },
                                                        { label: "Progress", value: `Step ${event.draftStep || 1} of 5` },
                                                        { label: "Format", value: event.eventType || "In-person" },
                                                    ].map(({ label, value }) => (
                                                        <div key={label} className="rounded-xl border border-amber-100 bg-white p-2.5">
                                                            <p className="text-[0.55rem] font-black uppercase tracking-widest text-gray-400">{label}</p>
                                                            <p className="mt-1 text-xs font-bold text-gray-900">{value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Published events */}
                            <div>
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <SectionLabel>Published events</SectionLabel>
                                        <h2 className="-mt-2 text-sm font-black text-gray-900">
                                            {publishedEvents.length} event{publishedEvents.length !== 1 ? "s" : ""} live
                                        </h2>
                                    </div>
                                    <button
                                        onClick={() => openCreateEvent()}
                                        className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-pink-500 px-3 text-xs font-bold text-white shadow-sm hover:bg-pink-600 transition-all active:scale-95">
                                        <PlusCircle size={12} /> New event
                                    </button>
                                </div>

                                {publishedEvents.length === 0 ? (
                                    <EmptyEvents onCreateEvent={() => openCreateEvent()} />
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {publishedEvents.map((event) => {
                                            const lc = LIFECYCLE_STYLES[event.eventLifecycleStatus] || LIFECYCLE_STYLES.Published;
                                            const cover = getEventImageUrl(event);
                                            return (
                                                <div key={event._id}
                                                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-pink-100">
                                                    {/* Status bar */}
                                                    <div className={`absolute inset-x-0 top-0 z-20 h-1 ${lc.bar}`} />

                                                    {/* Menu */}
                                                    <div className="absolute top-4 right-3 z-10">
                                                        <EventActionMenu
                                                            items={[
                                                                { key: "live", label: event.liveStream?.isLive ? "Stop Live" : "Go Live", icon: Radio, active: Boolean(event.liveStream?.isLive), onClick: () => canAccessLiveStreaming ? toggleLive(event._id, event.liveStream?.isLive) : promptUpgradeLive() },
                                                                { key: "edit", label: "Edit event", icon: Pencil, onClick: () => handleEditClick(event._id) },
                                                                { key: "tickets", label: "Manage tickets", icon: Ticket, to: `/events/${event._id}/tickets` },
                                                                canAccessAnalytics
                                                                    ? { key: "analytics", label: "Analytics", icon: BarChart3, to: `/events/${event._id}/analytics` }
                                                                    : { key: "analytics-upgrade", label: "Analytics", icon: BarChart3, onClick: promptUpgradeAnalytics },
                                                                { key: "team", label: "Manage team", icon: Users, onClick: () => handleTeamClick(event._id) },
                                                                { key: "duplicate", label: "Duplicate", icon: Copy, onClick: () => openCreateEvent({ duplicateEventId: event._id }) },
                                                                { key: "divider-delete", type: "divider" },
                                                                { key: "delete", label: "Delete event", icon: Trash2, danger: true, onClick: () => handleDelete(event._id) },
                                                            ]}
                                                        />
                                                    </div>

                                                    {/* Cover */}
                                                    <div className="relative h-36 overflow-hidden bg-gray-900">
                                                        {cover ? (
                                                            <img src={cover} alt={event.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                        ) : (
                                                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                                                <Calendar size={24} className="text-white/20" />
                                                            </div>
                                                        )}
                                                        {/* Live badge overlay */}
                                                        {event.liveStream?.isLive && (
                                                            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1 text-[0.58rem] font-black text-white">
                                                                <span className="h-1.5 w-1.5 animate-ping rounded-full bg-white" />
                                                                LIVE
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex flex-1 flex-col gap-2 p-4">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <h3 className="text-xs font-black text-gray-900 leading-snug line-clamp-2">{event.title}</h3>
                                                            <span className={`flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.55rem] font-black uppercase ${lc.bar} text-white`}>
                                                                <span className={`h-1 w-1 rounded-full ${lc.dot}`} />
                                                                {lc.label}
                                                            </span>
                                                        </div>

                                                        <div className="mt-auto space-y-1">
                                                            <div className="flex items-center gap-1.5 text-[0.62rem] text-gray-500">
                                                                <Calendar size={11} className="text-pink-400 flex-shrink-0" />
                                                                {new Date(event.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {event.startTime}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[0.62rem] text-gray-500">
                                                                <MapPin size={11} className="text-pink-400 flex-shrink-0" />
                                                                <span className="truncate">{event.location}</span>
                                                            </div>
                                                        </div>

                                                        {/* Ticket progress bar */}
                                                        <div className="mt-2">
                                                            <div className="mb-1 flex items-center justify-between text-[0.58rem] text-gray-400">
                                                                <span>{fmt(event.ticketsSold || 0)} sold</span>
                                                                <span>{fmt(event.totalTickets || 0)} total</span>
                                                            </div>
                                                            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                                                                <div
                                                                    className="h-full rounded-full bg-pink-400 transition-all duration-700"
                                                                    style={{ width: `${Math.min(100, ((event.ticketsSold || 0) / (event.totalTickets || 1)) * 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ════════════════════════════════════════════════════
                        FINANCE TAB
                    ════════════════════════════════════════════════════ */}
                    {activeTab === "finance" && (
                        <div className="space-y-5">
                            {/* Finance KPIs */}
                            {financeSummary ? (
                                <>
                                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                                        <KpiCard icon={Wallet} label="Available" value={`₦${fmtShort(financeSummary.availableBalance || 0)}`} sub="Ready to withdraw" color="green" />
                                        <KpiCard icon={Clock} label="Escrow" value={`₦${fmtShort(financeSummary.escrowBalance || 0)}`} sub="Post-event release" color="blue" />
                                        <KpiCard icon={FileClock} label="Pending release" value={`₦${fmtShort(financeSummary.pendingReleaseBalance || 0)}`} sub="In review" color="pink" />
                                        <KpiCard icon={BarChart3} label="Released revenue" value={`₦${fmtShort(financeSummary.releasedRevenue || 0)}`} sub="Paid out total" color="green" />
                                        <KpiCard icon={Wallet} label="Refunded" value={`₦${fmtShort(financeSummary.refundedRevenue || 0)}`} sub="Returned to buyers" color="red" />
                                    </div>

                                    {/* Payout list */}
                                    <ChartCard
                                        title="Payout history"
                                        subtitle="All organizer payouts"
                                        action={
                                            <Link to="/dashboard/payouts"
                                                className="inline-flex items-center gap-1 rounded-xl border border-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600 hover:border-pink-200 hover:text-pink-600 transition-colors">
                                                View all <ChevronRight size={12} />
                                            </Link>
                                        }
                                    >
                                        {payoutItems.length === 0 ? (
                                            <div className="py-10 text-center">
                                                <Wallet size={28} className="mx-auto text-gray-200 mb-3" />
                                                <p className="text-xs text-gray-400">No payouts yet. Payouts are released after events close.</p>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-50">
                                                    <thead>
                                                        <tr>
                                                            {["Event", "Date", "Amount", "Status"].map((h) => (
                                                                <th key={h} className="pb-3 text-left text-[0.58rem] font-black uppercase tracking-widest text-gray-400">{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {payoutItems.map((p) => (
                                                            <tr key={p._id || p.id} className="hover:bg-gray-50/60 transition-colors">
                                                                <td className="py-3 pr-4 text-xs font-bold text-gray-900 truncate max-w-[140px]">{p.event?.title || "Event Payout"}</td>
                                                                <td className="py-3 pr-4 text-xs text-gray-400 whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString()}</td>
                                                                <td className="py-3 pr-4 text-xs font-black text-gray-900 tabular-nums whitespace-nowrap">₦{fmt(p.netAmount || p.amount || 0)}</td>
                                                                <td className="py-3">
                                                                    <Badge tone={payoutTone(p.state)}>{p.state || p.status || "unknown"}</Badge>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </ChartCard>

                                    {/* Transactions */}
                                    <ChartCard
                                        title="Ticket transactions"
                                        subtitle="Revenue from ticket sales"
                                        action={
                                            <Link to="/transactions"
                                                className="inline-flex items-center gap-1 rounded-xl border border-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600 hover:border-pink-200 hover:text-pink-600 transition-colors">
                                                View all <ChevronRight size={12} />
                                            </Link>
                                        }
                                    >
                                        {transactions.length === 0 ? (
                                            <p className="py-6 text-center text-xs text-gray-400">No transactions yet.</p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-50">
                                                    <thead>
                                                        <tr>
                                                            {["Type", "Date", "Net amount", "Status"].map((h) => (
                                                                <th key={h} className="pb-3 text-left text-[0.58rem] font-black uppercase tracking-widest text-gray-400">{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {transactions.map((tx) => (
                                                            <tr key={tx._id} className="hover:bg-gray-50/60 transition-colors">
                                                                <td className="py-3 pr-4 text-xs font-bold text-gray-900 capitalize">{tx.type}</td>
                                                                <td className="py-3 pr-4 text-xs text-gray-400 whitespace-nowrap">{new Date(tx.createdAt).toLocaleDateString()}</td>
                                                                <td className="py-3 pr-4 text-xs font-black text-gray-900 tabular-nums whitespace-nowrap">₦{fmt(ticketNetToOrganizer(tx))}</td>
                                                                <td className="py-3">
                                                                    <Badge tone={tx.status === "success" ? "green" : tx.status === "pending" ? "amber" : "red"}>{tx.status}</Badge>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </ChartCard>
                                </>
                            ) : (
                                <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
                                    <Wallet size={28} className="mx-auto text-gray-200 mb-3" />
                                    <p className="text-sm font-bold text-gray-700">No financial data available</p>
                                    <p className="mt-1 text-xs text-gray-400">Sell your first ticket to see revenue and payout data here.</p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            <EditEvent isOpen={editModalOpen} onClose={handleModalClose} eventId={selectedEventId} onEventUpdated={fetchDashboardData} />
            <TeamManagement eventId={selectedTeamEventId} isOpen={teamModalOpen} onClose={handleTeamModalClose} />
        </AppPage>
    );
}