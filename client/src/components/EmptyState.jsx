import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import "./css/EmptyState.css";

export default function EmptyState({ 
  type = "no-events", 
  searchTerm = null,
  onCreateClick = null 
}) {
  const configs = {
    "no-events": {
      icon: "🎉",
      title: "No Events Yet",
      subtitle: "Be the first to create an amazing event!",
      description: "Events bring people together. Start creating memorable experiences today.",
      btnText: "Create Event",
      btnIcon: Plus,
    },
    "no-search-results": {
      icon: "🔍",
      title: "No Events Found",
      subtitle: `We couldn't find events matching "${searchTerm}"`,
      description: "Try adjusting your search terms or browse all events.",
      btnText: "Clear Search",
      btnIcon: Search,
    },
    "no-live-events": {
      icon: "📡",
      title: "No Live Events",
      subtitle: "Check back soon for live events!",
      description: "Live events will appear here when they start.",
      btnText: null,
      btnIcon: null,
    },
  };

  const config = configs[type] || configs["no-events"];
  const BtnIcon = config.btnIcon;

  return (
    <div className="empty-state-wrapper">
      <div className="empty-state-container">
        {/* Icon */}
        <div className="empty-state-icon">{config.icon}</div>

        {/* Title */}
        <h2 className="empty-state-title">{config.title}</h2>

        {/* Subtitle */}
        <p className="empty-state-subtitle">{config.subtitle}</p>

        {/* Description */}
        <p className="empty-state-description">{config.description}</p>

        {/* Decorative elements */}
        <div className="empty-state-decorative">
          <div className="decoration-dot dot-1"></div>
          <div className="decoration-dot dot-2"></div>
          <div className="decoration-dot dot-3"></div>
        </div>

        {/* CTA Button */}
        {config.btnText && (
          type === "no-search-results" ? (
            <Link to="/" className="empty-state-btn primary">
              <BtnIcon size={18} />
              {config.btnText}
            </Link>
          ) : (
            <Link to="/create-event" className="empty-state-btn primary">
              <BtnIcon size={18} />
              {config.btnText}
            </Link>
          )
        )}

        {/* Secondary action */}
        {type === "no-events" && (
          <p className="empty-state-secondary">
            or <Link to="/" className="link-secondary">browse from other organizers</Link>
          </p>
        )}
      </div>
    </div>
  );
}
