import { useEffect, useState } from "react";
import { Download, FileText, Search, Ticket, Wallet } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import {
    EmptyState,
    ErrorMessage,
    LoadingSpinner,
    PaginationControls,
    StatCard,
    StatusBadge,
    SurfaceCard,
} from "../components/AdminComponents";
import adminService from "../services/adminService";
import { formatCurrency, formatDateTime, formatNumber, getStatusTone } from "../utils/adminUtils";
import { useToast } from "../components/ui/toast";

export default function AdminTransactions() {
    const toast = useToast();
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    // Build filters from current state — used by both useEffect and manual triggers
    const buildFilters = () => ({
        ...(search    ? { search }    : {}),
        ...(status    ? { status }    : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate   ? { endDate }   : {}),
    });

    const fetchTransactions = async (filters = buildFilters(), nextPage = page) => {
        try {
            setLoading(true);
            setError(null);
            const data = await adminService.getTransactions(nextPage, 20, filters);
            setTransactions(data.transactions || []);
            setSummary(data.summary || null);
            setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
        } catch (err) {
            setError(err.response?.data?.message || "Unable to load transaction history.");
        } finally {
            setLoading(false);
        }
    };

    // Re-fetch when page or filter dropdowns / date pickers change
    useEffect(() => {
        fetchTransactions(buildFilters(), page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, status, startDate, endDate]);

    const applySearch = () => {
        setPage(1);
        fetchTransactions(buildFilters(), 1);
    };

    const exportTransactions = async () => {
        try {
            const blob = await adminService.exportTransactions(buildFilters());
            const url  = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href     = url;
            link.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
            toast.success("Transaction export started.");
        } catch {
            setError("Failed to export transactions.");
        }
    };

    // ── shared input classes ──────────────────────────────────────────────────
    const inputCls =
        "w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100";

    return (
        <AdminLayout
            title="Transaction Management"
            description="Track ticket purchases, filter payment history, and export revenue activity."
        >
            <div className="space-y-5">
                {/* Search bar + Export */}
                <div className="flex flex-wrap gap-3 items-center">
                    <SurfaceCard className="flex-1 min-w-0 p-3">
                        <div className="flex items-center gap-2">
                            <Search size={15} className="text-pink-500 flex-shrink-0" />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") applySearch(); }}
                                placeholder="Search by reference, buyer, or event"
                                className="min-w-0 flex-1 bg-transparent text-xs text-gray-800 outline-none placeholder:text-gray-400"
                            />
                            <button
                                type="button"
                                onClick={applySearch}
                                className="rounded-lg bg-pink-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-pink-600 transition-colors active:scale-95"
                            >
                                Search
                            </button>
                        </div>
                    </SurfaceCard>

                    <button
                        type="button"
                        onClick={exportTransactions}
                        className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-gray-800 transition-colors active:scale-95"
                    >
                        <Download size={14} />
                        Export CSV
                    </button>
                </div>

                {/* Stat cards */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard icon={FileText} label="Transactions" value={formatNumber(summary?.totalTransactions  || 0)} detail="Filtered results"        />
                    <StatCard icon={Wallet}   label="Revenue"      value={formatCurrency(summary?.totalRevenue      || 0)} detail="Paid transactions only"  />
                    <StatCard icon={Ticket}   label="Paid"         value={formatNumber(summary?.paidTransactions    || 0)} detail="Successful purchases"    />
                    <StatCard icon={Ticket}   label="Free"         value={formatNumber(summary?.freeTransactions    || 0)} detail="Zero-cost tickets"       />
                </div>

                {/* Filters row */}
                <div className="grid gap-4 md:grid-cols-4">
                    <SurfaceCard>
                        <p className="mb-2 text-[0.6rem] font-bold uppercase tracking-widest text-pink-400">Status</p>
                        <select
                            value={status}
                            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                            className={inputCls}
                        >
                            <option value="">All statuses</option>
                            <option value="success">Success</option>
                            <option value="free">Free</option>
                        </select>
                    </SurfaceCard>

                    <SurfaceCard>
                        <p className="mb-2 text-[0.6rem] font-bold uppercase tracking-widest text-pink-400">Start date</p>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                            className={inputCls}
                        />
                    </SurfaceCard>

                    <SurfaceCard>
                        <p className="mb-2 text-[0.6rem] font-bold uppercase tracking-widest text-pink-400">End date</p>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                            className={inputCls}
                        />
                    </SurfaceCard>

                    <SurfaceCard>
                        <p className="mb-2 text-[0.6rem] font-bold uppercase tracking-widest text-pink-400">Page info</p>
                        <p className="text-2xl font-extrabold text-gray-900">{pagination.page || 1}</p>
                        <p className="mt-1 text-xs text-gray-400">
                            {formatNumber(pagination.total || 0)} total records
                        </p>
                    </SurfaceCard>
                </div>

                {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

                {loading ? (
                    <LoadingSpinner label="Loading transactions..." />
                ) : transactions.length === 0 ? (
                    <EmptyState
                        icon={FileText}
                        title="No transactions found"
                        description="Try widening your filters or search for a different buyer, event, or reference."
                    />
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-gray-100 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    {["Reference", "Buyer", "Event", "Qty", "Amount", "Status", "Purchased"].map((col) => (
                                        <th
                                            key={col}
                                            className="px-4 py-3 text-left text-[0.6rem] font-bold uppercase tracking-widest text-gray-400"
                                        >
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {transactions.map((tx) => (
                                    <tr key={tx._id} className="transition-colors hover:bg-pink-50/40">
                                        <td className="px-4 py-3.5">
                                            <span className="text-xs font-semibold text-gray-900 tabular-nums">
                                                {tx.reference || "N/A"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <p className="text-xs font-semibold text-gray-900">
                                                {tx.buyer?.name || tx.buyer?.username || "Unknown"}
                                            </p>
                                            <p className="mt-0.5 text-[0.6rem] text-gray-400">{tx.buyer?.email || "No email"}</p>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <p className="text-xs text-gray-800">{tx.event?.title    || "Unknown event"}</p>
                                            <p className="mt-0.5 text-[0.6rem] text-gray-400">{tx.event?.category || "No category"}</p>
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-gray-700 tabular-nums">
                                            {formatNumber(tx.quantity || 0)}
                                        </td>
                                        <td className="px-4 py-3.5 text-xs font-bold text-gray-900 tabular-nums">
                                            {formatCurrency(tx.amount || 0)}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <StatusBadge tone={getStatusTone(tx.paymentStatusLabel)}>
                                                {tx.paymentStatusLabel || "unknown"}
                                            </StatusBadge>
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-gray-400">
                                            {formatDateTime(tx.purchasedAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <PaginationControls
                    page={pagination.page || page}
                    pages={pagination.pages || 1}
                    total={pagination.total}
                    label="transactions"
                    onPrevious={() => setPage((c) => Math.max(1, c - 1))}
                    onNext={() => setPage((c) => Math.min(pagination.pages || 1, c + 1))}
                />
            </div>
        </AdminLayout>
    );
}