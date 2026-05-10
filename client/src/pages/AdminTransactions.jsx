import { useEffect, useState } from "react";
import { Search, Download, FileText, DollarSign, Calendar, User } from "lucide-react";
import adminService from "../services/adminService";
import AdminLayout from "../components/AdminLayout";
import { LoadingSpinner, ErrorMessage } from "../components/AdminComponents";
import { formatCurrency, formatDate, formatNumber } from "../utils/adminUtils";

export default function AdminTransactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ pages: 1 });

    useEffect(() => {
        fetchTransactions();
    }, [search, status, startDate, endDate, page]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            setError(null);
            const filters = {};
            if (search) filters.search = search;
            if (status) filters.status = status;
            if (startDate) filters.startDate = startDate;
            if (endDate) filters.endDate = endDate;
            const data = await adminService.getTransactions(page, 20, filters);
            setTransactions(data.transactions || []);
            setPagination(data.pagination || { pages: 1 });
        } catch (err) {
            console.error("Failed to load transactions", err);
            setError(err.response?.data?.message || "Unable to load transaction history.");
        } finally {
            setLoading(false);
        }
    };

    const exportTransactions = async () => {
        try {
            const filters = {};
            if (search) filters.search = search;
            if (status) filters.status = status;
            if (startDate) filters.startDate = startDate;
            if (endDate) filters.endDate = endDate;
            const blob = await adminService.exportTransactions(filters);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            setError("Failed to export transactions.");
        }
    };

    return (
        <AdminLayout title="Transaction Management" description="Monitor payments, refunds, and revenue across TickiSpot.">
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-center gap-3">
                            <Search className="text-pink-500" />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by reference, buyer, or event"
                                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={exportTransactions}
                        className="inline-flex items-center gap-2 rounded-2xl bg-pink-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-700"
                    >
                        <Download size={18} />
                        Export CSV
                    </button>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold text-slate-400 uppercase tracking-[0.2em]">Status</p>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                        >
                            <option value="">All statuses</option>
                            <option value="success">Success</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold text-slate-400 uppercase tracking-[0.2em]">Start date</p>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                        />
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold text-slate-400 uppercase tracking-[0.2em]">End date</p>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                        />
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold text-slate-400 uppercase tracking-[0.2em]">Total transactions</p>
                        <p className="mt-4 text-3xl font-bold text-slate-950">{formatNumber(transactions.length)}</p>
                        <p className="mt-2 text-sm text-slate-500">Page {page} of {pagination.pages}</p>
                    </div>
                </div>

                {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

                {loading ? (
                    <LoadingSpinner />
                ) : transactions.length === 0 ? (
                    <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="text-center">
                            <FileText className="mx-auto h-12 w-12 text-slate-400" />
                            <h3 className="mt-4 text-sm font-semibold text-slate-900">No transactions found</h3>
                            <p className="mt-2 text-sm text-slate-500">Adjust filters to see transaction history.</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 text-left font-semibold">Reference</th>
                                    <th className="px-6 py-4 text-left font-semibold">Buyer</th>
                                    <th className="px-6 py-4 text-left font-semibold">Event</th>
                                    <th className="px-6 py-4 text-left font-semibold">Amount</th>
                                    <th className="px-6 py-4 text-left font-semibold">Status</th>
                                    <th className="px-6 py-4 text-left font-semibold">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {transactions.map((transaction) => (
                                    <tr key={transaction._id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-slate-950">{transaction.reference || "N/A"}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-900">{transaction.buyer?.name || "Unknown"}</div>
                                            <div className="mt-1 text-xs text-slate-500">{transaction.buyer?.email || "No email"}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-900">{transaction.event?.title || "Unknown Event"}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-900 font-semibold">{formatCurrency(transaction.amount)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${transaction.paymentStatus === "success"
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : transaction.paymentStatus === "pending"
                                                        ? "bg-amber-100 text-amber-700"
                                                        : "bg-rose-100 text-rose-700"
                                                }`}>
                                                {transaction.paymentStatus || "unknown"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{formatDate(transaction.purchasedAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-slate-500">Page {page} of {pagination.pages}</p>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page <= 1}
                            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            onClick={() => setPage(Math.min(pagination.pages || 1, page + 1))}
                            disabled={page >= pagination.pages}
                            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}