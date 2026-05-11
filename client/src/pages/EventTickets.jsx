import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Search, MoreVertical, RefreshCw, AlertTriangle, CheckCircle, XCircle, Ticket } from "lucide-react";
import API from "../api/axios";
import useFeatureAccess from "../hooks/useFeatureAccess";
import UpgradeModal from "../components/UpgradeModal";
import { formatCurrency, formatDate } from "../utils/eventHelpers";
// import "./CSS/EventTickets.css";

export default function EventTickets() {
    const { eventId } = useParams();
    const [tickets, setTickets] = useState([]);
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [refundingTicket, setRefundingTicket] = useState(null);
    const [checkingInTicket, setCheckingInTicket] = useState(null);
    const [resendingTicket, setResendingTicket] = useState(null);

    const { hasAccess: canRefund } = useFeatureAccess("refunds");

    useEffect(() => {
        fetchEventAndTickets();
    }, [eventId]);

    const fetchEventAndTickets = async () => {
        try {
            setLoading(true);
            setError(null);

            const [eventRes, ticketsRes] = await Promise.all([
                API.get(`/events/${eventId}`),
                API.get(`/events/${eventId}/tickets`)
            ]);

            setEvent(eventRes.data);
            setTickets(ticketsRes.data || []);
        } catch (err) {
            console.error("Failed to load event tickets", err);
            setError(err.response?.data?.message || "Failed to load tickets");
        } finally {
            setLoading(false);
        }
    };

    const handleRefund = async (ticketId) => {
        if (!canRefund) {
            setShowUpgradeModal(true);
            return;
        }

        if (!confirm("Are you sure you want to refund this ticket? This action cannot be undone.")) {
            return;
        }

        try {
            setRefundingTicket(ticketId);
            await API.post(`/tickets/${ticketId}/refund`);
            // Refresh tickets after refund
            await fetchEventAndTickets();
            alert("Ticket refunded successfully");
        } catch (err) {
            console.error("Failed to refund ticket", err);
            alert(err.response?.data?.message || "Failed to refund ticket");
        } finally {
            setRefundingTicket(null);
        }
    };

    const handleCheckIn = async (ticketId) => {
        try {
            setCheckingInTicket(ticketId);
            await API.post(`/tickets/${ticketId}/checkin`);
            // Refresh tickets after check-in
            await fetchEventAndTickets();
            alert("Ticket checked in successfully");
        } catch (err) {
            console.error("Failed to check in ticket", err);
            alert(err.response?.data?.message || "Failed to check in ticket");
        } finally {
            setCheckingInTicket(null);
        }
    };

    const handleResendEmail = async (ticketId) => {
        try {
            setResendingTicket(ticketId);
            await API.post(`/tickets/${ticketId}/resend`);
            alert("Ticket email resent successfully");
        } catch (err) {
            console.error("Failed to resend ticket email", err);
            alert(err.response?.data?.message || "Failed to resend ticket email");
        } finally {
            setResendingTicket(null);
        }
    };

    const handleExportCSV = () => {
        const headers = ["Buyer Name", "Email", "Ticket Type", "Price", "Purchase Date", "Status"];
        const csvContent = [
            headers.join(","),
            ...filteredTickets.map(ticket => [
                `"${ticket.buyer?.name || "Unknown"}"`,
                `"${ticket.buyer?.email || ""}"`,
                `"${ticket.ticketType || ""}"`,
                ticket.price || 0,
                `"${formatDate(ticket.createdAt)}"`,
                ticket.status || "active"
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${event?.title || "event"}-tickets.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = ticket.buyer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.buyer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.ticketType?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || (ticket.status || "active") === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="event-tickets-page">
                <div className="dashboard-container">
                    <div className="loading-state">
                        <RefreshCw className="animate-spin" size={24} />
                        <p>Loading tickets...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="event-tickets-page">
                <div className="dashboard-container">
                    <div className="error-state">
                        <AlertTriangle size={24} />
                        <p>{error}</p>
                        <button onClick={fetchEventAndTickets} className="retry-btn">
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="event-tickets-page">
            <div className="dashboard-container">
                {/* Header */}
                <div className="page-header">
                    <div className="header-left">
                        <Link to="/dashboard" className="back-link">
                            <ArrowLeft size={20} />
                            Back to Dashboard
                        </Link>
                        <div>
                            <h1>{event?.title} - Tickets</h1>
                            <div className="tickets-stats">
                                <span>{tickets.length} total tickets</span>
                                <span>{tickets.filter(t => (t.status || 'active') === 'active').length} active</span>
                                <span>{tickets.filter(t => t.status === 'checked-in').length} checked in</span>
                                <span>{tickets.filter(t => t.status === 'refunded').length} refunded</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="search-section">
                    <div className="search-input-wrapper">
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or ticket type..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <div className="filters-wrapper">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="status-filter"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="checked-in">Checked In</option>
                            <option value="refunded">Refunded</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <button onClick={handleExportCSV} className="export-btn">
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Tickets Table */}
                <div className="tickets-table-container">
                    <table className="tickets-table">
                        <thead>
                            <tr>
                                <th>Buyer</th>
                                <th>Ticket Type</th>
                                <th>Price</th>
                                <th>Purchase Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTickets.map((ticket) => (
                                <tr key={ticket._id}>
                                    <td>
                                        <div className="buyer-info">
                                            <div className="buyer-name">{ticket.buyer?.name || "Unknown"}</div>
                                            <div className="buyer-email">{ticket.buyer?.email}</div>
                                        </div>
                                    </td>
                                    <td>{ticket.ticketType}</td>
                                    <td>{formatCurrency(ticket.price)}</td>
                                    <td>{formatDate(ticket.createdAt)}</td>
                                    <td>
                                        <span className={`status-badge ${ticket.status || 'active'}`}>
                                            {ticket.status === 'refunded' ? (
                                                <>
                                                    <XCircle size={14} />
                                                    Refunded
                                                </>
                                            ) : ticket.status === 'checked-in' ? (
                                                <>
                                                    <CheckCircle size={14} />
                                                    Checked In
                                                </>
                                            ) : ticket.status === 'cancelled' ? (
                                                <>
                                                    <XCircle size={14} />
                                                    Cancelled
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle size={14} />
                                                    Active
                                                </>
                                            )}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="actions-menu">
                                            {(ticket.status === 'active' || !ticket.status) && (
                                                <button
                                                    onClick={() => handleCheckIn(ticket._id)}
                                                    disabled={checkingInTicket === ticket._id}
                                                    className="checkin-btn"
                                                >
                                                    {checkingInTicket === ticket._id ? (
                                                        <RefreshCw size={14} className="animate-spin" />
                                                    ) : (
                                                        "Check In"
                                                    )}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleResendEmail(ticket._id)}
                                                disabled={resendingTicket === ticket._id}
                                                className="resend-btn"
                                            >
                                                {resendingTicket === ticket._id ? (
                                                    <RefreshCw size={14} className="animate-spin" />
                                                ) : (
                                                    "Resend"
                                                )}
                                            </button>
                                            {ticket.status !== 'refunded' && ticket.price > 0 && (
                                                <button
                                                    onClick={() => handleRefund(ticket._id)}
                                                    disabled={refundingTicket === ticket._id}
                                                    className="refund-btn"
                                                >
                                                    {refundingTicket === ticket._id ? (
                                                        <RefreshCw size={14} className="animate-spin" />
                                                    ) : (
                                                        "Refund"
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredTickets.length === 0 && (
                        <div className="empty-state">
                            <Ticket size={48} />
                            <h3>No tickets found</h3>
                            <p>
                                {searchTerm
                                    ? "Try adjusting your search terms"
                                    : "No tickets have been sold for this event yet"
                                }
                            </p>
                        </div>
                    )}
                </div>

                {/* Upgrade Modal */}
                <UpgradeModal
                    open={showUpgradeModal}
                    onClose={() => setShowUpgradeModal(false)}
                    featureName="refunds"
                />
            </div>
        </div>
    );
}