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
import "./CSS/Transactions.css";
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
    <div className="transactions-page">
      <div className="tx-layout">
        <header className="tx-top-bar">
          <div className="tx-top-bar-main">
            <Link to="/dashboard" className="tx-back-link">
              <ArrowLeft size={16} strokeWidth={2.25} />
              Dashboard
            </Link>
            <h1 className="tx-page-title">Transaction history</h1>
            <p className="tx-page-lede">
              Naira (₦) only. Ticket rows show what you keep after fees; withdrawals show money sent to
              your bank.
            </p>
          </div>
          <button
            type="button"
            className="tx-export-btn"
            onClick={exportCsv}
            disabled={loading || filteredAndSortedTransactions.length === 0}
          >
            <Download size={18} />
            Export CSV
          </button>
        </header>

        <section className="tx-panel" aria-label="Transactions">
          <div className="tx-summary-strip">
            <div className="tx-sum-item">
              <span className="tx-sum-label">Net after withdrawals</span>
              <span className="tx-sum-value">₦{formatNumber(netAfterWithdrawals)}</span>
              <span className="tx-sum-meta">Successful credits minus payouts</span>
            </div>
            <div className="tx-sum-item">
              <span className="tx-sum-label">Ticket sales (net)</span>
              <span className="tx-sum-value">₦{formatNumber(successfulTicketNet)}</span>
              <span className="tx-sum-meta">Your share after platform fees</span>
            </div>
            <div className="tx-sum-item">
              <span className="tx-sum-label">Withdrawals paid</span>
              <span className="tx-sum-value">₦{formatNumber(successfulWithdrawals)}</span>
              <span className="tx-sum-meta">Completed bank transfers</span>
            </div>
            <div className="tx-sum-item">
              <span className="tx-sum-label">Success rate</span>
              <span className="tx-sum-value">{successRate}%</span>
              <span className="tx-sum-meta">
                {pendingTransactions} pending · {failedTransactions} failed
              </span>
            </div>
          </div>

          <div className="tx-toolbar">
            <div className="tx-search-field">
              <Search size={17} className="tx-search-icon" aria-hidden />
              <input
                type="search"
                placeholder="Search reference, amount, status, type…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="off"
                aria-label="Search transactions"
              />
            </div>
            <div className="tx-filter-rows">
              <div className="tx-filter-row">
                <span className="tx-filter-name">Activity</span>
                <div className="tx-chip-list">
                  <button
                    type="button"
                    className={`tx-chip ${typeFilter === "all" ? "tx-chip--on" : ""}`}
                    onClick={() => setTypeFilter("all")}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={`tx-chip ${typeFilter === "ticket" ? "tx-chip--on" : ""}`}
                    onClick={() => setTypeFilter("ticket")}
                  >
                    <ArrowUpRight size={13} />
                    Sales
                  </button>
                  <button
                    type="button"
                    className={`tx-chip ${typeFilter === "withdrawal" ? "tx-chip--on" : ""}`}
                    onClick={() => setTypeFilter("withdrawal")}
                  >
                    <ArrowDownLeft size={13} />
                    Withdrawals
                  </button>
                </div>
              </div>
              <div className="tx-filter-row">
                <span className="tx-filter-name">Status</span>
                <div className="tx-chip-list">
                  <button
                    type="button"
                    className={`tx-chip ${filter === "all" ? "tx-chip--on" : ""}`}
                    onClick={() => setFilter("all")}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={`tx-chip tx-chip--success ${filter === "success" ? "tx-chip--on" : ""}`}
                    onClick={() => setFilter("success")}
                  >
                    <CheckCircle size={13} />
                    Success
                  </button>
                  <button
                    type="button"
                    className={`tx-chip tx-chip--pending ${filter === "pending" ? "tx-chip--on" : ""}`}
                    onClick={() => setFilter("pending")}
                  >
                    <Clock size={13} />
                    Pending
                  </button>
                  <button
                    type="button"
                    className={`tx-chip tx-chip--failed ${filter === "failed" ? "tx-chip--on" : ""}`}
                    onClick={() => setFilter("failed")}
                  >
                    <XCircle size={13} />
                    Failed
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="tx-table-headline">
            <h2>Movements</h2>
            <p>{matchLabel}</p>
          </div>

          <div className="table-header" role="row">
            <div className="header-cell type">Type</div>
            <button
              type="button"
              className="header-cell date sortable"
              onClick={() => handleSort("date")}
            >
              <Calendar size={14} />
              <span>Date</span>
              <ArrowUpDown
                size={12}
                className={`sort-icon ${sortConfig.key === "date" ? "active" : ""}`}
              />
            </button>
            <button
              type="button"
              className="header-cell amount sortable"
              onClick={() => handleSort("amount")}
            >
              <span className="tx-amount-heading">
                Amount<span className="tx-amount-heading-cur">₦</span>
              </span>
              <ArrowUpDown
                size={12}
                className={`sort-icon ${sortConfig.key === "amount" ? "active" : ""}`}
              />
            </button>
            <div className="header-cell status">Status</div>
            <div className="header-cell reference">Reference</div>
            <div className="header-cell actions" aria-hidden />
          </div>

          <div className="table-body">
            {loading ? (
              <div className="loading-state">
                <div className="spinner" />
                <p>Loading transactions…</p>
              </div>
            ) : paginatedTransactions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon-wrapper">
                  <Receipt size={40} />
                </div>
                <h3>No transactions match</h3>
                <p>
                  {transactions.length === 0
                    ? "Sales and withdrawals will show up here as soon as there is activity on your account."
                    : "Try clearing filters or searching with a different term."}
                </p>
                {transactions.length === 0 ? (
                  <Link to="/events" className="browse-events-btn">
                    Browse events
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="tx-reset-filters"
                    onClick={() => {
                      setFilter("all");
                      setTypeFilter("all");
                      setSearchTerm("");
                    }}
                  >
                    Reset filters
                  </button>
                )}
              </div>
            ) : (
              paginatedTransactions.map((tx) => (
                <div
                  key={tx._id}
                  className="table-row"
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedTransaction(tx)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedTransaction(tx);
                    }
                  }}
                >
                  <div className="row-cell type" data-label="Type">
                    <div className="transaction-type">
                      <div
                        className={`type-pill ${tx.type === "withdrawal" ? "expense" : "income"}`}
                      >
                        {tx.type === "withdrawal" ? (
                          <ArrowDownLeft size={16} />
                        ) : (
                          <ArrowUpRight size={16} />
                        )}
                      </div>
                      <span className="type-text">{getTypeDisplay(tx.type)}</span>
                    </div>
                  </div>

                  <div className="row-cell date" data-label="Date">
                    <span className="date-full">{formatDate(tx.createdAt)}</span>
                    <span className="date-mobile">
                      {new Date(tx.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="row-cell amount" data-label="Amount">
                    <span
                      className={`amount-value ${tx.type === "withdrawal" ? "negative" : "positive"}`}
                    >
                      {tx.type === "withdrawal" ? "−" : "+"}₦
                      {formatNumber(
                        tx.type === "ticket" ? ticketNetToOrganizer(tx) : tx.amount
                      )}
                    </span>
                    {tx.type === "ticket" && Number(tx.fee) > 0 && (
                      <span className="amount-sub" title="Platform fee on this sale">
                        Fee ₦{formatNumber(tx.fee)} · buyer paid ₦{formatNumber(tx.amount)}
                      </span>
                    )}
                  </div>

                  <div className="row-cell status" data-label="Status">
                    <span className={`status-badge ${tx.status}`}>
                      {getStatusIcon(tx.status)}
                      <span className="status-text">{tx.status}</span>
                    </span>
                  </div>

                  <div className="row-cell reference" data-label="Reference">
                    <div className="reference-wrapper">
                      <span className="reference-text" title={tx.reference || undefined}>
                        {tx.reference
                          ? tx.reference.length > 14
                            ? `${tx.reference.slice(0, 14)}…`
                            : tx.reference
                          : "—"}
                      </span>
                      {tx.reference && (
                        <button
                          type="button"
                          className="copy-btn"
                          title="Copy reference"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(tx.reference);
                          }}
                        >
                          <Copy size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="row-cell actions" data-label="">
                    <button
                      type="button"
                      className="action-btn view"
                      title="Details"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTransaction(tx);
                      }}
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {filteredAndSortedTransactions.length > 0 && !loading && (
            <div className="table-footer">
              <span className="showing-info">
                Showing {(currentPage - 1) * itemsPerPage + 1}–
                {Math.min(currentPage * itemsPerPage, filteredAndSortedTransactions.length)} of{" "}
                {filteredAndSortedTransactions.length}
              </span>
              <div className="pagination">
                <button
                  type="button"
                  className="page-nav"
                  aria-label="Previous page"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
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
                      className={`page-btn ${currentPage === pageNum ? "active" : ""}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  className="page-nav"
                  aria-label="Next page"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {selectedTransaction && (
        <div className="modal-overlay" role="presentation" onClick={() => setSelectedTransaction(null)}>
          <div
            className="transaction-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tx-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-top">
              <h3 id="tx-modal-title">Transaction details</h3>
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={() => setSelectedTransaction(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-content">
              <div className="detail-row">
                <span className="detail-label">Type</span>
                <span className="detail-value">{getTypeDisplay(selectedTransaction.type)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">
                  {selectedTransaction.type === "ticket" ? "You receive" : "Amount"}
                </span>
                <span
                  className={`detail-value amount ${selectedTransaction.type === "withdrawal" ? "negative" : "positive"}`}
                >
                  {selectedTransaction.type === "withdrawal" ? "−" : "+"}₦
                  {formatNumber(
                    selectedTransaction.type === "ticket"
                      ? ticketNetToOrganizer(selectedTransaction)
                      : selectedTransaction.amount
                  )}
                </span>
              </div>
              {selectedTransaction.type === "ticket" && Number(selectedTransaction.fee) > 0 && (
                <>
                  <div className="detail-row">
                    <span className="detail-label">Buyer paid</span>
                    <span className="detail-value">₦{formatNumber(selectedTransaction.amount)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Platform fee</span>
                    <span className="detail-value">₦{formatNumber(selectedTransaction.fee)}</span>
                  </div>
                </>
              )}
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span className={`status-badge ${selectedTransaction.status}`}>
                  {getStatusIcon(selectedTransaction.status)}
                  <span>{selectedTransaction.status}</span>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Reference</span>
                <span className="detail-value reference">{selectedTransaction.reference || "—"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date</span>
                <span className="detail-value">
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
            <div className="modal-actions">
              <button type="button" onClick={() => setSelectedTransaction(null)}>
                Close
              </button>
              {selectedTransaction.reference ? (
                <button
                  type="button"
                  className="download-receipt-btn"
                  onClick={() => copyToClipboard(selectedTransaction.reference)}
                >
                  <Copy size={16} />
                  Copy reference
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
