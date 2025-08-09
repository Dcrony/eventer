import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api/axios";
import "./CSS/home.css"

export default function EditEvent() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    date: "",
    time: "",
    ticketPrice: "",
    totalTickets: "",
    streamType: "YouTube",
    streamURL: "",
  });

  useEffect(() => {
    API.get(`/events/${eventId}`)
      .then((res) => setForm(res.data))
      .catch((err) => console.error("Failed to load event", err));
  }, [eventId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/events/update/${eventId}`, form);
      alert("Event updated!");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Failed to update event");
    }
  };

  return (
    <div className="home" >
      <h2>✏️ Edit Event</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Title"
          required
        />
        <br />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          required
        />
        <br />
        <input
          name="location"
          value={form.location}
          onChange={handleChange}
          placeholder="Location"
          required
        />
        <br />
        <input
          name="date"
          type="date"
          value={form.date}
          onChange={handleChange}
          required
        />
        <br />
        <input
          name="time"
          type="time"
          value={form.time}
          onChange={handleChange}
          required
        />
        <br />
        <input
          name="ticketPrice"
          type="number"
          value={form.ticketPrice}
          onChange={handleChange}
          placeholder="Ticket Price"
          required
        />
        <br />
        <input
          name="totalTickets"
          type="number"
          value={form.totalTickets}
          onChange={handleChange}
          placeholder="Total Tickets"
          required
        />
        <br />
        <select
          name="streamType"
          value={form.streamType}
          onChange={handleChange}
        >
          <option value="YouTube">YouTube</option>
          <option value="Facebook">Facebook</option>
        </select>
        <br />
        <input
          name="streamURL"
          value={form.streamURL}
          onChange={handleChange}
          placeholder="Live Stream URL"
        />
        <br />
        <button type="submit">✅ Update Event</button>
      </form>
    </div>
  );
}
