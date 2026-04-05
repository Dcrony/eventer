import { Link } from "react-router-dom";
import { Calendar, MapPin, Ticket } from "lucide-react";

const PORT_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8080/api"
).replace(/\/api\/?$/, "");

export default function EventCard({ event }) {
  const formatDate = (dateString) => {
    if (!dateString) return "Date TBD";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Date TBD";
    }
  };

  const formatPrice = (price) => {
    if (price === 0 || !price) return "Free";
    return `From ₦${price.toLocaleString()}`;
  };

  // Get the lowest ticket price from pricing array or ticketPrice
  const getLowestPrice = () => {
    if (Array.isArray(event.pricing) && event.pricing.length > 0) {
      const prices = event.pricing.map(t => t.price || 0);
      return Math.min(...prices);
    }
    if (event.ticketTypes && event.ticketTypes.length > 0) {
      const prices = event.ticketTypes.map(t => t.price);
      return Math.min(...prices);
    }
    return event.ticketPrice || 0;
  };

  // Get image URL - handle both demo events (banner) and hosted uploads (image)
  const getImageUrl = () => {
    if (event.banner) {
      return event.banner; // Demo events use direct Unsplash URLs
    }
    if (event.image) {
      return `${PORT_URL}/uploads/event_image/${event.image}`;
    }
    return "https://via.placeholder.com/400x200/ec4899/ffffff?text=Event";
  };

  // Get event date - handle both startDate and date fields
  const getEventDate = () => {
    return event.startDate || event.date;
  };

  return (
    <Link to={`/Eventdetail/${event._id}`} className="event-card">
      <div className="event-card-image-wrapper">
        <img
          src={getImageUrl()}
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
            <span>{formatDate(getEventDate())}</span>
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