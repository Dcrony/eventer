import { useEffect, useState } from "react";
import API from "../api/axios";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Search,
  ArrowUpDown,
  Receipt,
  Copy,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeft,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ticketNetToOrganizer } from "../utils/transactions";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const token = localStorage.getItem("token");
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const res = await API.get("/organizer/transactions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTransactions(res.data);
      } catch (error) {
        // Failed to fetch transactions - will show empty state
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [token]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, typeFilter, searchTerm]);

  const successfulTicketNet = transactions.reduce((sum, tx) => {
    if (tx.status !== "success" || tx.type !== "ticket") return sum;
    return sum + ticketNetToOrganizer(tx);
  }, 0);

  const successfulWithdrawals = transactions.reduce((sum, tx) => {
    if (tx.status !== "success" || tx.type !== "withdrawal") return sum;
    return sum + (Number(tx.amount) || 0);
  }, 0);

  const netAfterWithdrawals = successfulTicketNet - successfulWithdrawals;

  const successfulTransactions = transactions.filter((tx) => tx.status === "success").length;
  const pendingTransactions = transactions.filter((tx) => tx.status === "pending").length;
  const failedTransactions = transactions.filter((tx) => tx.status === "failed").length;

  const successRate =
    transactions.length > 0
      ? ((successfulTransactions / transactions.length) * 100).toFixed(1)
      : 0;

  const sortTransactions = (list) => {
    return [...list].sort((a, b) => {
      if (sortConfig.key === "date") {
        return sortConfig.direction === "asc"
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortConfig.key === "amount") {
        const amt = (tx) =>
          tx.type === "ticket" ? ticketNetToOrganizer(tx) : Number(tx.amount) || 0;
        return sortConfig.direction === "asc" ? amt(a) - amt(b) : amt(b) - amt(a);
      }
      return 0;
    });
  };

  const filteredAndSortedTransactions = sortTransactions(
    transactions.filter((tx) => {
      if (filter !== "all" && tx.status !== filter) return false;
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          tx.reference?.toLowerCase().includes(searchLower) ||
          String(tx.amount).includes(searchLower) ||
          tx.status?.toLowerCase().includes(searchLower) ||
          tx.type?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
  );

  const totalPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredAndSortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const exportCsv = () => {
    if (filteredAndSortedTransactions.length === 0) return;
    const headers = [
      "Type",
      "Status",
      "Signed_amount_NGN",
      "Fee_NGN",
      "Buyer_paid_NGN",
      "Reference",
      "Date_ISO",
    ];
    const rows = filteredAndSortedTransactions.map((tx) => {
      const fee = Number(tx.fee) || 0;
      const buyerPaid = tx.type === "ticket" ? Number(tx.amount) || 0 : "";
      const signed =
        tx.type === "ticket"
          ? ticketNetToOrganizer(tx)
          : -(Number(tx.amount) || 0);
      return [tx.type, tx.status, signed, fee, buyerPaid, tx.reference || "", new Date(tx.createdAt).toISOString()];
    });
    const escape = (v) => {
      const s = String(v);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    const body = [headers.join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
    const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <CheckCircle size={14} />;
      case "pending":
        return <Clock size={14} />;
      case "failed":
        return <XCircle size={14} />;
      default:
        return null;
    }
  };

  const getTypeDisplay = (type) => {
    if (type === "ticket") return "Ticket sale";
    if (type === "withdrawal") return "Withdrawal";
    return type?.toUpperCase() || "Other";
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return "0";
    return new Intl.NumberFormat("en-NG").format(num);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const matchCount = filteredAndSortedTransactions.length;
  const matchLabel =
    matchCount === 0
      ? "No rows match your filters."
      : matchCount === 1
        ? "1 row matches your filters."
        : `${matchCount} rows match your filters.`;

  return (
    <div className="min-h-screen py-6 px-4 md:px-8 pb-20 font-geist ">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div className="max-w-md">
            <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-pink-500 transition-colors duration-200 mb-2">
              <ArrowLeft size={16} strokeWidth={2.25} /> Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 mb-1">Transaction history</h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              Naira (₦) only. Ticket rows show what you keep after fees; withdrawals show money sent to your bank.
            </p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={loading || filteredAndSortedTransactions.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-bold transition-all duration-200 hover:bg-gray-800 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <Download size={18} /> Export CSV
          </button>
        </header>

        {/* Main Panel */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Summary Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-b border-gray-200 bg-gradient-to-b from-gray-50/50 to-transparent">
            <div className="p-4 border-r border-gray-200 md:border-r">
              <span className="block text-[0.68rem] font-bold uppercase tracking-wider text-gray-400 mb-1">Net after withdrawals</span>
              <span className="block text-xl font-extrabold tracking-tight text-gray-900">₦{formatNumber(netAfterWithdrawals)}</span>
              <span className="block text-xs text-gray-400 mt-1">Successful credits minus payouts</span>
            </div>
            <div className="p-4 border-r border-gray-200">
              <span className="block text-[0.68rem] font-bold uppercase tracking-wider text-gray-400 mb-1">Ticket sales (net)</span>
              <span className="block text-xl font-extrabold tracking-tight text-gray-900">₦{formatNumber(successfulTicketNet)}</span>
              <span className="block text-xs text-gray-400 mt-1">Your share after platform fees</span>
            </div>
            <div className="p-4 border-r border-gray-200">
              <span className="block text-[0.68rem] font-bold uppercase tracking-wider text-gray-400 mb-1">Withdrawals paid</span>
              <span className="block text-xl font-extrabold tracking-tight text-gray-900">₦{formatNumber(successfulWithdrawals)}</span>
              <span className="block text-xs text-gray-400 mt-1">Completed bank transfers</span>
            </div>
            <div className="p-4">
              <span className="block text-[0.68rem] font-bold uppercase tracking-wider text-gray-400 mb-1">Success rate</span>
              <span className="block text-xl font-extrabold tracking-tight text-gray-900">{successRate}%</span>
              <span className="block text-xs text-gray-400 mt-1">{pendingTransactions} pending · {failedTransactions} failed</span>
            </div>
          </div>

          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="relative">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="search"
                placeholder="Search reference, amount, status, type…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="off"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
              />
            </div>
            
            <div className="space-y-3">
              {/* Type Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400 w-20">Activity</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: "all", label: "All" },
                    { value: "ticket", label: "Sales", icon: <ArrowUpRight size={13} /> },
                    { value: "withdrawal", label: "Withdrawals", icon: <ArrowDownLeft size={13} /> },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setTypeFilter(type.value)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                        typeFilter === type.value
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {type.icon}
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400 w-20">Status</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: "all", label: "All" },
                    { value: "success", label: "Success", icon: <CheckCircle size={13} />, color: "success" },
                    { value: "pending", label: "Pending", icon: <Clock size={13} />, color: "pending" },
                    { value: "failed", label: "Failed", icon: <XCircle size={13} />, color: "failed" },
                  ].map((status) => (
                    <button
                      key={status.value}
                      type="button"
                      onClick={() => setFilter(status.value)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                        filter === status.value
                          ? status.color === "success"
                            ? "bg-green-600 text-white"
                            : status.color === "pending"
                            ? "bg-amber-600 text-white"
                            : status.color === "failed"
                            ? "bg-red-600 text-white"
                            : "bg-gray-900 text-white"
                          : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {status.icon}
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Table Header */}
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-extrabold text-gray-900">Movements</h2>
            <p className="text-xs text-gray-400 mt-0.5">{matchLabel}</p>
          </div>

          {/* Column Headers - Desktop */}
          <div className="hidden md:grid grid-cols-[1.35fr_0.9fr_0.95fr_0.8fr_1fr_64px] gap-3 px-5 py-2 bg-gray-50/80 border-t border-b border-gray-200 text-[0.68rem] font-bold uppercase tracking-wider text-gray-400">
            <div className="flex items-center gap-1">Type</div>
            <button
              type="button"
              onClick={() => handleSort("date")}
              className="flex items-center gap-1 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <Calendar size={14} /> Date
              <ArrowUpDown size={12} className={`${sortConfig.key === "date" ? "opacity-100 text-pink-500" : "opacity-35"}`} />
            </button>
            <button
              type="button"
              onClick={() => handleSort("amount")}
              className="flex items-center gap-1 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <span>Amount <span className="font-extrabold">₦</span></span>
              <ArrowUpDown size={12} className={`${sortConfig.key === "amount" ? "opacity-100 text-pink-500" : "opacity-35"}`} />
            </button>
            <div className="flex items-center gap-1">Status</div>
            <div className="flex items-center gap-1">Reference</div>
            <div aria-hidden />
          </div>

          {/* Table Body */}
          <div className="min-h-[220px] bg-white">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-400">
                <div className="w-9 h-9 border-3 border-gray-200 border-t-pink-500 rounded-full animate-spin" />
                <p className="text-sm font-semibold">Loading transactions…</p>
              </div>
            ) : paginatedTransactions.length === 0 ? (
              <div className="flex flex-col items-center text-center py-12 px-5 gap-2">
                <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                  <Receipt size={40} />
                </div>
                <h3 className="text-base font-extrabold text-gray-900">No transactions match</h3>
                <p className="text-sm text-gray-400 max-w-xs">
                  {transactions.length === 0
                    ? "Sales and withdrawals will show up here as soon as there is activity on your account."
                    : "Try clearing filters or searching with a different term."}
                </p>
                {transactions.length === 0 ? (
                  <Link to="/events" className="mt-2 inline-flex px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-bold">
                    Browse events
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setFilter("all");
                      setTypeFilter("all");
                      setSearchTerm("");
                    }}
                    className="mt-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:border-gray-300 transition-colors"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            ) : (
              paginatedTransactions.map((tx) => (
                <div
                  key={tx._id}
                  onClick={() => setSelectedTransaction(tx)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedTransaction(tx);
                    }
                  }}
                  className="group border-b border-gray-100 hover:bg-gray-50/50 cursor-pointer transition-colors"
                >
                  {/* Desktop View */}
                  <div className="hidden md:grid grid-cols-[1.35fr_0.9fr_0.95fr_0.8fr_1fr_64px] gap-3 px-5 py-3 items-center">
                    {/* Type */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.type === "withdrawal" ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600"}`}>
                        {tx.type === "withdrawal" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <span className="font-semibold text-sm text-gray-900 truncate">{getTypeDisplay(tx.type)}</span>
                    </div>
                    {/* Date */}
                    <div className="text-sm font-semibold text-gray-500">{formatDate(tx.createdAt)}</div>
                    {/* Amount */}
                    <div className="flex flex-col items-end">
                      <span className={`font-extrabold text-sm ${tx.type === "withdrawal" ? "text-red-600" : "text-green-700"}`}>
                        {tx.type === "withdrawal" ? "−" : "+"}₦{formatNumber(tx.type === "ticket" ? ticketNetToOrganizer(tx) : tx.amount)}
                      </span>
                      {tx.type === "ticket" && Number(tx.fee) > 0 && (
                        <span className="text-[0.65rem] text-gray-400">Fee ₦{formatNumber(tx.fee)} · buyer paid ₦{formatNumber(tx.amount)}</span>
                      )}
                    </div>
                    {/* Status */}
                    <div>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold ${
                        tx.status === "success" ? "bg-green-50 text-green-700" :
                        tx.status === "pending" ? "bg-amber-50 text-amber-700" :
                        "bg-red-50 text-red-700"
                      }`}>
                        {getStatusIcon(tx.status)}
                        <span className="capitalize">{tx.status}</span>
                      </span>
                    </div>
                    {/* Reference */}
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="font-mono text-xs text-gray-500 truncate" title={tx.reference || undefined}>
                        {tx.reference ? (tx.reference.length > 14 ? `${tx.reference.slice(0, 14)}…` : tx.reference) : "—"}
                      </span>
                      {tx.reference && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(tx.reference);
                          }}
                          className="p-1 rounded-md text-gray-400 hover:text-pink-500 hover:bg-pink-50 transition-colors"
                          title="Copy reference"
                        >
                          <Copy size={14} />
                        </button>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTransaction(tx);
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-pink-500 hover:bg-pink-50 transition-colors"
                        title="Details"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Mobile View */}
                  <div className="md:hidden p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === "withdrawal" ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600"}`}>
                          {tx.type === "withdrawal" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                        </div>
                        <span className="font-bold text-sm text-gray-900">{getTypeDisplay(tx.type)}</span>
                      </div>
                      <span className={`font-extrabold text-sm ${tx.type === "withdrawal" ? "text-red-600" : "text-green-700"}`}>
                        {tx.type === "withdrawal" ? "−" : "+"}₦{formatNumber(tx.type === "ticket" ? ticketNetToOrganizer(tx) : tx.amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">{formatDate(tx.createdAt)}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                        tx.status === "success" ? "bg-green-50 text-green-700" :
                        tx.status === "pending" ? "bg-amber-50 text-amber-700" :
                        "bg-red-50 text-red-700"
                      }`}>
                        {getStatusIcon(tx.status)} {tx.status}
                      </span>
                    </div>
                    {tx.reference && (
                      <div className="flex items-center gap-1 pt-1">
                        <span className="font-mono text-xs text-gray-500 truncate flex-1">{tx.reference}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(tx.reference);
                          }}
                          className="p-1 rounded-md text-gray-400 hover:text-pink-500"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {filteredAndSortedTransactions.length > 0 && !loading && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-gray-200 bg-gray-50/30">
              <span className="text-xs font-semibold text-gray-500">
                Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredAndSortedTransactions.length)} of {filteredAndSortedTransactions.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-9 h-9 rounded-lg border border-gray-200 bg-white text-gray-600 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:border-gray-300 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[34px] h-9 px-2 rounded-lg border text-sm font-bold transition-colors ${
                        currentPage === pageNum
                          ? "bg-gray-900 border-gray-900 text-white"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="w-9 h-9 rounded-lg border border-gray-200 bg-white text-gray-600 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:border-gray-300 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          role="presentation"
          onClick={() => setSelectedTransaction(null)}
        >
          <div
            className="w-full max-w-md max-h-[90vh] overflow-auto bg-white rounded-xl border border-gray-200 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tx-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 p-4 pb-0">
              <h3 id="tx-modal-title" className="text-base font-extrabold text-gray-900">Transaction details</h3>
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2 py-3 border-b border-gray-100">
                <span className="text-[0.7rem] font-bold uppercase tracking-wider text-gray-400">Type</span>
                <span className="text-sm font-bold text-gray-900">{getTypeDisplay(selectedTransaction.type)}</span>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2 py-3 border-b border-gray-100">
                <span className="text-[0.7rem] font-bold uppercase tracking-wider text-gray-400">
                  {selectedTransaction.type === "ticket" ? "You receive" : "Amount"}
                </span>
                <span className={`text-base font-extrabold ${selectedTransaction.type === "withdrawal" ? "text-red-600" : "text-green-700"}`}>
                  {selectedTransaction.type === "withdrawal" ? "−" : "+"}₦
                  {formatNumber(selectedTransaction.type === "ticket" ? ticketNetToOrganizer(selectedTransaction) : selectedTransaction.amount)}
                </span>
              </div>
              {selectedTransaction.type === "ticket" && Number(selectedTransaction.fee) > 0 && (
                <>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 py-3 border-b border-gray-100">
                    <span className="text-[0.7rem] font-bold uppercase tracking-wider text-gray-400">Buyer paid</span>
                    <span className="text-sm text-gray-700">₦{formatNumber(selectedTransaction.amount)}</span>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 py-3 border-b border-gray-100">
                    <span className="text-[0.7rem] font-bold uppercase tracking-wider text-gray-400">Platform fee</span>
                    <span className="text-sm text-gray-700">₦{formatNumber(selectedTransaction.fee)}</span>
                  </div>
                </>
              )}
              <div className="flex flex-wrap items-baseline justify-between gap-2 py-3 border-b border-gray-100">
                <span className="text-[0.7rem] font-bold uppercase tracking-wider text-gray-400">Status</span>
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold ${
                  selectedTransaction.status === "success" ? "bg-green-50 text-green-700" :
                  selectedTransaction.status === "pending" ? "bg-amber-50 text-amber-700" :
                  "bg-red-50 text-red-700"
                }`}>
                  {getStatusIcon(selectedTransaction.status)} {selectedTransaction.status}
                </span>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2 py-3 border-b border-gray-100">
                <span className="text-[0.7rem] font-bold uppercase tracking-wider text-gray-400">Reference</span>
                <span className="font-mono text-xs text-gray-500 break-all text-right">{selectedTransaction.reference || "—"}</span>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                <span className="text-[0.7rem] font-bold uppercase tracking-wider text-gray-400">Date</span>
                <span className="text-sm text-gray-600 text-right">
                  {new Date(selectedTransaction.createdAt).toLocaleString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 p-4 border-t border-gray-100 bg-gray-50/50">
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:border-gray-300 transition-colors"
              >
                Close
              </button>
              {selectedTransaction.reference && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(selectedTransaction.reference)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
                >
                  <Copy size={16} /> Copy reference
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}