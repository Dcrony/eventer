import { useEffect, useState } from "react";
import API from "../api/axios";
import { Link } from "react-router-dom";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);
    API.get("/events")
      .then((res) => {
        setEvents(res.data);
        setFilteredEvents(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load events. Please try again.");
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
     <div className="max-w-7xl mx-auto pt-16 pl-64 px-6">
       {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-center text-indigo-600 mb-8">
        TickiSpot
      </h1>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">❌ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Search */}
          <div className="mb-6">
              <input
                type="text"
                placeholder="Search events by title or location..."
                value={searchTerm}
                onChange={(e) => {
                  const term = e.target.value;
                  setSearchTerm(term);
                  const filtered = events.filter(event =>
                    event.title.toLowerCase().includes(term.toLowerCase()) ||
                    event.location.toLowerCase().includes(term.toLowerCase())
                  );
                  setFilteredEvents(filtered);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

          {/* No results */}
          {filteredEvents.length === 0 && searchTerm && (
            <p className="text-center text-gray-500">
              No events found matching <span className="font-semibold">"{searchTerm}"</span>
            </p>
          )}
          {filteredEvents.length === 0 && !searchTerm && (
            <p className="text-center text-gray-500">No events yet.</p>
          )}

          {/* Events grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event._id}
                className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden"
              >
                <Link to={`/eventdetail/${event._id}`} className="block">
                  {/* Creator info */}
                  <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                    <img
                      src={`${
                        import.meta.env.VITE_API_URL?.replace("/api", "") ||
                        "http://localhost:5000"
                      }/uploads/${event.createdBy?.profilePic}`}
                      alt={event.createdBy?.username || "Creator"}
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div
                      className="hidden w-10 h-10 rounded-full bg-gray-300 items-center justify-center text-gray-700 font-bold"
                    >
                      {event.createdBy?.username?.charAt(0) || "U"}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800">{event.title}</h2>
                  </div>

                  {/* Event image */}
                  {event.image && (
                    <img
                      src={`${
                        import.meta.env.VITE_API_URL?.replace("/api", "") ||
                        "http://localhost:5000"
                      }/uploads/event_image/${event.image}`}
                      alt={`${event.title} poster`}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  )}

                  {/* Event details */}
                  <div className="p-4">
                    <p className="text-gray-600 mb-2">
                      📍 {event.location} •{" "}
                      {new Date(event.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-gray-700">💰 Price: ₦{event.ticketPrice}</p>
                    <p className="text-gray-700">🎟 Tickets Left: {event.totalTickets}</p>

                    {event.liveStream?.isLive && (
                      <div className="mt-4">
                        <span className="inline-block px-3 py-1 bg-red-500 text-white rounded-full text-sm font-medium">
                          🔴 LIVE NOW
                        </span>
                        {event.liveStream.streamType === "YouTube" && (
                          <iframe
                            width="100%"
                            height="200"
                            src={event.liveStream.streamURL.replace("watch?v=", "embed/")}
                            title="YouTube Live Stream"
                            frameBorder="0"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                            className="mt-2 rounded-lg"
                          ></iframe>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
     </div>
    </div>
  );
}
