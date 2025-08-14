import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import "./CSS/createEvent.css";
import "./CSS/home.css";

export default function CreateEvent() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    date: "",
    time: "",
    location: "",
    ticketPrice: "",
    totalTickets: "",
    streamType: "YouTube",
    streamURL: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });
      if (imageFile) {
        formData.append("image", imageFile);
      }

      await API.post("/events/create", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

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
            <textarea
              id=""
              name="description"
              placeholder="Description"
              onChange={handleChange}
              required
            ></textarea>
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

            <label htmlFor="imageUpload">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "cover",
                    cursor: "pointer",
                  }}
                />
              ) : (
                <div
                  style={{
                    padding: "10px",
                    border: "1px dashed #ccc",
                    cursor: "pointer",
                  }}
                >
                  Upload Image
                </div>
              )}
            </label>
            <input
              id="imageUpload"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageChange}
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
            <label htmlFor="streamType">
              Stream Type:
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
