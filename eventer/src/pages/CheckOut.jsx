import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state || !state.event || !state.quantity || !state.user) {
    console.error("Invalid checkout state:", state);
    return <p className="text-red-500 text-center mt-10">❌ Error: Invalid checkout details.</p>;
  }

  const { event, quantity, user } = state;

  const handleConfirmPayment = async () => {
    try {
      const res = await API.post("/payment/initiate", {
        email: user.email,
        amount: event.ticketPrice * quantity,
        metadata: { eventId: event._id, quantity },
      });
      window.location.href = res.data.url; // Redirect to Paystack
    } catch (err) {
      console.error(err);
      alert("⚠️ Payment failed to start");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-lg w-full">
        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Checkout Confirmation
        </h1>

        {/* Event Details */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700">{event.title}</h2>
          <p className="text-gray-600 mt-1">{event.description}</p>
          <p className="text-gray-500 text-sm mt-2">
            📅 {new Date(event.date).toLocaleDateString()} at {event.time}
          </p>
          <p className="text-gray-500 text-sm">📍 {event.location}</p>
        </div>

        {/* Buyer Info */}
        <div className="border-t border-gray-200 pt-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-700">Buyer Info</h3>
          <p className="text-gray-600">👤 {user.username}</p>
          <p className="text-gray-600">📧 {user.email}</p>
        </div>

        {/* Order Summary */}
        <div className="border-t border-gray-200 pt-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-700">Order Summary</h3>
          <p className="text-gray-600">🧾 Quantity: {quantity}</p>
          <p className="text-gray-800 font-bold text-lg">
            💰 Total: ₦{event.ticketPrice * quantity}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-3">
          <button
            onClick={handleConfirmPayment}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200"
          >
            ✅ Confirm & Pay
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200"
          >
            🔙 Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
