import { useEffect, useState, useContext, useMemo } from "react";
import {
  Ticket,
  Calendar,
  MapPin,
  Download,
  MessageSquare,
  Search,
  ExternalLink,
  QrCode,
  Clock,
  User,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import API from "../api/axios";

import { ThemeContext } from "../contexts/ThemeContexts";
import "./CSS/MyTickets.css";

const PORT_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [activeEventId, setActiveEventId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all, upcoming, past
  const { darkMode } = useContext(ThemeContext);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    API.get("/tickets/my-tickets")
      .then((res) => setTickets(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handleJoinChat = (eventId) => {
    setActiveEventId(eventId);
    setShowChat(true);
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const event = ticket?.event;
      if (!event) return false;

      const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase());

      const eventDate = new Date(event.startDate);
      const now = new Date();

      if (filter === "upcoming") return matchesSearch && eventDate >= now;
      if (filter === "past") return matchesSearch && eventDate < now;
      return matchesSearch;
    });
  }, [tickets, searchQuery, filter]);

  return (
    <div className={`dashboard-page ${darkMode ? "dark-mode" : ""}`}>
      <div className="dashboard-container">
        <div className="dashboard-title-section">
          <div>
            <h1 className="dashboard-title">My Tickets</h1>
            <p className="dashboard-subtitle">Manage your event access and digital passes</p>
          </div>
          <div className="search-filter-controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="search-input-wrapper" style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '0.6rem 1rem 0.6rem 2.5rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass-bg)',
                  color: 'inherit',
                  outline: 'none',
                  minWidth: '250px'
                }}
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: '0.75rem',
                border: '1px solid var(--glass-border)',
                background: 'var(--glass-bg)',
                color: 'inherit',
                outline: 'none'
              }}
            >
              <option value="all">All Tickets</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past Events</option>
            </select>
          </div>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎟️</div>
            <h3>{searchQuery ? "No tickets match your search" : "No tickets yet"}</h3>
            <p>{searchQuery ? "Try adjusting your filters or search terms." : "You haven't purchased any tickets. Discover amazing events happening near you!"}</p>
            {!searchQuery && (
              <Link to="/" className="browse-btn">Browse Events</Link>
            )}
          </div>
        ) : (
          <div className="tickets-grid">
            {filteredTickets.map((ticket) => {
              const event = ticket?.event;
              if (!event) return null;

              const isPast = new Date(event.startDate) < new Date();

              return (
                <div key={ticket._id} className={`ticket-card ${isPast ? 'past-ticket' : ''}`}>
                  {/* Event Visual */}
                  <div className="ticket-visual">
                    {event.image ? (
                      <img
                        src={`${PORT_URL}/uploads/event_image/${event.image}`}
                        alt={event.title}
                        className="event-image"
                      />
                    ) : (
                      <div className="event-image-placeholder" style={{ background: 'var(--primary-gradient)', width: '100%', height: '100%' }}></div>
                    )}

                    {event.liveStream?.isLive && !isPast && (
                      <div className="live-badge-glow">🔴 LIVE NOW</div>
                    )}

                    <div className="ticket-overlay">
                      <h3 className="event-title">{event.title}</h3>
                      <div className="creator-info">
                        {event.createdBy?.profilePic ? (
                          <img
                            src={`${PORT_URL}/uploads/profile_pic/${event.createdBy.profilePic}`}
                            alt={event.createdBy.username}
                            className="creator-avatar"
                          />
                        ) : (
                          <div className="avatar-fallback">
                            <User size={14} />
                          </div>
                        )}
                        <span className="creator-name">by {event.createdBy?.username || "Organizer"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Body */}
                  <div className="ticket-body">
                    <div className="ticket-details">
                      <div className="detail-item">
                        <span className="detail-label">Date & Time</span>
                        <div className="detail-value text-sm">
                          <Calendar size={14} className="text-pink-500" />
                          {event.startDate
                            ? new Date(event.startDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                            : "TBD"}
                        </div>
                        <div className="detail-value text-xs text-gray-500 ml-5">
                          <Clock size={12} />
                          {event.startDate
                            ? new Date(event.startDate).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                            : ""}
                        </div>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Location</span>
                        <div className="detail-value">
                          <MapPin size={14} className="text-pink-500" />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {event.location}
                          </span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Quantity</span>
                        <div className="detail-value">
                          <Ticket size={14} className="text-pink-500" />
                          {ticket.quantity} Ticket{ticket.quantity > 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Total Paid</span>
                        <div className="detail-value font-bold">
                          ₦{(event.ticketPrice || 0) * (ticket.quantity || 1)}
                        </div>
                      </div>
                    </div>

                    {/* QR Preview & Actions */}
                    <div className="ticket-footer-actions" style={{ marginTop: '0.5rem' }}>
                      {ticket.qrCode && (
                        <div className="qr-preview" title="Click to view/download QR">
                          <img
                            src={`${PORT_URL}/uploads/${ticket.qrCode}`}
                            alt="Ticket QR Code"
                            className="qr-image-small"
                          />
                        </div>
                      )}

                      <div className="ticket-actions">
                        <a
                          href={`${PORT_URL}/uploads/${ticket.qrCode}`}
                          download={`ticket-${ticket._id}.png`}
                          className="btn-premium btn-primary"
                        >
                          <Download size={18} /> Download
                        </a>

                        {event.liveStream?.isLive && !isPast && (
                          <Link
                            to={`/live/${event._id}`}
                            className="btn-premium btn-secondary"
                          >
                            <MessageSquare size={18} /> Watch
                          </Link>
                        )}

                        <Link to={`/events/${event._id}`} className="btn-premium btn-secondary" style={{ padding: '0.75rem' }}>
                          <ExternalLink size={18} />
                        </Link>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}