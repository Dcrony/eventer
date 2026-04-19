import { useEffect, useState, useMemo } from "react";
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
  AlertCircle,
  PlusCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import useProfileNavigation from "../hooks/useProfileNavigation";
import API from "../api/axios";
import { PORT_URL } from "../utils/config";
import { getEventImageUrl, getProfileImageUrl } from "../utils/eventHelpers";
import { getCurrentUser } from "../utils/auth";
import CreateEvent from "./CreateEvent";

import "./CSS/MyTickets.css";


export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [activeEventId, setActiveEventId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all, upcoming, past
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const user = getCurrentUser();
  const { toProfile } = useProfileNavigation();

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
    return tickets.filter((ticket) => {
      const event = ticket?.event;
      if (!event) return false;

      const matchesSearch =
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase());

      const eventDate = new Date(event.startDate);
      const now = new Date();

      if (filter === "upcoming") return matchesSearch && eventDate >= now;
      if (filter === "past") return matchesSearch && eventDate < now;
      return matchesSearch;
    });
  }, [tickets, searchQuery, filter]);

  return (
    <div className="dashboard-page my-tickets-page">
      <div className="dashboard-container">
        <header className="my-tickets-header">
          <div className="my-tickets-header-top">
            <div className="my-tickets-heading">
              <h1 className="dashboard-title">My Tickets</h1>
              <p className="dashboard-subtitle">
                Manage your event access and digital passes
              </p>
            </div>
            <div className="my-tickets-actions">
              <button
                type="button"
                className="my-tickets-btn my-tickets-btn--create"
                onClick={() => setShowCreateEvent(true)}
              >
                <PlusCircle size={18} />
                Create event
              </button>
              {(user?.role === "organizer" || user?.role === "admin") && (
                <Link to="/scanner" className="scanner-btn">
                  <QrCode size={18} />
                  Ticket Scanner
                </Link>
              )}
            </div>
          </div>
          <div className="search-filter-controls">
            <div className="search-input-wrapper">
              <Search size={18} className="search-input-icon" aria-hidden />
              <input
                type="search"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="my-tickets-search-input"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="my-tickets-filter-select"
            >
              <option value="all">All Tickets</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past Events</option>
            </select>
          </div>
        </header>

        {filteredTickets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎟️</div>
            <h3>
              {searchQuery ? "No tickets match your search" : "No tickets yet"}
            </h3>
            <p>
              {searchQuery
                ? "Try adjusting your filters or search terms."
                : "You haven't purchased any tickets. Discover amazing events happening near you!"}
            </p>
            {!searchQuery && (
              <div className="empty-state-actions">
                <Link to="/events" className="browse-btn">
                  Browse events
                </Link>
                <button
                  type="button"
                  className="browse-btn browse-btn--outline"
                  onClick={() => setShowCreateEvent(true)}
                >
                  <PlusCircle size={18} />
                  Create an event
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="tickets-grid">
            {filteredTickets.map((ticket) => {
              const event = ticket?.event;
              if (!event) return null;

              const isPast = new Date(event.startDate) < new Date();

              return (
                <div
                  key={ticket._id}
                  className={`ticket-card ${isPast ? "past-ticket" : ""}`}
                >
                  {/* Event Visual */}
                  <div className="ticket-visual">
                    {getEventImageUrl(event) ? (
                      <img
                        src={getEventImageUrl(event)}
                        alt={event.title}
                        className="event-image"
                      />
                    ) : (
                      <div
                        className="event-image-placeholder"
                        style={{
                          background: "var(--primary-gradient)",
                          width: "100%",
                          height: "100%",
                        }}
                      ></div>
                    )}

                    {event.liveStream?.isLive && !isPast && (
                      <div className="live-badge-glow">🔴 LIVE NOW</div>
                    )}

                    <div className="ticket-overlay">
                      <h3 className="event-title">{event.title}</h3>
                      <div
                        className="creator-info"
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          toProfile(event.createdBy);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toProfile(event.createdBy);
                          }
                        }}
                      >
                        {getProfileImageUrl(event.createdBy) ? (
                          <img
                            src={getProfileImageUrl(event.createdBy)}
                            alt={event.createdBy.username}
                            className="creator-avatar"
                          />
                        ) : (
                          <div className="avatar-fallback">
                            <User size={14} />
                          </div>
                        )}
                        <span className="creator-name">
                          by {event.createdBy?.username || "Organizer"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Body */}
                  <div className="ticket-body">
                    <div className="ticket-details">
                      <div className="detail-row">
                        <span className="detail-label">When</span>
                        <div className="detail-row-main">
                          <span className="detail-when-line">
                            <Calendar size={15} className="detail-icon" aria-hidden />
                            {event.startDate
                              ? new Date(event.startDate).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "TBD"}
                          </span>
                          {event.startDate ? (
                            <span className="detail-when-time">
                              <Clock size={14} className="detail-icon" aria-hidden />
                              {new Date(event.startDate).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Where</span>
                        <div className="detail-row-main detail-location">
                          <MapPin size={15} className="detail-icon detail-icon--pin" aria-hidden />
                          <span>{event.location}</span>
                        </div>
                      </div>
                      <div className="detail-row detail-row--split">
                        <div className="detail-split-cell">
                          <span className="detail-label">Passes</span>
                          <div className="detail-row-main detail-passes">
                            <Ticket size={15} className="detail-icon" aria-hidden />
                            <span className="detail-passes-text">
                              {ticket.quantity}{" "}
                              {ticket.quantity === 1 ? "ticket" : "tickets"}
                            </span>
                          </div>
                        </div>
                        <div className="detail-split-cell">
                          <span className="detail-label">Paid</span>
                          <div className="detail-row-main detail-price">
                            ₦{(ticket.amount ?? 0).toLocaleString("en-NG")}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="ticket-footer-actions">
                      {ticket.qrCode ? (
                        <div className="qr-preview" title="Your entry QR code">
                          <img
                            src={`${PORT_URL}/uploads/${ticket.qrCode}`}
                            alt={`Check-in QR for ${event.title}`}
                            className="qr-image-small"
                          />
                          <span className="qr-hint">Show at entry</span>
                        </div>
                      ) : null}

                      <div className="ticket-actions">
                        {ticket.qrCode ? (
                          <a
                            href={`${PORT_URL}/uploads/${ticket.qrCode}`}
                            download={`ticket-${ticket._id}.png`}
                            className="btn-premium btn-primary"
                          >
                            <Download size={18} /> Download
                          </a>
                        ) : null}

                        {event.liveStream?.isLive && !isPast && (
                          <Link
                            to={`/live/${event._id}`}
                            className="btn-premium btn-secondary"
                          >
                            <MessageSquare size={18} /> Watch
                          </Link>
                        )}

                        <Link
                          to={`/Eventdetail/${event._id}`}
                          className="btn-premium btn-secondary btn-ghost"
                        >
                          <ExternalLink size={18} />
                          Event page
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

      <CreateEvent
        isOpen={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
      />
    </div>
  );
}
