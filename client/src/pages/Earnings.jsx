import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import { ArrowRight, Banknote, Info, Receipt, Wallet } from "lucide-react";
import { getEventImageUrl } from "../utils/eventHelpers";

// ── Design tokens (TickiSpot) ─────────────────────────────────────────────
const T = {
  bg:          "#f7f7f9",
  surface:     "#ffffff",
  border:      "#e8e8ed",
  borderSoft:  "#f0f0f5",
  pink:        "#f43f8e",
  pinkDeep:    "#e11d74",
  pinkSoft:    "rgba(244,63,142,0.08)",
  pinkMid:     "rgba(244,63,142,0.16)",
  pinkGlow:    "rgba(244,63,142,0.22)",
  ink:         "#111118",
  body:        "#374151",
  muted:       "#9ca3af",
  faint:       "#e5e7eb",
  red:         "#dc2626",
  radius:      "0.875rem",
  radiusLg:    "1.25rem",
  radiusXl:    "1.5rem",
  pill:        "999px",
  shadow:      "0 4px 16px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)",
  shadowSm:    "0 1px 3px rgba(0,0,0,0.06)",
  font:        "'Geist', -apple-system, BlinkMacSystemFont, sans-serif",
  t:           "180ms cubic-bezier(0.4,0,0.2,1)",
};

// ── Inject styles once ────────────────────────────────────────────────────
const earningsStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&display=swap');
  .earn-dash-btn {
    display: inline-flex; align-items: center; gap: 0.4rem;
    height: 2.25rem; padding: 0 1rem; border-radius: 999px;
    border: 1.5px solid #e8e8ed; background: #ffffff;
    font-family: 'Geist', sans-serif; font-size: 0.82rem; font-weight: 600;
    color: #374151; text-decoration: none; cursor: pointer;
    transition: all 180ms ease;
  }
  .earn-dash-btn:hover { border-color: #f43f8e; color: #f43f8e; }
  .earn-dash-btn-primary {
    background: #f43f8e; border-color: #f43f8e; color: #fff;
  }
  .earn-dash-btn-primary:hover { background: #e11d74 !important; border-color: #e11d74 !important; }
  .earn-dash-btn-secondary {
    background: #111118; border-color: #111118; color: #fff;
  }
  .earn-dash-btn-secondary:hover { opacity: 0.85; }
  .earn-table tr:hover td { background: #fafafa; }
  .earn-retry-btn:hover { background: #e11d74 !important; }
  .earn-modal-submit:hover:not(:disabled) { background: #e11d74 !important; transform: translateY(-1px); }
  .earn-modal-close:hover { background: #f0f0f5 !important; }
  .earn-select, .earn-input {
    width: 100%; padding: 0.75rem 1rem;
    border-radius: 0.875rem; border: 1.5px solid #e8e8ed;
    background: #ffffff; color: #111118;
    font-family: 'Geist', sans-serif; font-size: 0.9rem;
    outline: none; transition: all 180ms ease; box-sizing: border-box;
    margin-bottom: 0.75rem;
  }
  .earn-select:focus, .earn-input:focus {
    border-color: #f43f8e;
    box-shadow: 0 0 0 3px rgba(244,63,142,0.08);
  }
`;
if (typeof document !== "undefined" && !document.getElementById("earn-styles")) {
  const el = document.createElement("style");
  el.id = "earn-styles";
  el.textContent = earningsStyle;
  document.head.appendChild(el);
}

// ── Stat card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, hint, highlight }) {
  return (
    <div style={{
      border: `1px solid ${highlight ? "rgba(236,72,153,0.35)" : T.border}`,
      borderRadius: T.radiusLg,
      background: highlight
        ? "linear-gradient(135deg, rgba(236,72,153,0.08), rgba(255,255,255,0.92))"
        : T.surface,
      boxShadow: T.shadowSm,
      padding: "1.15rem 1.25rem",
      display: "flex", flexDirection: "column", gap: "0.35rem",
    }}>
      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </span>
      <span style={{ fontSize: "1.35rem", fontWeight: 800, color: T.ink, letterSpacing: "-0.02em" }}>
        {value}
      </span>
      {hint && (
        <span style={{ fontSize: "0.8rem", color: T.muted, lineHeight: 1.4 }}>{hint}</span>
      )}
    </div>
  );
}

// ── Dashboard card shell ──────────────────────────────────────────────────
function DashCard({ title, children, noPad }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: T.radiusLg, boxShadow: T.shadowSm, overflow: "hidden",
    }}>
      {title && (
        <div style={{
          padding: "1rem 1.25rem", borderBottom: `1px solid ${T.borderSoft}`,
          fontSize: "0.88rem", fontWeight: 700, color: T.ink,
        }}>
          {title}
        </div>
      )}
      <div style={noPad ? {} : { padding: "1.25rem" }}>{children}</div>
    </div>
  );
}

// ── Modal overlay ─────────────────────────────────────────────────────────
function Modal({ onClose, title, subtitle, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem",
    }}>
      <div style={{
        background: T.surface, borderRadius: T.radiusXl,
        border: `1.5px solid ${T.border}`, boxShadow: T.shadow,
        padding: "1.75rem", width: "100%", maxWidth: 420,
        position: "relative",
      }}>
        <button className="earn-modal-close" onClick={onClose}
          style={{
            position: "absolute", top: "1rem", right: "1rem",
            width: 28, height: 28, borderRadius: "50%",
            border: "none", background: "transparent",
            fontSize: "1rem", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: T.muted, transition: `background ${T.t}`,
          }}>✕</button>

        <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: T.ink, margin: "0 0 0.35rem" }}>{title}</h3>
        {subtitle && (
          <p style={{ fontSize: "0.85rem", color: T.muted, marginBottom: "0.75rem", lineHeight: 1.5 }}>{subtitle}</p>
        )}
        {children}
      </div>
    </div>
  );
}

export default function Earnings() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const [payoutAccount,        setPayoutAccount]        = useState(null);
  const [payoutAccountLoading, setPayoutAccountLoading] = useState(false);
  const [banks,                setBanks]                = useState([]);

  const [showWithdrawModal,       setShowWithdrawModal]       = useState(false);
  const [showConnectAccountModal, setShowConnectAccountModal] = useState(false);
  const [withdrawAmount,          setWithdrawAmount]          = useState("");
  const [withdrawLoading,         setWithdrawLoading]         = useState(false);
  const [connectLoading,          setConnectLoading]          = useState(false);
  const [bankDetails, setBankDetails] = useState({ bankName: "", accountNumber: "", accountName: "", bankCode: "" });

  const uniqueBanks = useMemo(() => {
    const seen = new Set();
    return banks.filter((b) => { if (seen.has(b.code)) return false; seen.add(b.code); return true; });
  }, [banks]);

  const loadEarnings = () => {
    setLoading(true);
    setError(null);
    API.get("/organizer/earnings")
      .then((res) => { setData(res.data); setLoading(false); })
      .catch((err) => { setError(err.response?.data?.message || "Could not load earnings"); setLoading(false); });
  };

  const loadPayoutAccount = () => {
    setPayoutAccountLoading(true);
    API.get("/organizer/payout/account")
      .then((res) => { setPayoutAccount(res.data); setPayoutAccountLoading(false); })
      .catch((err) => { if (err.response?.status === 404) setPayoutAccount(null); setPayoutAccountLoading(false); });
  };

  useEffect(() => { loadEarnings(); loadPayoutAccount(); }, []);
  useEffect(() => { API.get("/banks").then((res) => setBanks(res.data || [])).catch(() => {}); }, []);

  const fmt = (n) => {
    if (n === null || n === undefined || Number.isNaN(Number(n))) return "0";
    return new Intl.NumberFormat("en-NG").format(Number(n));
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || Number(withdrawAmount) <= 0) return alert("Enter a valid amount");
    try {
      setWithdrawLoading(true);
      await API.post("/organizer/withdraw", { amount: Number(withdrawAmount) });
      alert("Withdrawal request submitted successfully");
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      loadEarnings();
    } catch (err) {
      if (err.response?.data?.code === "PAYOUT_ACCOUNT_REQUIRED") {
        alert("Please connect a payout account first");
        setShowWithdrawModal(false);
        setShowConnectAccountModal(true);
        return;
      }
      alert(err.response?.data?.message || "Withdrawal failed");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleConnectPayoutAccount = async () => {
    if (!bankDetails.bankCode || !bankDetails.accountNumber || !bankDetails.accountName)
      return alert("Please complete all bank details");
    try {
      setConnectLoading(true);
      await API.post("/organizer/payout/connect", bankDetails);
      alert("Payout account connected successfully!");
      setShowConnectAccountModal(false);
      setBankDetails({ bankName: "", accountNumber: "", accountName: "", bankCode: "" });
      loadPayoutAccount();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to connect payout account");
    } finally {
      setConnectLoading(false);
    }
  };

  const minW       = data?.minWithdrawalAmount ?? 1000;
  const platformPct = data?.platformTicketFeePercent ?? 10;

  // ── Shared button style ────────────────────────────────────────────────
  const submitBtnStyle = {
    marginTop: "1rem", width: "100%", height: "2.75rem",
    fontFamily: T.font, fontSize: "0.9rem", fontWeight: 700,
    border: "none", borderRadius: T.pill,
    background: T.pink, color: "#fff",
    cursor: "pointer", transition: `all ${T.t}`,
    boxShadow: `0 4px 14px ${T.pinkGlow}`,
  };

  return (
        <div className="min-h-screen w-screen bg-[#f7f7f9] pt-8 lg:pl-[var(--sidebar-width,0px)]">

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "2rem 1rem 4rem" }}>

        {/* Page header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.75rem" }}>
          <div>
            <h1 style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", fontWeight: 800, letterSpacing: "-0.03em", color: T.ink, margin: "0 0 0.25rem" }}>
              Earnings
            </h1>
            <p style={{ fontSize: "0.88rem", color: T.muted, margin: 0 }}>
              Track ticket revenue and what you can withdraw.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <Link to="/transactions" className="earn-dash-btn"><Receipt size={15} /> Transactions <ArrowRight size={15} /></Link>
            <Link to="/dashboard"    className="earn-dash-btn"><Wallet  size={15} /> Dashboard    <ArrowRight size={15} /></Link>
          </div>
        </div>

        {/* Loading */}
        {loading && (
  <div className="space-y-4 animate-pulse">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 bg-white rounded-2xl border border-gray-200" />
      ))}
    </div>
    <div className="h-12 bg-white rounded-xl border border-gray-200" />
    <div className="h-64 bg-white rounded-2xl border border-gray-200" />
  </div>
)}

        {/* Error */}
        {error && (
          <DashCard>
            <p style={{ color: T.red, fontWeight: 700, margin: "0 0 0.75rem" }}>{error}</p>
            <button type="button" className="earn-dash-btn earn-retry-btn"
              style={{ background: T.pink, borderColor: T.pink, color: "#fff", transition: `background ${T.t}` }}
              onClick={loadEarnings}>
              Retry
            </button>
          </DashCard>
        )}

        {!loading && !error && data && (
          <>
            {/* Summary grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              <StatCard
                label={<><Receipt size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />Gross ticket sales</>}
                value={`₦${fmt(data.grossTicketSales)}`}
                hint="Total ticket revenue across your events."
              />
              <StatCard
                label="Net after platform fee"
                value={`₦${fmt(data.netAfterSalesCommission)}`}
                hint="Your share of ticket sales after the platform fee."
              />
              <StatCard highlight
                label={<><Wallet size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />Available to withdraw</>}
                value={`₦${fmt(data.availableBalance)}`}
                hint="Ready to withdraw to your bank account."
              />
              <StatCard
                label={<><Banknote size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />Total withdrawn</>}
                value={`₦${fmt(data.totalWithdrawn)}`}
                hint="Lifetime completed payouts."
              />
            </div>

            {/* Info strip */}
            <div style={{
              display: "flex", gap: "0.65rem", padding: "0.85rem 1rem",
              borderRadius: T.radius,
              background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.18)",
              color: T.body, fontSize: "0.82rem", marginBottom: "1.5rem", lineHeight: 1.6,
            }}>
              <Info size={18} style={{ flexShrink: 0, marginTop: "0.1rem", color: "#f59e0b" }} />
              <div>
                {platformPct > 0 ? (
                  <><strong>{platformPct}%</strong> of each ticket sale is retained by the platform; your earnings and withdrawable balance are shown after that fee. </>
                ) : <>No platform fee is applied to ticket sales. </>}
                Minimum withdrawal when approved: <strong>₦{fmt(minW)}</strong>.
                {data.pendingWithdrawalAmount > 0 && <> You have <strong>₦{fmt(data.pendingWithdrawalAmount)}</strong> in pending withdrawal requests.</>}
                {data.totalWithdrawn > 0 && <> Lifetime completed withdrawals: <strong>₦{fmt(data.totalWithdrawn)}</strong>.</>}
              </div>
            </div>

            {/* Payout account + withdraw action */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center", marginBottom: "1.5rem" }}>
              {payoutAccount ? (
                <>
                  <div style={{ fontSize: "0.9rem", color: T.muted }}>
                    <strong style={{ color: T.ink }}>Payout Account:</strong>{" "}
                    {payoutAccount.accountName} · {payoutAccount.bankName} · {payoutAccount.accountNumber}
                  </div>
                  <button type="button" className="earn-dash-btn earn-dash-btn-primary"
                    onClick={() => setShowWithdrawModal(true)}>
                    <Banknote size={16} /> Withdraw
                  </button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: "0.9rem", color: T.red, fontWeight: 600 }}>No payout account connected</div>
                  <button type="button" className="earn-dash-btn earn-dash-btn-secondary"
                    onClick={() => setShowConnectAccountModal(true)}>
                    Connect Bank Account
                  </button>
                </>
              )}
            </div>

            {/* Earnings by event */}
            <DashCard title="Earnings by event" noPad>
              {data.perEvent.length === 0 ? (
                <p style={{ padding: "1.25rem", color: T.muted, fontSize: "0.85rem", margin: 0 }}>
                  No events yet. Create an event and sell tickets to see breakdown here.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="earn-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                    <thead>
                      <tr>
                        {["Event", "Tickets", "Net"].map((h) => (
                          <th key={h} style={{
                            padding: "0.75rem 1rem", textAlign: "left",
                            fontSize: "0.72rem", textTransform: "uppercase",
                            letterSpacing: "0.05em", color: T.muted,
                            fontWeight: 700, background: "rgba(15,23,42,0.03)",
                            borderBottom: `1px solid rgba(15,23,42,0.06)`,
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.perEvent.map((row) => (
                        <tr key={String(row.eventId)}>
                          <td style={{ padding: "0.75rem 1rem", borderBottom: `1px solid rgba(15,23,42,0.06)` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                              {getEventImageUrl({ image: row.image }) ? (
                                <img src={getEventImageUrl({ image: row.image })} alt=""
                                  style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                              ) : (
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: T.faint, flexShrink: 0 }} />
                              )}
                              <span style={{ fontWeight: 700, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220 }} title={row.title}>
                                {row.title}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: "0.75rem 1rem", borderBottom: `1px solid rgba(15,23,42,0.06)`, color: T.body }}>
                            {fmt(row.ticketsSold)}
                          </td>
                          <td style={{ padding: "0.75rem 1rem", borderBottom: `1px solid rgba(15,23,42,0.06)` }}>
                            <strong style={{ color: T.ink }}>₦{fmt(row.netEarnings)}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DashCard>
          </>
        )}
      </div>

      {/* Withdraw modal */}
      {showWithdrawModal && data && payoutAccount && (
        <Modal
          onClose={() => setShowWithdrawModal(false)}
          title="Request withdrawal"
          subtitle={`Available: ₦${fmt(data.availableBalance)} · Min: ₦${fmt(minW)}${platformPct > 0 ? ` · Balances reflect the ${platformPct}% platform fee on ticket sales.` : "."}`}
        >
          <div style={{ padding: "0.75rem", background: T.bg, borderRadius: T.radius, marginBottom: "0.75rem" }}>
            <div style={{ fontSize: "0.8rem", color: T.muted, marginBottom: "0.25rem" }}>Payout Account</div>
            <div style={{ fontWeight: 500, fontSize: "0.9rem" }}>
              {payoutAccount.accountName} · {payoutAccount.bankName} · {payoutAccount.accountNumber}
            </div>
          </div>
          <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.35rem" }}>
            Amount to withdraw (₦)
          </label>
          <input className="earn-input" type="number" placeholder="Enter amount"
            value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
          <button type="button" className="earn-modal-submit"
            onClick={handleWithdraw} disabled={withdrawLoading}
            style={{ ...submitBtnStyle, opacity: withdrawLoading ? 0.6 : 1, cursor: withdrawLoading ? "not-allowed" : "pointer" }}>
            {withdrawLoading ? "Submitting…" : "Submit request"}
          </button>
        </Modal>
      )}

      {/* Connect account modal */}
      {showConnectAccountModal && (
        <Modal
          onClose={() => setShowConnectAccountModal(false)}
          title="Connect Payout Account"
          subtitle="Connect your bank account to receive payouts. This information will be securely stored and used for all future withdrawals."
        >
          <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.35rem" }}>
            Bank
          </label>
          <select className="earn-select"
            value={bankDetails.bankCode}
            onChange={(e) => {
              const selected = uniqueBanks.find((b) => b.code === e.target.value);
              if (selected) setBankDetails({ ...bankDetails, bankCode: selected.code, bankName: selected.name });
            }}>
            <option value="">Select bank</option>
            {uniqueBanks.map((bank) => (
              <option key={bank.code} value={bank.code}>{bank.name}</option>
            ))}
          </select>
          <input className="earn-input" placeholder="Account number"
            value={bankDetails.accountNumber}
            onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })} />
          <input className="earn-input" placeholder="Account name"
            value={bankDetails.accountName}
            onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })} />
          <button type="button" className="earn-modal-submit"
            onClick={handleConnectPayoutAccount} disabled={connectLoading}
            style={{ ...submitBtnStyle, opacity: connectLoading ? 0.6 : 1, cursor: connectLoading ? "not-allowed" : "pointer" }}>
            {connectLoading ? "Connecting…" : "Connect Account"}
          </button>
        </Modal>
      )}
    </div>
  );
}