import { useEffect, useState } from "react";
import API from "../api/axios";
import LiveChat from "../components/LiveChats"; 
import { useNavigate, useParams } from "react-router-dom";

export default function EventDetail() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState({});
  const [showChat, setShowChat] = useState(false);
  const [activeEventId, setActiveEventId] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const isLoggedIn = !!localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    API.get(`/events/${eventId}`)
      .then((res) => {
        setEvent(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [eventId]);

  const handleQuantityChange = (e, eventId) => {
    setBuying((prev) => ({ ...prev, [eventId]: e.target.value }));
  };

  const handleBuy = () => {
    const quantity = parseInt(buying[event._id]) || 1;
    if (!user || !user.email) {
      alert("Login required.");
      return;
    }
    navigate(`/checkout/${event._id}`, {
      state: { event, quantity, user },
    });
  };

  const handleJoinChat = (eventId) => {
    setActiveEventId(eventId);
    setShowChat(true);
  };

  if (loading) return <p className="text-center mt-10">Loading event...</p>;
  if (!event) return <p className="text-center mt-10">Event not found</p>;

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pl-64 px-6"> 
      {/* ✅ ml-64 (space for sidebar), mt-16 (space for navbar) */}

      <h1 className="text-2xl font-bold mb-4">Event Details</h1>

      <div className="bg-white shadow-lg rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-2">{event.title}</h2>
        <p className="text-gray-600 mb-2">{event.description}</p>
        <p className="text-gray-500">{event.location}</p>
        <p className="mt-1">
          Date: {new Date(event.date).toLocaleDateString()} at {event.time}
        </p>
        <p className="mt-1 font-medium">Price: ₦{event.ticketPrice}</p>
        <p className="mt-1 text-sm text-gray-600">
          Tickets Left: {event.totalTickets - event.ticketsSold}
        </p>

        {event.image && (
          <img
            src={`${
              import.meta.env.VITE_API_URL?.replace("/api", "") ||
              "http://localhost:5000"
            }/uploads/event_image/${event.image}`}
            alt={event.title}
            className="w-full max-h-[400px] object-cover rounded-lg mt-4"
          />
        )}

        {/* Live Stream */}
        {event.liveStream?.isLive && (
          <div className="mt-6">
            <strong className="text-red-600">🔴 LIVE NOW</strong>
            {event.liveStream.streamType === "YouTube" && (
              <iframe
                className="w-full h-[315px] mt-3 rounded-lg"
                src={event.liveStream.streamURL.replace("watch?v=", "embed/")}
                title="YouTube Live Stream"
                allow="autoplay; encrypted-media"
                allowFullScreen
              ></iframe>
            )}

            {event.liveStream.streamType === "Facebook" && (
              <div
                className="fb-video mt-3"
                data-href={event.liveStream.streamURL}
                data-width="500"
                data-allowfullscreen="true"
              ></div>
            )}

            <button
              onClick={() => handleJoinChat(event._id)}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Join Live Chat
            </button>
          </div>
        )}

        {/* Ticket Purchase */}
        {isLoggedIn && (
          <div className="mt-6 flex items-center gap-3">
            <input
              type="number"
              min="1"
              className="w-20 px-2 py-1 border rounded-lg"
              placeholder="Qty"
              value={buying[event._id] || "1"}
              onChange={(e) => handleQuantityChange(e, event._id)}
            />
            <button
              onClick={handleBuy}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              Buy Ticket
            </button>
          </div>
        )}

        {/* Live Chat */}
        {showChat && activeEventId === event._id && (
          <div className="mt-6">
            <LiveChat eventId={event._id} username={user?.username || "Guest"} />
          </div>
        )}
      </div>
    </div>
  );
}
