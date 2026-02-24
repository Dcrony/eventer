import { useEffect, useState } from "react";
import API from "../api/axios";
import "./CSS/Admin.css";

export default function AdminWithdrawals() {
  const token = localStorage.getItem("token");

  const [withdrawals, setWithdrawals] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchWithdrawals = async () => {
    try {
      const res = await API.get(
        `/admin/withdrawals?status=${statusFilter}&search=${searchTerm}&startDate=${startDate}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setWithdrawals(res.data);
    } catch (err) {
      alert("Failed to fetch withdrawals");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    const res = await API.get("/admin/withdrawals/analytics", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setAnalytics(res.data);
  };

  const fetchMonthlyTrend = async () => {
    const res = await API.get("/admin/withdrawals/monthly", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setMonthlyData(res.data);
  };

  useEffect(() => {
    fetchWithdrawals();
    fetchAnalytics();
    fetchMonthlyTrend();
  }, [statusFilter, searchTerm, startDate, endDate]);

  const handleAction = async (id, status) => {
    await API.patch(
      `/admin/withdrawals/${id}`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    fetchWithdrawals();
    fetchAnalytics();
    fetchMonthlyTrend();
  };

  const exportToCSV = () => {
    const headers = [
      "Organizer",
      "Email",
      "Amount",
      "Fee",
      "Status",
      "Reference",
    ];

    const rows = withdrawals.map((w) => [
      w.organizer.username,
      w.organizer.email,
      w.amount,
      w.fee || 0,
      w.status,
      w.paystackReference || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "withdrawals.csv";
    link.click();
  };

  return (
    <div className="admin-page">
      <h2>Withdrawal Management</h2>

      {/* Analytics */}
      <div className="analytics-cards">
        <div className="card">
          <h4>Total Paid</h4>
          <p>₦{analytics.totalPaid?.toLocaleString()}</p>
        </div>
        <div className="card">
          <h4>Total Pending</h4>
          <p>₦{analytics.totalPending?.toLocaleString()}</p>
        </div>
        <div className="card">
          <h4>Total Fees Collected</h4>
          <p>₦{analytics.totalPlatformFees?.toLocaleString()}</p>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="chart">
        <h4>Monthly Payout Trend</h4>
        <svg width="100%" height="200">
          {monthlyData.map((item, index) => (
            <rect
              key={index}
              x={index * 50}
              y={200 - item.total / 1500}
              width="35"
              height={item.total / 1500}
              rx="6"
            />
          ))}
        </svg>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="tabs">
          {["all", "pending", "processing", "completed", "rejected", "failed"].map((tab) => (
            <button
              key={tab}
              className={statusFilter === tab ? "active" : ""}
              onClick={() => setStatusFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search organizer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />

        <button onClick={exportToCSV}>Export CSV</button>
      </div>

      {/* Table */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="withdrawal-table">
          {withdrawals.map((w) => (
            <div key={w._id} className="withdrawal-row">
              <div>
                <strong>{w.organizer.username}</strong>
                <div>{w.organizer.email}</div>
                <div className="bank-inline">
                  {w.bankDetails?.bankName} - {w.bankDetails?.accountNumber}
                </div>
                <div className="reference">
                  Ref: {w.paystackReference || "N/A"}
                </div>
              </div>

              <div>
                ₦{w.amount.toLocaleString()}
                <div className="fee">Fee: ₦{w.fee || 0}</div>
              </div>

              <div className={`status ${w.status}`}>{w.status}</div>

              {w.status === "pending" && (
                <div className="actions">
                  <button onClick={() => handleAction(w._id, "approved")}>
                    Approve
                  </button>
                  <button onClick={() => handleAction(w._id, "rejected")}>
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
