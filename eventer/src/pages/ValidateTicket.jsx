import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./CSS/home.css";

const TicketValidationPage = () => {
  const { ticketId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateTicket = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/tickets/validate/${ticketId}`
        );
        setResult(res.data);
      } catch (err) {
        setResult({ success: false, message: "Invalid or expired ticket" });
      } finally {
        setLoading(false);
      }
    };
    validateTicket();
  }, [ticketId]);

  if (loading) return <p>Validating ticket...</p>;

  return (
    <div className="home p-6">
      {result?.success ? (
        <div className="bg-green-100 p-4 rounded">
          <h2 className="text-xl font-bold">✅ Ticket Valid</h2>
          <p>Event: {result.event?.title}</p>
          <p>Date: {result.event?.date}</p>
          <p>Location: {result.event?.location}</p>
        </div>
      ) : (
        <div className="bg-red-100 p-4 rounded">
          <h2 className="text-xl font-bold">❌ Ticket Invalid</h2>
          <p>{result?.message}</p>
        </div>
      )}
    </div>
  );
};

export default TicketValidationPage;
