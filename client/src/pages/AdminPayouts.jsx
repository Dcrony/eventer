import { useEffect, useState } from "react";
import {
    CheckCircle2,
    Clock,
    DollarSign,
    RefreshCcw,
    Search,
    Snowflake,
    Undo2,
    Wallet,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import {
    EmptyState,
    ErrorMessage,
    LoadingSpinner,
    PaginationControls,
    StatCard,
    StatusBadge,
    SurfaceCard,
    TableHead,
    TableWrapper,
} from "../components/AdminComponents";
import { listPayouts, adminAction } from "../services/api/payouts";
import { formatCurrency, formatDateTime } from "../utils/adminUtils";
import { useToast } from "../components/ui/toast";

const STATE_CONFIG = {
    pending:      { tone: "amber",   label: "Pending" },
    under_review: { tone: "blue",    label: "Under Review" },
    scheduled:    { tone: "purple",  label: "Scheduled" },
    released:     { tone: "green",   label: "Released" },
    frozen:       { tone: "gray",    label: "Frozen" },
    refunded:     { tone: "red",     label: "Refunded" },
    completed:    { tone: "emerald", label: "Completed" },
};

export default function AdminPayouts() {
    const toast = useToast();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [stateFilter, setStateFilter] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [summary, setSummary] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchPayouts = async () => {
        try {
            setLoading(true);
            setError(null);
            const filters = {};
            if (stateFilter) filters.state = stateFilter;
            if (search) filters.search = search;
            const res = await listPayouts({ page, limit: 25, ...filters });
            setItems(res.items || []);
            setPagination(res.pagination || { page: 1, pages: 1, total: 0 });
            setSummary(res.summary || null);
        } catch (e) {
            setError(e.response?.data?.message || "Failed to load payouts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPayouts(); }, [page, stateFilter]);

    const handleAction = async (id, action) => {
        try {
            setActionLoading(id + action);
            await adminAction(id, action, `${action} by admin`);
            toast.success(`Payout ${action} successful.`);
            fetchPayouts();
        } catch (e) {
            toast.error(e.response?.data?.message || "Action failed");
        } finally {
            setActionLoading(null);
        }
    };

    const applySearch = () => { setPage(1); fetchPayouts(); };

    const pendingCount  = items.filter((p) => ["pending", "under_review", "scheduled"].includes(p.state)).length;
    const releasedCount = items.filter((p) => p.state === "released" || p.state === "completed").length;

    return (
        <AdminLayout
            title="Payout Management"
            description="Review escrow balances, release organizer payouts, and manage fund holds."
        >
            <div className="space-y-5">
                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard icon={Clock}        label="Pending Payouts" value={pendingCount}                              detail="Awaiting admin action"  accent />
                    <StatCard icon={CheckCircle2} label="Released"        value={releasedCount}                             detail="Paid out successfully" />
                    <StatCard icon={Wallet}       label="Total Volume"    value={formatCurrency(summary?.totalVolume || 0)} detail="Across all payouts" />
                    <StatCard icon={DollarSign}   label="Net Amount"      value={formatCurrency(summary?.netAmount   || 0)} detail="After platform fees" />
                </div>

                {/* Search + Filter */}
                <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                    <SurfaceCard className="p-3">
                        <div className="flex items-center gap-2">
                            <Search size={15} className="text-pink-500 flex-shrink-0" />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") applySearch(); }}
                                placeholder="Search organizer name or email"
                                className="min-w-0 flex-1 bg-transparent text-xs text-gray-800 outline-none placeholder:text-gray-400"
                            />
                        </div>
                    </SurfaceCard>

                    <SurfaceCard className="p-3">
                        <select
                            value={stateFilter}
                            onChange={(e) => { setStateFilter(e.target.value); setPage(1); }}
                            className="w-full bg-transparent text-xs font-medium text-gray-700 outline-none"
                        >
                            <option value="">All states</option>
                            {Object.entries(STATE_CONFIG).map(([key, { label }]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </SurfaceCard>

                    <button
                        type="button"
                        onClick={() => { setPage(1); fetchPayouts(); }}
                        className="inline-flex items-center gap-2 rounded-xl bg-pink-500 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-pink-600 active:scale-95"
                    >
                        <RefreshCcw size={13} />
                        Refresh
                    </button>
                </div>

                {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

                {loading ? (
                    <LoadingSpinner label="Loading payouts..." />
                ) : items.length === 0 ? (
                    <EmptyState icon={Wallet} title="No payouts found" description="No payout records match the current filters." />
                ) : (
                    <TableWrapper>
                        <TableHead columns={["Organizer", "Net Amount", "Gross", "Fee", "State", "Created", "Actions"]} />
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {items.map((payout) => {
                                const cfg     = STATE_CONFIG[payout.state] || { tone: "gray", label: payout.state };
                                const isActing = actionLoading?.startsWith(payout._id);
                                return (
                                    <tr key={payout._id} className="group transition-colors hover:bg-pink-50/40">
                                        <td className="px-4 py-3.5">
                                            <p className="text-xs font-semibold text-gray-900">
                                                {payout.organizer?.name || payout.organizer?.username || "Unknown"}
                                            </p>
                                            <p className="mt-0.5 text-[0.6rem] text-gray-400">{payout.organizer?.email}</p>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="text-xs font-bold text-gray-900 tabular-nums">
                                                {formatCurrency(payout.netAmount || 0)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-gray-500 tabular-nums">{formatCurrency(payout.grossAmount  || 0)}</td>
                                        <td className="px-4 py-3.5 text-xs text-gray-500 tabular-nums">{formatCurrency(payout.platformFee  || 0)}</td>
                                        <td className="px-4 py-3.5"><StatusBadge tone={cfg.tone}>{cfg.label}</StatusBadge></td>
                                        <td className="px-4 py-3.5 text-xs text-gray-400">{formatDateTime(payout.createdAt)}</td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {["pending", "under_review", "scheduled"].includes(payout.state) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAction(payout._id, "release")}
                                                        disabled={isActing}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[0.65rem] font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50 active:scale-95"
                                                    >
                                                        <CheckCircle2 size={11} /> Release
                                                    </button>
                                                )}
                                                {payout.state !== "frozen" && payout.state !== "refunded" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAction(payout._id, "freeze")}
                                                        disabled={isActing}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-slate-500 px-2.5 py-1.5 text-[0.65rem] font-semibold text-white transition-colors hover:bg-slate-600 disabled:opacity-50 active:scale-95"
                                                    >
                                                        <Snowflake size={11} /> Freeze
                                                    </button>
                                                )}
                                                {payout.state !== "refunded" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAction(payout._id, "refund")}
                                                        disabled={isActing}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-2.5 py-1.5 text-[0.65rem] font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50 active:scale-95"
                                                    >
                                                        <Undo2 size={11} /> Refund
                                                    </button>
                                                )}
                                                {isActing && (
                                                    <span className="text-[0.6rem] text-pink-400 animate-pulse font-medium">Working…</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </TableWrapper>
                )}

                <PaginationControls
                    page={pagination.page || page}
                    pages={pagination.pages || 1}
                    total={pagination.total}
                    label="payouts"
                    onPrevious={() => setPage((c) => Math.max(1, c - 1))}
                    onNext={() => setPage((c) => Math.min(pagination.pages || 1, c + 1))}
                />
            </div>
        </AdminLayout>
    );
}