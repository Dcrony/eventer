import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";

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
      btnLink: "/create-event",
    },
    "no-search-results": {
      icon: "🔍",
      title: "No Events Found",
      subtitle: `We couldn't find events matching "${searchTerm}"`,
      description: "Try adjusting your search terms or browse all events.",
      btnText: "Clear Search",
      btnIcon: Search,
      btnLink: "/",
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
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <div className="relative max-w-md text-center">
        {/* Floating decorative dots */}
        <div className="absolute -top-6 -left-6 h-3 w-3 rounded-full bg-pink-200 opacity-60 animate-pulse" />
        <div className="absolute -bottom-4 -right-4 h-2 w-2 rounded-full bg-pink-300 opacity-40 animate-pulse delay-300" />
        <div className="absolute top-1/2 -right-8 h-1.5 w-1.5 rounded-full bg-pink-400 opacity-30 animate-pulse delay-700" />

        {/* Icon */}
        <div className="mb-5 text-6xl">{config.icon}</div>

        {/* Title */}
        <h2 className="mb-2 text-xl font-extrabold text-gray-900">{config.title}</h2>

        {/* Subtitle */}
        <p className="mb-2 text-sm font-medium text-gray-600">{config.subtitle}</p>

        {/* Description */}
        <p className="mx-auto mb-6 max-w-sm text-sm text-gray-400">{config.description}</p>

        {/* CTA Button */}
        {config.btnText && (
          <Link
            to={config.btnLink}
            className="inline-flex items-center gap-2 rounded-full bg-pink-500 px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 shadow-md shadow-pink-500/25"
          >
            <BtnIcon size={18} />
            {config.btnText}
          </Link>
        )}

        {/* Secondary action */}
        {type === "no-events" && (
          <p className="mt-4 text-xs text-gray-400">
            or{" "}
            <Link to="/" className="font-semibold text-pink-500 hover:text-pink-600 transition-colors">
              browse from other organizers
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}