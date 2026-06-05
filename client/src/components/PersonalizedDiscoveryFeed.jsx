import React, { useEffect, useState } from "react";
import {
  Loader2,
  TrendingUp,
  MapPin,
  Sparkles,
} from "lucide-react";
import API from "../api/axios";
import EventCard from "./EventCard";

/**
 * PersonalizedDiscoveryFeed - displays event recommendations with fallback strategy
 */
export default function PersonalizedDiscoveryFeed({ limit = 10 }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [source, setSource] = useState(""); // "personalized", "trending", "featured", "nearby"

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        if (!token) {
          // Not logged in, show trending/featured
          const { data } = await API.get("/discovery/trending", {
            params: { limit },
          });
          setEvents(data.events || []);
          setSource("trending");
          return;
        }

        // Logged in user - get personalized feed
        const { data } = await API.get("/discovery/feed", {
          params: { limit },
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data.events && data.events.length > 0) {
          setEvents(data.events);
          setSource("personalized");
        } else {
          // Fallback to trending if no personalized recommendations
          const { data: trendingData } = await API.get("/discovery/trending", {
            params: { limit },
          });
          setEvents(trendingData.events || []);
          setSource("trending");
        }
      } catch (err) {
        console.error("Failed to fetch discovery feed:", err);
        setError("Failed to load recommendations");
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [limit]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
        <p className="text-red-600 font-semibold mb-3">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-full bg-pink-500 text-white text-sm font-semibold hover:bg-pink-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <p className="text-gray-500">No events found. Check back soon!</p>
      </div>
    );
  }

  const getSourceBadge = () => {
    switch (source) {
      case "personalized":
        return {
          icon: Sparkles,
          label: "Just For You",
          color: "text-purple-600 bg-purple-50",
          borderColor: "border-purple-200",
        };
      case "trending":
        return {
          icon: TrendingUp,
          label: "Trending Now",
          color: "text-orange-600 bg-orange-50",
          borderColor: "border-orange-200",
        };
      case "nearby":
        return {
          icon: MapPin,
          label: "Nearby Events",
          color: "text-blue-600 bg-blue-50",
          borderColor: "border-blue-200",
        };
      case "featured":
        return {
          icon: Sparkles,
          label: "Featured",
          color: "text-pink-600 bg-pink-50",
          borderColor: "border-pink-200",
        };
      default:
        return {
          icon: Sparkles,
          label: "Recommended",
          color: "text-gray-600 bg-gray-50",
          borderColor: "border-gray-200",
        };
    }
  };

  const badge = getSourceBadge();
  const BadgeIcon = badge.icon;

  return (
    <div>
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-4 ${badge.color} ${badge.borderColor}`}>
        <BadgeIcon size={14} className="flex-shrink-0" />
        <span className="text-xs font-bold uppercase tracking-wide">{badge.label}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {events.map((event) => (
          <EventCard key={event._id} event={event} />
        ))}
      </div>
    </div>
  );
}
