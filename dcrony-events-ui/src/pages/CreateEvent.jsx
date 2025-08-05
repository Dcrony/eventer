import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import './CSS/createEvent.css'
import "./CSS/home.css"

export default function CreateEvent() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    date: "",
    time: "",
    location: "",
    image: "",
    ticketPrice: "",
    totalTickets: "",
    streamType: "",
    streamURL: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/events/create", form);
      alert("Event created!");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Failed to create event");
    }
  };

  return (
    <div className="home createEvent">
      <div className="form">
      <h2>Create New Event</h2>
      <form onSubmit={handleSubmit}>
        <div>
        <input
          name="title"
          placeholder="Title"
          onChange={handleChange}
          required
        />
        <input
          name="description"
          placeholder="Description"
          onChange={handleChange}
          required
        />
        <input
          name="category"
          placeholder="Category"
          onChange={handleChange}
          required
        />
        <input name="date" type="date" onChange={handleChange} required />
        <input name="time" type="time" onChange={handleChange} required />
        </div>
        <div>
        <input
          name="location"
          placeholder="Location"
          onChange={handleChange}
          required
        />
        <label htmlFor="image">
          <img src="" alt="" />
        </label>
        <input
        type="file"
          name="image"
          placeholder="Image URL"
          onChange={handleChange}
          required
        />
        <input
          name="ticketPrice"
          type="number"
          placeholder="₦ Price"
          onChange={handleChange}
          required
        />
        <input
          name="totalTickets"
          type="number"
          placeholder="No. of Tickets"
          onChange={handleChange}
          required
        />
        </div>
        <div>
          <label htmlFor="SreamType">SreamType:
        <select
          name="streamType"
          value={form.streamType}
          onChange={handleChange}
        >
          <option value="YouTube">YouTube</option>
          <option value="Facebook">Facebook</option>
        </select>
        </label>
        </div>
        <input
          name="streamURL"
          placeholder="Stream URL"
          onChange={handleChange}
        />
        <button type="submit">Create Event</button>
      </form>
      </div>
    </div>
  );
}
