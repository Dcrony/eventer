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

    useEffect(() => {
        fetchTransactions();
    }, [page, status, startDate, endDate]);

    const currentFilters = {
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
    };

    const fetchTransactions = async (overrideFilters = currentFilters, nextPage = page) => {
        try {
            setLoading(true);
            setError(null);
            const data = await adminService.getTransactions(nextPage, 20, overrideFilters);
            setTransactions(data.transactions || []);
            setSummary(data.summary || null);
            setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
        } catch (err) {
            setError(err.response?.data?.message || "Unable to load transaction history.");
        } finally {
            setLoading(false);
        }
    };

    const applySearch = () => {
        setPage(1);
        fetchTransactions(currentFilters, 1);
    };

    const exportTransactions = async () => {
        try {
            const blob = await adminService.exportTransactions(currentFilters);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
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

    return (
        <AdminLayout title="Transaction Management" description="Track ticket purchases, filter payment history, and export revenue activity.">
            <div className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-[1.5fr_auto]">
                    <SurfaceCard>
                        <div className="flex flex-wrap items-center gap-3">
                            <Search className="text-pink-500" />
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") applySearch();
                                }}
                                placeholder="Search by reference, buyer, or event"
                                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                            />
                            <button
                                type="button"
                                onClick={applySearch}
                                className="rounded-2xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-pink-700"
                            >
                                Search
                            </button>
                        </div>
                    </SurfaceCard>
                    <button
                        type="button"
                        onClick={exportTransactions}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                    >
                        <Download size={18} />
                        Export CSV
                    </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        icon={FileText}
                        label="Transactions"
                        value={formatNumber(summary?.totalTransactions || 0)}
                        detail="Filtered results"
                    />
                    <StatCard
                        icon={Wallet}
                        label="Revenue"
                        value={formatCurrency(summary?.totalRevenue || 0)}
                        detail="Paid transactions only"
                    />
                    <StatCard
                        icon={Ticket}
                        label="Paid"
                        value={formatNumber(summary?.paidTransactions || 0)}
                        detail="Successful purchases"
                    />
                    <StatCard
                        icon={Ticket}
                        label="Free"
                        value={formatNumber(summary?.freeTransactions || 0)}
                        detail="Zero-cost tickets"
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <SurfaceCard>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Status</p>
                        <select
                            value={status}
                            onChange={(event) => {
                                setStatus(event.target.value);
                                setPage(1);
                            }}
                            className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                        >
                            <option value="">All statuses</option>
                            <option value="success">Success</option>
                            <option value="free">Free</option>
                        </select>
                    </SurfaceCard>
                    <SurfaceCard>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Start date</p>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(event) => {
                                setStartDate(event.target.value);
                                setPage(1);
                            }}
                            className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                        />
                    </SurfaceCard>
                    <SurfaceCard>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">End date</p>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(event) => {
                                setEndDate(event.target.value);
                                setPage(1);
                            }}
                            className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                        />
                    </SurfaceCard>
                    <SurfaceCard>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Current page</p>
                        <p className="mt-4 text-3xl font-bold text-slate-950">{pagination.page || 1}</p>
                        <p className="mt-2 text-sm text-slate-500">Total records: {formatNumber(pagination.total || 0)}</p>
                    </SurfaceCard>
                </div>

                {error ? <ErrorMessage message={error} onDismiss={() => setError(null)} /> : null}

                {loading ? (
                    <LoadingSpinner label="Loading transactions..." />
                ) : transactions.length === 0 ? (
                    <EmptyState
                        icon={FileText}
                        title="No transactions found"
                        description="Try widening your filters or search for a different buyer, event, or reference."
                    />
                ) : (
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 text-left font-semibold">Reference</th>
                                    <th className="px-6 py-4 text-left font-semibold">Buyer</th>
                                    <th className="px-6 py-4 text-left font-semibold">Event</th>
                                    <th className="px-6 py-4 text-left font-semibold">Qty</th>
                                    <th className="px-6 py-4 text-left font-semibold">Amount</th>
                                    <th className="px-6 py-4 text-left font-semibold">Status</th>
                                    <th className="px-6 py-4 text-left font-semibold">Purchased</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {transactions.map((transaction) => (
                                    <tr key={transaction._id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-950">{transaction.reference || "N/A"}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-900">
                                                {transaction.buyer?.name || transaction.buyer?.username || "Unknown"}
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">{transaction.buyer?.email || "No email"}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-900">{transaction.event?.title || "Unknown event"}</div>
                                            <div className="mt-1 text-xs text-slate-500">{transaction.event?.category || "No category"}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">{formatNumber(transaction.quantity || 0)}</td>
                                        <td className="px-6 py-4 font-semibold text-slate-900">{formatCurrency(transaction.amount || 0)}</td>
                                        <td className="px-6 py-4">
                                            <StatusBadge tone={getStatusTone(transaction.paymentStatusLabel)}>
                                                {transaction.paymentStatusLabel || "unknown"}
                                            </StatusBadge>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{formatDateTime(transaction.purchasedAt)}</td>
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
                    onPrevious={() => setPage((current) => Math.max(1, current - 1))}
                    onNext={() => setPage((current) => Math.min(pagination.pages || 1, current + 1))}
                />
            </div>
        </AdminLayout>
    );
}
