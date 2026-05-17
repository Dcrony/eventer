import { useEffect, useState } from "react";
import API from "../api/axios";
import EventCard from "../components/EventCard";
import { Heart, SearchX } from "lucide-react";

export default function Favorites() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await API.get("/favorites");
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load favorites");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  return (
    <div className="min-h-full w-full bg-gray-50 font-geist ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Heart size={24} className="text-pink-500" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
              Favorites
            </h1>
          </div>
          <p className="text-sm text-gray-500">Your saved events in one place.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={fetchFavorites}
              className="mt-3 text-sm font-semibold text-pink-600"
            >
              Retry
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-pink-50 flex items-center justify-center mb-4">
              <SearchX size={40} className="text-pink-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No favorites yet</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Start saving events you're interested in by clicking the heart icon on any event card.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}