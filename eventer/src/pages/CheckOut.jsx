import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/axios";
import "./CSS/home.css";

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();
    if (!state || !state.event || !state.quantity || !state.user) {
    console.error("Invalid checkout state:", state);
    return <p>Error: Invalid checkout details.</p>;
    }


  const { event, quantity, user } = state;
    if (!event || !quantity || !user) {
        return <p>Error: Missing event, quantity, or user information.</p>;
    }

    // Handle payment confirmation

  const handleConfirmPayment = async () => {
    try {
      const res = await API.post("/payment/initiate", {
        email: user.email,
        amount: event.ticketPrice * quantity,
        metadata: {
          eventId: event._id,
          quantity,
        },
      });

      // Redirect to Paystack
      window.location.href = res.data.url;
    } catch (err) {
      console.error(err);
      alert("Payment failed to start");
    }
  };
    if (!event) {
        return <p>Error: Event not found.</p>;
    }
    if (!user || !user.username || !user.email) {
        return <p>Error: User information is incomplete.</p>;
    }

  return (
    <div className="home checkout-container">
      <h1>Checkout Confirmation</h1>

      <h2>{event.title}</h2>
      <p>{event.description}</p>
      <p>
        Date: {new Date(event.date).toLocaleDateString()} at {event.time}
      </p>
      <p>Location: {event.location}</p>

      <h3>Buyer Info</h3>
      <p>Name: {user.username}</p>
      <p>Email: {user.email}</p>

      <h3>Order Summary</h3>
      <p>Quantity: {quantity}</p>
      <p>Total: ₦{event.ticketPrice * quantity}</p>

      <button
        onClick={(e) => {
          e.preventDefault();
          handleConfirmPayment();
        }}
        target="_blank"
        rel="noopener noreferrer"
      >
        Confirm & Pay
      </button>
      <button onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );
}
