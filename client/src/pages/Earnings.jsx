import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import {
  ArrowRight,
  Banknote,
  Info,
  Receipt,
  Wallet,
} from "lucide-react";
import "./CSS/Dashboard.css";
import "./CSS/Earnings.css";
import { getEventImageUrl } from "../utils/eventHelpers";

export default function Earnings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [banks, setBanks] = useState([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
    bankCode: "",
  });

  const uniqueBanks = useMemo(() => {
    const seen = new Set();
    return banks.filter((bank) => {
      if (seen.has(bank.code)) return false;
      seen.add(bank.code);
      return true;
    });
  }, [banks]);

  const loadEarnings = () => {
    setLoading(true);
    setError(null);
    API.get("/organizer/earnings")
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.message || "Could not load earnings");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadEarnings();
  }, []);

  useEffect(() => {
    API.get("/banks")
      .then((res) => setBanks(res.data || []))
      .catch(() => {});
  }, []);

  const formatNumber = (num) => {
    if (num === null || num === undefined || Number.isNaN(Number(num))) return "0";
    return new Intl.NumberFormat("en-NG").format(Number(num));
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
      return alert("Enter a valid amount");
    }
    if (!bankDetails.bankCode || !bankDetails.accountNumber || !bankDetails.accountName) {
      return alert("Complete bank details");
    }
    try {
      setWithdrawLoading(true);
      await API.post("/organizer/withdraw", {
        amount: Number(withdrawAmount),
        paymentMethod: "bank",
        bankDetails,
      });
      alert("Withdrawal submitted. Awaiting admin approval.");
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      loadEarnings();
    } catch (err) {
      alert(err.response?.data?.message || "Withdrawal failed");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const minW = data?.minWithdrawalAmount ?? 1000;
  const platformPct = data?.platformTicketFeePercent ?? 10;

  return (
    <div className="dashboard-page earnings-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <div className="dashboard-title">Earnings</div>
            <div className="dashboard-subtitle">
              Track ticket revenue and what you can withdraw.
            </div>
          </div>
          <div className="dashboard-actions">
            <Link to="/transactions" className="dash-btn">
              Transactions <ArrowRight size={18} />
            </Link>
            <Link to="/dashboard" className="dash-btn">
              Dashboard <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        {loading && (
          <div className="dash-card">
            <div className="dash-card-body">
              <p>Loading earnings…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="dash-card">
            <div className="dash-card-body">
              <p style={{ color: "#dc2626", fontWeight: 700 }}>{error}</p>
              <button type="button" className="dash-btn" onClick={loadEarnings}>
                Retry
              </button>
            </div>
          </div>
        )}

        {!loading && !error && data && (
          <>
            <div className="earnings-summary-grid">
              <div className="earnings-stat">
                <span className="earnings-stat-label">
                  <Receipt size={14} style={{ display: "inline", verticalAlign: "middle" }} /> Gross
                  ticket sales
                </span>
                <span className="earnings-stat-value">₦{formatNumber(data.grossTicketSales)}</span>
                <span className="earnings-stat-hint">Total ticket revenue across your events.</span>
              </div>

              <div className="earnings-stat">
                <span className="earnings-stat-label">Net after platform fee</span>
                <span className="earnings-stat-value">
                  ₦{formatNumber(data.netAfterSalesCommission)}
                </span>
                <span className="earnings-stat-hint">Your share of ticket sales after the platform fee.</span>
              </div>

              <div className="earnings-stat earnings-highlight">
                <span className="earnings-stat-label">
                  <Wallet size={14} style={{ display: "inline", verticalAlign: "middle" }} /> Available
                  to withdraw
                </span>
                <span className="earnings-stat-value">₦{formatNumber(data.availableBalance)}</span>
                <span className="earnings-stat-hint">
                  Eligible balance in your account. Pending balance: ₦
                  {formatNumber(data.pendingBalance)}.
                </span>
              </div>
            </div>

            <div className="dash-card" style={{ marginBottom: "1.25rem" }}>
              <div className="dash-card-body">
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "flex-start",
                    color: "var(--text-muted)",
                    fontSize: "0.9rem",
                    lineHeight: 1.5,
                  }}
                >
                  <Info size={18} style={{ flexShrink: 0, marginTop: "0.1rem" }} />
                  <div>
                    {platformPct > 0 ? (
                      <>
                        <strong>{platformPct}%</strong> of each ticket sale is retained by the
                        platform; your earnings and withdrawable balance are shown after that fee.{" "}
                      </>
                    ) : (
                      <>No platform fee is applied to ticket sales. </>
                    )}
                    Minimum withdrawal when approved: <strong>₦{formatNumber(minW)}</strong>.
                    {data.pendingWithdrawalAmount > 0 && (
                      <>
                        {" "}
                        You have <strong>₦{formatNumber(data.pendingWithdrawalAmount)}</strong> in
                        pending withdrawal requests.
                      </>
                    )}
                    {data.totalWithdrawn > 0 && (
                      <>
                        {" "}
                        Lifetime completed withdrawals:{" "}
                        <strong>₦{formatNumber(data.totalWithdrawn)}</strong>.
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="earnings-actions">
              <button
                type="button"
                className="dash-btn dash-btn-primary"
                onClick={() => setShowWithdrawModal(true)}
              >
                <Banknote size={18} /> Withdraw
              </button>
            </div>

            <div className="dash-card">
              <div className="dash-card-header">
                <div className="dash-card-title">Earnings by event</div>
              </div>
              <div className="dash-card-body" style={{ padding: 0 }}>
                {data.perEvent.length === 0 ? (
                  <p style={{ padding: "1.25rem" }} className="earnings-muted-row">
                    No events yet. Create an event and sell tickets to see breakdown here.
                  </p>
                ) : (
                  <div className="earnings-table-wrap">
                    <table className="earnings-table">
                      <thead>
                        <tr>
                          <th>Event</th>
                          <th>Tickets</th>
                          <th>Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.perEvent.map((row) => (
                          <tr key={String(row.eventId)}>
                            <td>
                              <div className="earnings-event-cell">
                                {getEventImageUrl({ image: row.image }) ? (
                                  <img
                                    className="earnings-event-thumb"
                                    src={getEventImageUrl({ image: row.image })}
                                    alt=""
                                  />
                                ) : (
                                  <div className="earnings-event-thumb" />
                                )}
                                <span className="earnings-event-title" title={row.title}>
                                  {row.title}
                                </span>
                              </div>
                            </td>
                            <td>{formatNumber(row.ticketsSold)}</td>
                            <td>
                              <strong>₦{formatNumber(row.netEarnings)}</strong>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {showWithdrawModal && data && (
        <div className="modal-overlay">
          <div className="withdraw-modal">
            <button type="button" className="close-btn" onClick={() => setShowWithdrawModal(false)}>
              ✕
            </button>
            <h3>Request withdrawal</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
              Available: ₦{formatNumber(data.availableBalance)} · Min (on approval): ₦
              {formatNumber(minW)}
              {platformPct > 0
                ? ` · Balances reflect the ${platformPct}% platform fee on ticket sales.`
                : "."}
            </p>
            <div className="withdraw-balance">Amount to request (₦)</div>
            <input
              type="number"
              placeholder="Enter amount"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
            />
            <label>Bank</label>
            <select
              value={bankDetails.bankCode}
              onChange={(e) => {
                const selected = uniqueBanks.find((b) => b.code === e.target.value);
                if (selected) {
                  setBankDetails({
                    ...bankDetails,
                    bankCode: selected.code,
                    bankName: selected.name,
                  });
                }
              }}
            >
              <option value="">Select bank</option>
              {uniqueBanks.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
            <input
              placeholder="Account number"
              value={bankDetails.accountNumber}
              onChange={(e) =>
                setBankDetails({ ...bankDetails, accountNumber: e.target.value })
              }
            />
            <input
              placeholder="Account name"
              value={bankDetails.accountName}
              onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
            />
            <div className="modal-actions">
              <div />
              <button type="button" onClick={handleWithdraw} disabled={withdrawLoading}>
                {withdrawLoading ? "Submitting…" : "Submit request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
