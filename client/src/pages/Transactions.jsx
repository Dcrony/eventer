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
  Receipt
} from "lucide-react";
import "./CSS/Transactions.css";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { darkMode } = useContext(ThemeContext);
  const token = localStorage.getItem("token");

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

  // Calculate totals
  const totalAmount = transactions.reduce((sum, tx) => 
    tx.status === "success" ? sum + tx.amount : sum, 0
  );
  
  const successfulTransactions = transactions.filter(tx => tx.status === "success").length;
  const pendingTransactions = transactions.filter(tx => tx.status === "pending").length;
  const failedTransactions = transactions.filter(tx => tx.status === "failed").length;

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    if (filter !== "all" && tx.status !== filter) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        tx.reference?.toLowerCase().includes(searchLower) ||
        tx.amount.toString().includes(searchLower)
      );
    }
    return true;
  });

  const getStatusIcon = (status) => {
    switch(status) {
      case "success": return <CheckCircle size={16} />;
      case "pending": return <Clock size={16} />;
      case "failed": return <XCircle size={16} />;
      default: return null;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  return (
    <div className={`transactions-page ${darkMode ? "dark-mode" : ""}`}>
      {/* Header Section */}
      <div className="transactions-header-section">
        <div className="header-content">
          <h1>
            <Receipt size={28} />
            Transaction History
          </h1>
          <p>View and manage all your payment transactions</p>
        </div>
        
        <button className="export-btn">
          <Download size={18} />
          Export Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Revenue</span>
            <span className="stat-value">₦{totalAmount.toLocaleString()}</span>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Successful</span>
            <span className="stat-value">{successfulTransactions}</span>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Pending</span>
            <span className="stat-value">{pendingTransactions}</span>
          </div>
        </div>

        <div className="stat-card failed">
          <div className="stat-icon">
            <XCircle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Failed</span>
            <span className="stat-value">{failedTransactions}</span>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by reference or amount..."
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
            className={`filter-tab ${filter === "success" ? "active" : ""}`}
            onClick={() => setFilter("success")}
          >
            <CheckCircle size={14} />
            Success
          </button>
          <button 
            className={`filter-tab ${filter === "pending" ? "active" : ""}`}
            onClick={() => setFilter("pending")}
          >
            <Clock size={14} />
            Pending
          </button>
          <button 
            className={`filter-tab ${filter === "failed" ? "active" : ""}`}
            onClick={() => setFilter("failed")}
          >
            <XCircle size={14} />
            Failed
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="transactions-card">
        <div className="table-header">
          <div className="header-cell date">
            <Calendar size={14} />
            <span>Date</span>
            <ArrowUpDown size={12} />
          </div>
          <div className="header-cell amount">
            <DollarSign size={14} />
            <span>Amount</span>
            <ArrowUpDown size={12} />
          </div>
          <div className="header-cell status">Status</div>
          <div className="header-cell reference">Reference</div>
        </div>

        <div className="table-body">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="empty-state">
              <Receipt size={48} />
              <h3>No transactions found</h3>
              <p>Transactions will appear here once you start selling tickets</p>
            </div>
          ) : (
            filteredTransactions.map((tx, index) => (
              <div 
                key={tx._id} 
                className={`table-row ${index % 2 === 0 ? "even" : "odd"}`}
              >
                <div className="row-cell date">
                  <span className="date-full">{formatDate(tx.createdAt)}</span>
                  <span className="date-mobile">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="row-cell amount">
                  <span className="amount-value">₦{tx.amount.toLocaleString()}</span>
                </div>

                <div className="row-cell status">
                  <span className={`status-badge ${tx.status}`}>
                    {getStatusIcon(tx.status)}
                    <span>{tx.status}</span>
                  </span>
                </div>

                <div className="row-cell reference">
                  <span className="reference-text">{tx.reference || "—"}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination (if needed) */}
        {filteredTransactions.length > 0 && (
          <div className="table-footer">
            <span className="showing-info">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </span>
            <div className="pagination">
              <button className="page-btn" disabled>Previous</button>
              <button className="page-btn active">1</button>
              <button className="page-btn">2</button>
              <button className="page-btn">3</button>
              <button className="page-btn">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}