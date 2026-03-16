import { Link } from "react-router-dom";
import { Calendar, MapPin, Ticket } from "lucide-react";

export default function EventCard({ event }) {
  const formatDate = (dateString) => {
    if (!dateString) return "Date TBD";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatPrice = (price) => {
    if (price === 0 || !price) return "Free";
    return `From ₦${price.toLocaleString()}`;
  };

  // Get the lowest ticket price if there are multiple ticket types
  const getLowestPrice = () => {
    if (event.ticketTypes && event.ticketTypes.length > 0) {
      const prices = event.ticketTypes.map(t => t.price);
      return Math.min(...prices);
    }
    return event.ticketPrice || 0;
  };

  return (
    <Link to={`/events/${event._id}`} className="event-card">
      <div className="event-card-image-wrapper">
        <img
          src={event.banner || "https://via.placeholder.com/400x200/ec4899/ffffff?text=Event"}
          alt={event.title}
          className="event-card-image"
          loading="lazy"
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/400x200/ec4899/ffffff?text=Event";
          }}
        />
        {event.category && (
          <span className="event-card-category">{event.category}</span>
        )}
      </div>
      <div className="event-card-content">
        <h3 className="event-card-title">{event.title}</h3>
        <div className="event-card-details">
          <div className="event-card-detail">
            <Calendar size={14} />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="event-card-detail">
            <MapPin size={14} />
            <span>{event.location || "Online Event"}</span>
          </div>
        </div>
        <div className="event-card-footer">
          <div className="event-card-price">
            <Ticket size={16} />
            <span>{formatPrice(getLowestPrice())}</span>
          </div>
          <span className="event-card-arrow">→</span>
        </div>
      </div>
    </Link>
  );
}