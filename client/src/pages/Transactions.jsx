
import { useEffect, useState, useContext } from "react";
import API from "../api/axios";
import { ThemeContext } from "../contexts/ThemeContexts";
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock,
  Download,
  Filter,
  Search,
  ArrowUpDown,
  Receipt,
  TrendingUp,
  TrendingDown,
  Copy,
  Eye,
  ChevronLeft,
  ChevronRight,
  FileText,
  BarChart3,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import "./CSS/Transactions.css";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const { darkMode } = useContext(ThemeContext);
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
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [token]);

  // Calculate totals and analytics
  const totalAmount = transactions.reduce((sum, tx) => 
    tx.status === "success" ? sum + tx.amount : sum, 0
  );
  
  const successfulTransactions = transactions.filter(tx => tx.status === "success").length;
  const pendingTransactions = transactions.filter(tx => tx.status === "pending").length;
  const failedTransactions = transactions.filter(tx => tx.status === "failed").length;
  
  const successRate = transactions.length > 0 
    ? ((successfulTransactions / transactions.length) * 100).toFixed(1) 
    : 0;

  // Sort transactions
  const sortTransactions = (transactions) => {
    return [...transactions].sort((a, b) => {
      if (sortConfig.key === "date") {
        return sortConfig.direction === "asc" 
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortConfig.key === "amount") {
        return sortConfig.direction === "asc" 
          ? a.amount - b.amount
          : b.amount - a.amount;
      }
      return 0;
    });
  };

  // Filter and sort transactions
  const filteredAndSortedTransactions = sortTransactions(
    transactions.filter(tx => {
      if (filter !== "all" && tx.status !== filter) return false;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          tx.reference?.toLowerCase().includes(searchLower) ||
          tx.amount.toString().includes(searchLower) ||
          tx.status?.toLowerCase().includes(searchLower) ||
          tx.type?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
  );

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredAndSortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "success": return <CheckCircle size={16} />;
      case "pending": return <Clock size={16} />;
      case "failed": return <XCircle size={16} />;
      default: return null;
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case "ticket": return <ArrowUpRight size={14} className="type-icon income" />;
      case "withdrawal": return <ArrowDownLeft size={14} className="type-icon expense" />;
      default: return <CreditCard size={14} className="type-icon" />;
    }
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
      // Today - show time
      return `Today at ${date.toLocaleTimeString("en-US", { 
        hour: "2-digit", 
        minute: "2-digit" 
      })}`;
    }
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className={`transactions-page ${darkMode ? "dark-mode" : ""}`}>
      {/* Header Section with Gradient */}
      <div className="transactions-header-section">
        <div className="header-content">
          <div className="header-badge">
            <BarChart3 size={20} />
            <span>Financial Overview</span>
          </div>
          <h1>
            <Receipt size={32} />
            Transaction History
          </h1>
          <p>View and manage all your payment transactions in one place</p>
        </div>
        
        <div className="header-actions">
          <Link to="/dashboard" className="back-to-dashboard-btn">
            <ArrowUpDown size={18} />
            Back to Dashboard
          </Link>
          <button className="export-btn">
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards - Dashboard Style */}
      <div className="stats-container-grid">
        <div className="stat-tile pink">
          <div className="stat-tile-content">
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">₦{formatNumber(totalAmount)}</div>
          </div>
          <div className="stat-tile-icon-wrapper">
            <Wallet size={24} className="stat-tile-icon" />
          </div>
        </div>

        <div className="stat-tile green">
          <div className="stat-tile-content">
            <div className="stat-label">Successful</div>
            <div className="stat-value">{successfulTransactions}</div>
          </div>
          <div className="stat-tile-icon-wrapper">
            <CheckCircle size={24} className="stat-tile-icon" />
          </div>
        </div>

        <div className="stat-tile yellow">
          <div className="stat-tile-content">
            <div className="stat-label">Pending</div>
            <div className="stat-value">{pendingTransactions}</div>
          </div>
          <div className="stat-tile-icon-wrapper">
            <Clock size={24} className="stat-tile-icon" />
          </div>
        </div>

        <div className="stat-tile red">
          <div className="stat-tile-content">
            <div className="stat-label">Failed</div>
            <div className="stat-value">{failedTransactions}</div>
          </div>
          <div className="stat-tile-icon-wrapper">
            <XCircle size={24} className="stat-tile-icon" />
          </div>
        </div>

        <div className="stat-tile blue">
          <div className="stat-tile-content">
            <div className="stat-label">Success Rate</div>
            <div className="stat-value">{successRate}%</div>
          </div>
          <div className="stat-tile-icon-wrapper">
            <TrendingUp size={24} className="stat-tile-icon" />
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by reference, amount, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button 
            className={`filter-tab success ${filter === "success" ? "active" : ""}`}
            onClick={() => setFilter("success")}
          >
            <CheckCircle size={14} />
            Success
          </button>
          <button 
            className={`filter-tab pending ${filter === "pending" ? "active" : ""}`}
            onClick={() => setFilter("pending")}
          >
            <Clock size={14} />
            Pending
          </button>
          <button 
            className={`filter-tab failed ${filter === "failed" ? "active" : ""}`}
            onClick={() => setFilter("failed")}
          >
            <XCircle size={14} />
            Failed
          </button>
        </div>
      </div>

      {/* Transactions Table Card */}
      <div className="transactions-card">
        <div className="table-header">
          <div className="header-cell type">Type</div>
          <div className="header-cell date" onClick={() => handleSort("date")}>
            <Calendar size={14} />
            <span>Date</span>
            <ArrowUpDown size={12} className={`sort-icon ${sortConfig.key === "date" ? "active" : ""}`} />
          </div>
          <div className="header-cell amount" onClick={() => handleSort("amount")}>
            <DollarSign size={14} />
            <span>Amount</span>
            <ArrowUpDown size={12} className={`sort-icon ${sortConfig.key === "amount" ? "active" : ""}`} />
          </div>
          <div className="header-cell status">Status</div>
          <div className="header-cell reference">Reference</div>
          <div className="header-cell actions">Actions</div>
        </div>

        <div className="table-body">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your transactions...</p>
            </div>
          ) : paginatedTransactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-wrapper">
                <Receipt size={48} />
              </div>
              <h3>No transactions found</h3>
              <p>Transactions will appear here once you start selling tickets</p>
              <Link to="/events" className="browse-events-btn">
                Browse Events
              </Link>
            </div>
          ) : (
            paginatedTransactions.map((tx, index) => (
              <div 
                key={tx._id} 
                className={`table-row ${index % 2 === 0 ? "even" : "odd"}`}
                onClick={() => setSelectedTransaction(tx)}
              >
                <div className="row-cell type" data-label="Type">
                  <div className="transaction-type">
                    {getTypeIcon(tx.type)}
                    <span className="type-text">
                      {tx.type === "ticket" ? "Ticket Sale" : 
                       tx.type === "withdrawal" ? "Withdrawal" : 
                       tx.type?.toUpperCase() || "TRANSFER"}
                    </span>
                  </div>
                </div>

                <div className="row-cell date" data-label="Date">
                  <span className="date-full">{formatDate(tx.createdAt)}</span>
                  <span className="date-mobile">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="row-cell amount" data-label="Amount">
                  <span className={`amount-value ${tx.type === "withdrawal" ? "negative" : "positive"}`}>
                    {tx.type === "withdrawal" ? "-" : "+"} ₦{formatNumber(tx.amount)}
                  </span>
                </div>

                <div className="row-cell status" data-label="Status">
                  <span className={`status-badge ${tx.status}`}>
                    {getStatusIcon(tx.status)}
                    <span className="status-text">{tx.status}</span>
                  </span>
                </div>

                <div className="row-cell reference" data-label="Reference">
                  <div className="reference-wrapper">
                    <span className="reference-text">
                      {tx.reference ? tx.reference.slice(0, 8) + "..." : "—"}
                    </span>
                    {tx.reference && (
                      <button 
                        className="copy-btn"
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

                <div className="row-cell actions" data-label="Actions">
                  <button 
                    className="action-btn view" 
                    title="View Details"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTransaction(tx);
                    }}
                  >
                    <Eye size={14} />
                  </button>
                  <button className="action-btn download" title="Download Receipt">
                    <Download size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredAndSortedTransactions.length > 0 && (
          <div className="table-footer">
            <span className="showing-info">
              Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedTransactions.length)} of {filteredAndSortedTransactions.length} transactions
            </span>
            <div className="pagination">
              <button 
                className="page-nav"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                    className={`page-btn ${currentPage === pageNum ? "active" : ""}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button 
                className="page-nav"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="modal-overlay" onClick={() => setSelectedTransaction(null)}>
          <div className="transaction-modal" onClick={e => e.stopPropagation()}>
            <h3>Transaction Details</h3>
            <div className="modal-content">
              <div className="detail-row">
                <span className="detail-label">Type:</span>
                <span className="detail-value">
                  {selectedTransaction.type === "ticket" ? "Ticket Sale" : 
                   selectedTransaction.type === "withdrawal" ? "Withdrawal" : 
                   selectedTransaction.type?.toUpperCase() || "Transfer"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Amount:</span>
                <span className={`detail-value amount ${selectedTransaction.type === "withdrawal" ? "negative" : "positive"}`}>
                  {selectedTransaction.type === "withdrawal" ? "-" : "+"} ₦{formatNumber(selectedTransaction.amount)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className={`status-badge ${selectedTransaction.status}`}>
                  {getStatusIcon(selectedTransaction.status)}
                  <span>{selectedTransaction.status}</span>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Reference:</span>
                <span className="detail-value reference">{selectedTransaction.reference || "—"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date:</span>
                <span className="detail-value">
                  {new Date(selectedTransaction.createdAt).toLocaleString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setSelectedTransaction(null)}>Close</button>
              <button className="download-receipt-btn">
                <Download size={16} />
                Download Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}