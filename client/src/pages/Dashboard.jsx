import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import { Link, useNavigate } from "react-router-dom";
import "./CSS/Dashboard.css";
import EditEvent from "../components/EditEvent";
import { getCurrentUser } from "../utils/auth";
import {
  ArrowRight,
  PlusCircle,
  LayoutDashboard,
  Ticket,
  BarChart3,
  Radio,
  Calendar,
  MapPin,
  Users,
  Wallet,
} from "lucide-react";
import CreateEvent from "./CreateEvent";
import { ticketNetToOrganizer } from "../utils/transactions";
import { getEventImageUrl } from "../utils/eventHelpers";
import { MoreVertical } from "lucide-react";


export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  // 🟢 For Modal Control
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);

  const [banks, setBanks] = useState([]);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);


  const [bankDetails, setBankDetails] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
    bankCode: "",
  });

  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const user = useMemo(() => getCurrentUser(), []);

  // 🟢 Functions
  const handleEditClick = (id) => {
    setSelectedEventId(id);
    setEditModalOpen(true);
  };

  const handleModalClose = () => {
    setEditModalOpen(false);
    setSelectedEventId(null);
  };

  const handleEventUpdated = () => {
    API.get("/events/my-events").then((res) => setEvents(res.data));
  };

  // 🧩 Fetch dashboard data
  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      API.get("/events/my-events"),
      API.get("/stats/stats", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      API.get("/organizer/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]).then(([eventsRes, statsRes, transactionRes]) => {
      setEvents(eventsRes.data);
      setStats(statsRes.data);
      setTransactions(transactionRes.data);
      setLoading(false);

    });
  }, [token, user]);

  useEffect(() => {
    API.get("/banks").then((res) => {
      setBanks(res.data);
    });
  }, []);

  // ✅ FIX: Remove duplicate banks based on bank code
  const uniqueBanks = useMemo(() => {
    const seen = new Set();
    return banks.filter(bank => {
      if (seen.has(bank.code)) return false;
      seen.add(bank.code);
      return true;
    });
  }, [banks]);

  const handleWithdraw = async () => {
    if (!withdrawAmount || withdrawAmount <= 0) {
      return alert("Enter valid amount");
    }

    if (
      !bankDetails.bankCode ||
      !bankDetails.accountNumber ||
      !bankDetails.accountName
    ) {
      return alert("Complete bank details");
    }

    try {
      setWithdrawLoading(true);

      await API.post(
        "/organizer/withdraw",
        {
          amount: Number(withdrawAmount),
          paymentMethod: "bank",
          bankDetails,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Withdrawal submitted ✅");
      setShowWithdrawModal(false);
      setWithdrawAmount("");

      const res = await API.get("/organizer/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTransactions(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Withdrawal failed");
    } finally {
      setWithdrawLoading(false);
    }
  };

  // 🟢 Toggle Live Event
  const toggleLive = async (id, currentStatus) => {
    try {
      await API.patch("/events/toggle-live", {
        eventId: id,
        isLive: !currentStatus,
      });
      setEvents(
        events.map((ev) =>
          ev._id === id
            ? {
              ...ev,
              liveStream: { ...ev.liveStream, isLive: !currentStatus },
            }
            : ev,
        ),
      );

      if (!currentStatus) {
        navigate(`/live/${id}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to toggle live status");
    }
  };

  // 🗑 Delete Event
  const handleDelete = async (id) => {
    const eventToDelete = events.find((e) => e._id === id);
    const confirmed = window.confirm(
      `Are you sure you want to delete "${eventToDelete?.title}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      await API.delete(`/events/delete/${id}`);
      setEvents(events.filter((e) => e._id !== id));
      alert("Event deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to delete event. Please try again.");
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className={`stat-tile ${color}`}>
      <div className="stat-tile-content">
        <div className="stat-label">{title}</div>
        <div className="stat-value">{value}</div>
      </div>
      <div className="stat-tile-icon-wrapper">
        <Icon size={24} className="stat-tile-icon" />
      </div>
    </div>
  );

  const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return "0";
    return new Intl.NumberFormat("en-NG").format(num);
  };

  const latestTransactions = transactions.slice(0, 3);

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <div className="dashboard-title">Organizer Dashboard</div>
            <div className="dashboard-subtitle">
              Welcome back{user?.username ? `, ${user.username}` : ""}. Manage
              your events, sales, and live sessions.
            </div>
          </div>

          <div className="dashboard-actions">
            <Link to="/events" className="dash-btn">
              Browse events <ArrowRight size={18} />
            </Link>
            <button
              className="dash-btn dash-btn-primary"
              onClick={() => setShowCreateEvent(true)}
            >
              Create event <PlusCircle size={18} />
            </button>
            <button
              className="dash-btn dash-btn-primary"
              onClick={() => setShowWithdrawModal(true)}
            >
              Withdraw Funds
            </button>
          </div>
        </div>

        {/* 🔄 Loading */}
        {loading && (
          <div className="dash-card">
            <div className="dash-card-body">
              <p>Loading dashboard...</p>
            </div>
          </div>
        )}

        {/* ❌ Error */}
        {error && (
          <div className="dash-card">
            <div className="dash-card-body">
              <p
                style={{
                  color: "#dc2626",
                  fontWeight: 800,
                  marginBottom: "0.75rem",
                }}
              >
                {error}
              </p>
              <button
                className="dash-btn"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* 📊 Stats */}
        {!loading && !error && stats && (
          <div className="stats-container-grid">
            <StatCard
              title="Total Events"
              value={stats.totalEvents}
              icon={LayoutDashboard}
              color="blue"
            />
            <StatCard
              title="Tickets Sold"
              value={formatNumber(stats.totalTicketsSold)}
              icon={Ticket}
              color="pink"
            />
            <StatCard
              title="Revenue"
              value={`₦${formatNumber(stats.totalRevenue)}`}
              icon={BarChart3}
              color="green"
            />
            <StatCard
              title="Live Sessions"
              value={stats.currentlyLive}
              icon={Radio}
              color="red"
            />
            <StatCard
              title="Available Balance"
              value={`₦${formatNumber(stats.availableBalance || 0)}`}
              icon={Wallet}
              color="green"
            />
            <StatCard
              title="Pending Balance"
              value={`₦${formatNumber(stats.pendingBalance || 0)}`}
              icon={Wallet}
              color="green"
            />
          </div>
        )}

        {!loading && !error && stats && stats.topEvents?.length > 0 && (
          <div className="dash-card top-events-card">
            <div className="dash-card-header">
              <div className="dash-card-title">Top Performing Events</div>
            </div>
            <div className="dash-card-body">
              <div className="top-events-list">
                {stats.topEvents.map((event, i) => (
                  <div key={i} className="top-event-item">
                    <div className="top-event-rank">#{i + 1}</div>
                    <div className="top-event-info">
                      <div className="top-event-name">{event.title}</div>
                      <div className="top-event-sales">
                        {formatNumber(
                          event.quantitySold || event.ticketsSold || 0,
                        )}{" "}
                        tickets sold
                      </div>
                    </div>
                    <div className="top-event-progress">
                      <div
                        className="top-event-progress-bar"
                        style={{
                          width: `${Math.min(100, ((event.quantitySold || event.ticketsSold || 0) / (stats.totalTicketsSold || 1)) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="dash-card" style={{ marginTop: "2rem" }}>
          <div className="dash-card-header">
            <div className="dash-card-title">Transaction History</div>
          </div>

          <div className="dash-card-body">
            {transactions.length === 0 ? (
              <p>No transactions yet.</p>
            ) : (
              <div className="transaction-table">
                {latestTransactions.map((tx) => (
                  <div key={tx._id} className="transaction-row">
                    <div>
                      <strong>{tx.type.toUpperCase()}</strong>
                      <div className="tx-date">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div>₦{formatNumber(ticketNetToOrganizer(tx))}</div>

                    <div className={`tx-status ${tx.status}`}>{tx.status}</div>
                  </div>
                ))}
                <Link to="/transactions" className="view-all-transactions">
                  View All Transactions <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 🎫 Events */}
        {!loading && !error && (
          <>
            <div className="section-title">Your events</div>
            {events.length === 0 ? (
              <div className="dash-card empty-state-card">
                <div className="dash-card-body">
                  <p className="empty-state-p">
                    You haven't created any events yet. Ready to host your first
                    one?
                  </p>
                  <div style={{ marginTop: "1rem" }}>
                    <button
                      onClick={() => setShowCreateEvent(true)}
                      className="dash-btn dash-btn-primary"
                    >
                      Create Your First Event <PlusCircle size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="events-grid">
                {events.map((event) => (
                  <div key={event._id} className="event-card">
                    {getEventImageUrl(event) && (
                      <div className="event-card-header">
  <div />
  {/* menu goes here */}
</div>
                      <img
                        src={getEventImageUrl(event)}
                        alt={event.title}
                        className="event-cover"
                      />
                    )}

                    <div className="event-body">
                      <div className="event-title-row">
                        <div className="event-title">{event.title}</div>
                        {event.liveStream?.isLive && (
                          <span className="event-badge-live">LIVE</span>
                        )}
                      </div>

                      <div className="event-meta">
                        {event.description || "No description provided."}
                      </div>
                      <div className="event-meta-grid">
                        <div className="event-meta-item">
                          <Calendar size={14} className="meta-icon" />
                          <span>
                            {new Date(event.startDate).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              },
                            )}{" "}
                            • {event.startTime}
                          </span>
                        </div>
                        <div className="event-meta-item">
                          <MapPin size={14} className="meta-icon" />
                          <span>{event.location}</span>
                        </div>
                        <div className="event-meta-item">
                          <Users size={14} className="meta-icon" />
                          <span>
                            {event.ticketsSold}/{event.totalTickets} tickets
                            sold
                          </span>
                        </div>
                      </div>
                    </div>


                    <div className="event-menu-wrapper">
                      <button
                        className="menu-trigger"
                        onClick={() =>
                          setOpenMenuId(openMenuId === event._id ? null : event._id)
                        }
                      >
                        <MoreVertical size={18} />
                      </button>

                      {openMenuId === event._id && (
                        <div className="event-menu">
                          <button
                            onClick={() => {
                              toggleLive(event._id, event.liveStream?.isLive);
                              setOpenMenuId(null);
                            }}
                            className="menu-item primary"
                          >
                            {event.liveStream?.isLive ? "Stop Live" : "Go Live"}
                          </button>

                          <button
                            onClick={() => {
                              handleEditClick(event._id);
                              setOpenMenuId(null);
                            }}
                            className="menu-item"
                          >
                            Edit
                          </button>

                          <Link
                            to={`/events/${event._id}/analytics`}
                            className="menu-item"
                            onClick={() => setOpenMenuId(null)}
                          >
                            Analytics
                          </Link>

                          <div className="menu-divider" />

                          <button
                            onClick={() => {
                              handleDelete(event._id);
                              setOpenMenuId(null);
                            }}
                            className="menu-item danger"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      {/* ✅ Place the EditEvent modal here once */}
      <EditEvent
        isOpen={editModalOpen}
        onClose={handleModalClose}
        eventId={selectedEventId}
        onEventUpdated={handleEventUpdated}
      />
      {/* ✅ Create Event Modal */}
      <CreateEvent
        isOpen={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
      />
      {showWithdrawModal && (
        <div className="modal-overlay">
          <div className="withdraw-modal">
            <button className="close-btn" onClick={() => setShowWithdrawModal(false)}>
              ✕
            </button>
            <h3>Request Withdrawal</h3>

            <div className="withdraw-balance">
              Available Balance: ₦{formatNumber(stats?.availableBalance || 0)}
            </div>

            <input
              type="number"
              placeholder="Enter amount"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
            />

            <label>Payment Method</label>
            {/* ✅ FIX: Use uniqueBanks instead of banks and ensure unique keys */}
            <select
              value={bankDetails.bankCode}
              onChange={(e) => {
                const selected = uniqueBanks.find(
                  (b) => b.code === e.target.value
                );

                if (selected) {
                  setBankDetails({
                    ...bankDetails,
                    bankCode: selected.code,
                    bankName: selected.name,
                  });
                }
              }}
            >
              <option value="">Select Bank</option>
              {uniqueBanks.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>

            <input
              placeholder="Account Number"
              value={bankDetails.accountNumber}
              onChange={(e) =>
                setBankDetails({
                  ...bankDetails,
                  accountNumber: e.target.value,
                })
              }
            />

            <input
              placeholder="Account Name"
              value={bankDetails.accountName}
              onChange={(e) =>
                setBankDetails({
                  ...bankDetails,
                  accountName: e.target.value,
                })
              }
            />


            <div className="modal-actions">
              <div></div>
              <button onClick={handleWithdraw} disabled={withdrawLoading}>
                {withdrawLoading ? "Processing..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
