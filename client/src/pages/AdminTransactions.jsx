// AdminTransactions.jsx
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

    const buildFilters = () => ({
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
    });

    useEffect(() => { fetchTransactions(); }, [page, status, startDate, endDate]);

    const fetchTransactions = async (overrideFilters, nextPage = page) => {
        const filters = overrideFilters ?? buildFilters();
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

    const applySearch = () => { setPage(1); fetchTransactions(buildFilters(), 1); };

    const exportTransactions = async () => {
        try {
            const blob = await adminService.exportTransactions(buildFilters());
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
            <div className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="flex flex-1 items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm focus-within:border-pink-300 focus-within:ring-2 focus-within:ring-pink-50 transition-all">
                        <Search size={15} className="text-pink-400 flex-shrink-0" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") applySearch(); }}
                            placeholder="Search by reference, buyer, or event"
                            className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-300"
                        />
                        <button
                            type="button"
                            onClick={applySearch}
                            className="rounded-xl bg-pink-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-pink-600 transition-colors"
                        >
                            Search
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={exportTransactions}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white px-5 py-3 text-xs font-bold text-gray-700 shadow-sm hover:border-pink-300 hover:text-pink-600 transition-all"
                    >
                        <Download size={15} />
                        Export CSV
                    </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard icon={FileText} label="Transactions" value={formatNumber(summary?.totalTransactions || 0)} detail="Filtered results" />
                    <StatCard icon={Wallet}   label="Revenue"      value={formatCurrency(summary?.totalRevenue || 0)}    detail="Paid transactions only" />
                    <StatCard icon={Ticket}   label="Paid"         value={formatNumber(summary?.paidTransactions || 0)}  detail="Successful purchases" />
                    <StatCard icon={Ticket}   label="Free"         value={formatNumber(summary?.freeTransactions || 0)}  detail="Zero-cost tickets" />
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <SurfaceCard>
                        <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">Status</p>
                        <select
                            value={status}
                            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                            className="mt-3 w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs font-medium text-gray-700 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-50"
                        >
                            <option value="">All statuses</option>
                            <option value="success">Success</option>
                            <option value="free">Free</option>
                        </select>
                    </SurfaceCard>
                    <SurfaceCard>
                        <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">Start Date</p>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                            className="mt-3 w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs text-gray-700 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-50"
                        />
                    </SurfaceCard>
                    <SurfaceCard>
                        <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">End Date</p>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                            className="mt-3 w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs text-gray-700 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-50"
                        />
                    </SurfaceCard>
                    <SurfaceCard>
                        <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">Current Page</p>
                        <p className="mt-3 text-2xl font-black text-gray-900 tabular-nums">{pagination.page || 1}</p>
                        <p className="mt-1 text-xs text-gray-400">{formatNumber(pagination.total || 0)} total records</p>
                    </SurfaceCard>
                </div>

                {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

                {loading ? (
                    <LoadingSpinner label="Loading transactions..." />
                ) : transactions.length === 0 ? (
                    <EmptyState icon={FileText} title="No transactions found" description="Try widening your filters or search for a different buyer, event, or reference." />
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-50 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {["Reference", "Buyer", "Event", "Qty", "Amount", "Status", "Purchased"].map((col) => (
                                            <th key={col} className="px-4 py-3.5 text-left text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">{col}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 bg-white">
                                    {transactions.map((tx) => (
                                        <tr key={tx._id} className="hover:bg-pink-50/20 transition-colors">
                                            <td className="px-4 py-3.5 text-xs font-bold text-gray-900">{tx.reference || "N/A"}</td>
                                            <td className="px-4 py-3.5">
                                                <div className="text-xs font-semibold text-gray-800">{tx.buyer?.name || tx.buyer?.username || "Unknown"}</div>
                                                <div className="mt-0.5 text-[0.58rem] text-gray-400">{tx.buyer?.email || "No email"}</div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="text-xs font-semibold text-gray-800">{tx.event?.title || "Unknown event"}</div>
                                                <div className="mt-0.5 text-[0.58rem] text-gray-400">{tx.event?.category || "No category"}</div>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs font-semibold text-gray-700 tabular-nums">{formatNumber(tx.quantity || 0)}</td>
                                            <td className="px-4 py-3.5 text-xs font-black text-gray-900 tabular-nums">{formatCurrency(tx.amount || 0)}</td>
                                            <td className="px-4 py-3.5">
                                                <StatusBadge tone={getStatusTone(tx.paymentStatusLabel)}>{tx.paymentStatusLabel || "unknown"}</StatusBadge>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-gray-400">{formatDateTime(tx.purchasedAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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