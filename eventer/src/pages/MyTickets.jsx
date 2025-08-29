import { useEffect, useState } from "react";
import API from "../api/axios";
import LiveChat from "../components/LiveChats"; // optional for live events

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [activeEventId, setActiveEventId] = useState(null);
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        🎟️ My Tickets
      </h2>

      {tickets.length === 0 ? (
        <p className="text-gray-500 text-lg">You haven’t purchased any tickets yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {tickets.map((ticket) => {
            const event = ticket.event;
            return (
              <div
                key={ticket._id}
                className="bg-white shadow-lg rounded-2xl p-5 border border-gray-200 hover:shadow-xl transition"
              >
                {/* Event Creator */}
                <div className="flex items-center gap-3 mb-4">
                  {event.createdBy?.profilePic && (
                    <img
                      src={`/uploads/${event.createdBy.profilePic}`}
                      alt={event.createdBy?.username || "Creator"}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <h3 className="text-xl font-semibold">{event.title}</h3>
                </div>

                {/* Event Image */}
                {event.image && (
                  <img
                    src={`${
                      import.meta.env.VITE_API_URL?.replace("/api", "") ||
                      "http://localhost:5000"
                    }/uploads/event_image/${event.image}`}
                    alt={event.title}
                    className="w-full h-52 object-cover rounded-lg mb-4"
                  />
                )}

                {/* Ticket Info */}
                <div className="space-y-2 text-gray-700">
                  <p>
                    <span className="font-medium">Quantity:</span> {ticket.quantity}
                  </p>
                  <p>
                    <span className="font-medium">Date:</span> {new Date(event.date).toLocaleString("en-US", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                    })} 
                    <span className="ml-2">• {event.location}</span>
                  </p>
                  <p>
                    <span className="font-medium">Price Paid:</span> ₦
                    {event.ticketPrice * ticket.quantity}
                  </p>
                </div>

                {/* Live Event */}
                {event.liveStream?.isLive && (
                  <div className="mt-4">
                    <span className="text-red-600 font-bold">🔴 LIVE NOW</span>
                    <button
                      onClick={() => handleJoinChat(event._id)}
                      className="ml-3 px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition"
                    >
                      Join Live Chat
                    </button>

                    {showChat && activeEventId === event._id && (
                      <div className="mt-3">
                        <LiveChat
                          eventId={event._id}
                          username={user?.username || "Guest"}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* QR Code */}
                {ticket.qrCode && (
                  <div className="mt-5 flex flex-col items-center">
                    <img
                      src={`${
                        import.meta.env.VITE_API_URL?.replace("/api", "") ||
                        "http://localhost:5000"
                      }/uploads/${ticket.qrCode}`}
                      alt="Ticket QR Code"
                      className="w-36 mb-3 rounded-md"
                    />
                    <a
                      href={`${
                        import.meta.env.VITE_API_URL?.replace("/api", "") ||
                        "http://localhost:5000"
                      }/uploads/${ticket.qrCode}`}
                      download={`ticket-${ticket._id}.png`}
                      className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                    >
                      ⬇️ Download QR
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
