import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Search, RefreshCw, AlertTriangle,
  CheckCircle, XCircle, Ticket,
} from "lucide-react";
import API from "../api/axios";
import useFeatureAccess from "../hooks/useFeatureAccess";
import UpgradeModal from "../components/UpgradeModal";
import { formatCurrency, formatDate } from "../utils/eventHelpers";

// ── Design tokens ─────────────────────────────────────────────────────────
const T = {
  bg:         "#f7f7f9",
  surface:    "#ffffff",
  border:     "#e8e8ed",
  borderSoft: "#f0f0f5",
  pink:       "#f43f8e",
  pinkDeep:   "#e11d74",
  pinkSoft:   "rgba(244,63,142,0.08)",
  pinkMid:    "rgba(244,63,142,0.16)",
  pinkGlow:   "rgba(244,63,142,0.22)",
  ink:        "#111118",
  body:       "#374151",
  muted:      "#9ca3af",
  faint:      "#e5e7eb",
  green:      "#10b981",
  greenSoft:  "rgba(16,185,129,0.1)",
  greenMid:   "rgba(16,185,129,0.25)",
  red:        "#ef4444",
  redSoft:    "rgba(239,68,68,0.08)",
  redMid:     "rgba(239,68,68,0.2)",
  amber:      "#f59e0b",
  amberSoft:  "rgba(245,158,11,0.08)",
  amberMid:   "rgba(245,158,11,0.2)",
  radius:     "0.875rem",
  radiusLg:   "1.25rem",
  radiusXl:   "1.5rem",
  pill:       "999px",
  shadow:     "0 4px 16px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)",
  shadowSm:   "0 1px 3px rgba(0,0,0,0.06)",
  font:       "'Geist', -apple-system, BlinkMacSystemFont, sans-serif",
  t:          "180ms cubic-bezier(0.4,0,0.2,1)",
};

// ── Inject styles once ────────────────────────────────────────────────────
const etStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&display=swap');
  @keyframes etSpin { to { transform: rotate(360deg); } }
  .et-spin { animation: etSpin 0.7s linear infinite; }
  .et-back-link:hover { color: #f43f8e !important; }
  .et-search-input:focus {
    outline: none;
    border-color: #f43f8e !important;
    box-shadow: 0 0 0 3px rgba(244,63,142,0.08) !important;
  }
  .et-select:focus {
    outline: none;
    border-color: #f43f8e !important;
    box-shadow: 0 0 0 3px rgba(244,63,142,0.08) !important;
  }
  .et-table tbody tr:hover td { background: #fafafa !important; }
  .et-checkin-btn:hover:not(:disabled) { background: #059669 !important; color: #fff !important; border-color: #059669 !important; }
  .et-resend-btn:hover:not(:disabled)  { background: #111118 !important; color: #fff !important; border-color: #111118 !important; }
  .et-refund-btn:hover:not(:disabled)  { background: #dc2626 !important; color: #fff !important; border-color: #dc2626 !important; }
  .et-export-btn:hover { background: #f43f8e !important; border-color: #f43f8e !important; color: #fff !important; }
  .et-retry-btn:hover  { background: #e11d74 !important; }
`;
if (typeof document !== "undefined" && !document.getElementById("et-styles")) {
  const el = document.createElement("style");
  el.id = "et-styles";
  el.textContent = etStyle;
  document.head.appendChild(el);
}

// ── Status badge ──────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = status || "active";
  let bg, color, border, Icon;

  if (s === "refunded")   { bg = T.redSoft;   color = T.red;   border = T.redMid;   Icon = XCircle;      }
  else if (s === "checked-in") { bg = T.greenSoft; color = T.green; border = T.greenMid; Icon = CheckCircle; }
  else if (s === "cancelled")  { bg = T.amberSoft; color = T.amber; border = T.amberMid; Icon = XCircle;    }
  else                         { bg = T.greenSoft; color = T.green; border = T.greenMid; Icon = CheckCircle; }

  const label = s === "checked-in" ? "Checked In" : s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.3rem",
      height: "1.6rem", padding: "0 0.6rem", borderRadius: T.pill,
      fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.03em",
      background: bg, color, border: `1px solid ${border}`,
      whiteSpace: "nowrap",
    }}>
      <Icon size={12} /> {label}
    </span>
  );
}

// ── Action button ─────────────────────────────────────────────────────────
function ActionBtn({ className, onClick, disabled, children }) {
  return (
    <button className={className} onClick={onClick} disabled={disabled}
      style={{
        height: "1.85rem", padding: "0 0.75rem", borderRadius: T.pill,
        border: `1.5px solid ${T.border}`,
        background: T.surface, color: T.body,
        fontFamily: T.font, fontSize: "0.75rem", fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: `all ${T.t}`, display: "inline-flex", alignItems: "center", gap: "0.3rem",
        opacity: disabled ? 0.6 : 1,
      }}>
      {children}
    </button>
  );
}

export default function EventTickets() {
  const { eventId } = useParams();
  const [tickets, setTickets] = useState([]);
  const [event,   setEvent]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const [searchTerm,    setSearchTerm]    = useState("");
  const [statusFilter,  setStatusFilter]  = useState("all");
  const [showUpgradeModal,  setShowUpgradeModal]  = useState(false);
  const [refundingTicket,   setRefundingTicket]   = useState(null);
  const [checkingInTicket,  setCheckingInTicket]  = useState(null);
  const [resendingTicket,   setResendingTicket]   = useState(null);

  const { hasAccess: canRefund } = useFeatureAccess("refunds");

  useEffect(() => { fetchEventAndTickets(); }, [eventId]);

  const fetchEventAndTickets = async () => {
    try {
      setLoading(true); setError(null);
      const [eventRes, ticketsRes] = await Promise.all([
        API.get(`/events/${eventId}`),
        API.get(`/events/${eventId}/tickets`),
      ]);
      setEvent(eventRes.data);
      setTickets(ticketsRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (ticketId) => {
    if (!canRefund) { setShowUpgradeModal(true); return; }
    if (!confirm("Are you sure you want to refund this ticket? This action cannot be undone.")) return;
    try {
      setRefundingTicket(ticketId);
      await API.post(`/tickets/${ticketId}/refund`);
      await fetchEventAndTickets();
      alert("Ticket refunded successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to refund ticket");
    } finally { setRefundingTicket(null); }
  };

  const handleCheckIn = async (ticketId) => {
    try {
      setCheckingInTicket(ticketId);
      await API.post(`/tickets/${ticketId}/checkin`);
      await fetchEventAndTickets();
      alert("Ticket checked in successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to check in ticket");
    } finally { setCheckingInTicket(null); }
  };

  const handleResendEmail = async (ticketId) => {
    try {
      setResendingTicket(ticketId);
      await API.post(`/tickets/${ticketId}/resend`);
      alert("Ticket email resent successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to resend ticket email");
    } finally { setResendingTicket(null); }
  };

  const handleExportCSV = () => {
    const headers = ["Buyer Name", "Email", "Ticket Type", "Price", "Purchase Date", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredTickets.map((t) => [
        `"${t.buyer?.name || "Unknown"}"`,
        `"${t.buyer?.email || ""}"`,
        `"${t.ticketType || ""}"`,
        t.price || 0,
        `"${formatDate(t.createdAt)}"`,
        t.status || "active",
      ].join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${event?.title || "event"}-tickets.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.buyer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.buyer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ticketType?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || (t.status || "active") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ── Loading state ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        fontFamily: T.font, minHeight: "100vh", background: T.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: "0.85rem", color: T.muted, textAlign: "center",
      }}>
        <RefreshCw size={24} className="et-spin" style={{ color: T.pink }} />
        <p style={{ margin: 0, fontSize: "0.9rem" }}>Loading tickets…</p>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{
        fontFamily: T.font, minHeight: "100vh", background: T.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: "0.85rem", color: T.muted, textAlign: "center",
      }}>
        <AlertTriangle size={24} style={{ color: T.amber }} />
        <p style={{ margin: 0, fontSize: "0.9rem", color: T.body }}>{error}</p>
        <button className="et-retry-btn" onClick={fetchEventAndTickets}
          style={{
            height: "2.25rem", padding: "0 1.25rem", borderRadius: T.pill,
            border: "none", background: T.pink, color: "#fff",
            fontFamily: T.font, fontSize: "0.82rem", fontWeight: 600,
            cursor: "pointer", transition: `background ${T.t}`,
          }}>
          Try Again
        </button>
      </div>
    );
  }

  // ── Ticket counts ─────────────────────────────────────────────────────
  const totalCount     = tickets.length;
  const activeCount    = tickets.filter((t) => (t.status || "active") === "active").length;
  const checkedInCount = tickets.filter((t) => t.status === "checked-in").length;
  const refundedCount  = tickets.filter((t) => t.status === "refunded").length;

  return (
            <div className="min-h-screen w-screen bg-[#f7f7f9] pl-[var(--sidebar-width,0px)]">

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "2rem 1rem 4rem" }}>

        {/* Page header */}
        <div style={{ marginBottom: "1.75rem" }}>
          <Link to="/dashboard" className="et-back-link"
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.35rem",
              fontSize: "0.82rem", fontWeight: 600, color: T.muted,
              textDecoration: "none", marginBottom: "0.85rem",
              transition: `color ${T.t}`,
            }}>
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>
          <h1 style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.75rem)", fontWeight: 800, letterSpacing: "-0.03em", color: T.ink, margin: "0 0 0.5rem" }}>
            {event?.title} – Tickets
          </h1>
          {/* Stats pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {[
              { label: `${totalCount} total`,      bg: T.faint,     color: T.body  },
              { label: `${activeCount} active`,    bg: T.greenSoft, color: T.green },
              { label: `${checkedInCount} checked in`, bg: T.pinkSoft, color: T.pink },
              { label: `${refundedCount} refunded`, bg: T.redSoft,  color: T.red   },
            ].map((s) => (
              <span key={s.label} style={{
                display: "inline-flex", alignItems: "center",
                height: "1.6rem", padding: "0 0.7rem", borderRadius: T.pill,
                fontSize: "0.72rem", fontWeight: 700, background: s.bg, color: s.color,
              }}>{s.label}</span>
            ))}
          </div>
        </div>

        {/* Search + filters */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: "0.75rem",
          alignItems: "center", marginBottom: "1.25rem",
        }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 260px" }}>
            <Search size={17} style={{
              position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)",
              color: T.muted, pointerEvents: "none",
            }} />
            <input className="et-search-input"
              type="text"
              placeholder="Search by name, email, or ticket type…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%", height: "2.75rem",
                paddingLeft: "2.6rem", paddingRight: "1rem",
                borderRadius: T.pill, border: `1.5px solid ${T.border}`,
                background: T.surface, fontFamily: T.font, fontSize: "0.88rem",
                color: T.ink, boxSizing: "border-box",
                transition: `border-color ${T.t}, box-shadow ${T.t}`,
              }} />
          </div>
          {/* Status filter */}
          <select className="et-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              height: "2.75rem", padding: "0 2.5rem 0 1rem",
              borderRadius: T.pill, border: `1.5px solid ${T.border}`,
              background: T.surface,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat", backgroundPosition: "right 0.85rem center",
              appearance: "none",
              fontFamily: T.font, fontSize: "0.85rem", color: T.body,
              transition: `border-color ${T.t}, box-shadow ${T.t}`,
            }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="checked-in">Checked In</option>
            <option value="refunded">Refunded</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {/* Export */}
          <button className="et-export-btn" onClick={handleExportCSV}
            style={{
              height: "2.75rem", padding: "0 1.25rem", borderRadius: T.pill,
              border: `1.5px solid ${T.border}`,
              background: T.surface, color: T.body,
              fontFamily: T.font, fontSize: "0.82rem", fontWeight: 600,
              cursor: "pointer", transition: `all ${T.t}`, whiteSpace: "nowrap",
            }}>
            Export CSV
          </button>
        </div>

        {/* Tickets table */}
        <div style={{
          background: T.surface, border: `1.5px solid ${T.border}`,
          borderRadius: T.radiusXl, overflow: "hidden", boxShadow: T.shadowSm,
        }}>
          <div style={{ overflowX: "auto" }}>
            <table className="et-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
              <thead>
                <tr>
                  {["Buyer", "Ticket Type", "Price", "Purchase Date", "Status", "Actions"].map((h) => (
                    <th key={h} style={{
                      padding: "0.85rem 1rem", textAlign: "left",
                      fontSize: "0.68rem", textTransform: "uppercase",
                      letterSpacing: "0.06em", color: T.muted, fontWeight: 700,
                      background: "#fafafa", borderBottom: `1.5px solid ${T.borderSoft}`,
                      whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket._id}>
                    <td style={{ padding: "0.85rem 1rem", borderBottom: `1px solid ${T.borderSoft}` }}>
                      <div style={{ fontWeight: 700, color: T.ink, fontSize: "0.88rem" }}>
                        {ticket.buyer?.name || "Unknown"}
                      </div>
                      <div style={{ fontSize: "0.76rem", color: T.muted, marginTop: "0.1rem" }}>
                        {ticket.buyer?.email}
                      </div>
                    </td>
                    <td style={{ padding: "0.85rem 1rem", borderBottom: `1px solid ${T.borderSoft}`, color: T.body }}>
                      {ticket.ticketType}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", borderBottom: `1px solid ${T.borderSoft}`, fontWeight: 600, color: T.ink }}>
                      {formatCurrency(ticket.price)}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", borderBottom: `1px solid ${T.borderSoft}`, color: T.muted, fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", borderBottom: `1px solid ${T.borderSoft}` }}>
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td style={{ padding: "0.85rem 1rem", borderBottom: `1px solid ${T.borderSoft}` }}>
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                        {(ticket.status === "active" || !ticket.status) && (
                          <ActionBtn className="et-checkin-btn"
                            onClick={() => handleCheckIn(ticket._id)}
                            disabled={checkingInTicket === ticket._id}>
                            {checkingInTicket === ticket._id
                              ? <RefreshCw size={13} className="et-spin" />
                              : "Check In"}
                          </ActionBtn>
                        )}
                        <ActionBtn className="et-resend-btn"
                          onClick={() => handleResendEmail(ticket._id)}
                          disabled={resendingTicket === ticket._id}>
                          {resendingTicket === ticket._id
                            ? <RefreshCw size={13} className="et-spin" />
                            : "Resend"}
                        </ActionBtn>
                        {ticket.status !== "refunded" && ticket.price > 0 && (
                          <ActionBtn className="et-refund-btn"
                            onClick={() => handleRefund(ticket._id)}
                            disabled={refundingTicket === ticket._id}>
                            {refundingTicket === ticket._id
                              ? <RefreshCw size={13} className="et-spin" />
                              : "Refund"}
                          </ActionBtn>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {filteredTickets.length === 0 && (
            <div style={{ padding: "4rem 2rem", textAlign: "center", color: T.muted }}>
              <Ticket size={48} style={{ opacity: 0.25, marginBottom: "0.85rem" }} />
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: T.body, margin: "0 0 0.3rem" }}>
                No tickets found
              </h3>
              <p style={{ fontSize: "0.85rem", margin: 0 }}>
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "No tickets have been sold for this event yet"}
              </p>
            </div>
          )}
        </div>

        <UpgradeModal
          open={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          featureName="refunds"
        />
      </div>
    </div>
  );
}