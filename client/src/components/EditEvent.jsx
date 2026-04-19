import { useEffect, useState } from "react";
import API from "../api/axios";
import { getEventImageUrl } from "../utils/eventHelpers";
import { validateImageFile } from "../utils/imageUpload";
import "./css/Editevent.css";
import { Building2, Globe2, MonitorPlay } from "lucide-react";


export default function EditEvent({ isOpen, onClose, eventId, onEventUpdated }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    eventType: "In-person",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    totalTickets: "",
    pricing: [
      { type: "Regular", price: "" },
      { type: "VIP", price: "" },
      { type: "VVIP", price: "" },
    ],
    streamType: "Camera",
    streamURL: "",
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const eventTypes = [
    {
      id: 1,
      icon: <Building2 className="w-5 h-5" />,
      name: "In-person",
      hint: "Attendees will join the event at a physical location.",
    },
    {
      id: 2,
      icon: <MonitorPlay className="w-5 h-5" />,
      name: "Virtual",
      hint: "Attendees will join the event online via a streaming platform.",
    },
    {
      id: 3,
      icon: <Globe2 className="w-5 h-5" />,
      name: "Hybrid",
      hint: "Attendees can choose to join either in-person or online.",
    },
  ];


  // 🧭 Fetch Event Data
  useEffect(() => {
    if (!eventId || !isOpen) return;
    setLoading(true);

    API.get(`/events/${eventId}`)
      .then((res) => {
        const data = res.data;
        setForm({
          title: data.title || "",
          description: data.description || "",
          category: data.category || "",
          location: data.location || "",
          eventType: data.eventType || "In-person",
          startDate: data.startDate?.split("T")[0] || "",
          startTime: data.startTime || "",
          endDate: data.endDate?.split("T")[0] || "",
          endTime: data.endTime || "",
          totalTickets: data.totalTickets || "",
          pricing: data.pricing?.length
            ? data.pricing
            : [
              { type: "Regular", price: "" },
              { type: "VIP", price: "" },
              { type: "VVIP", price: "" },
            ],
          streamType: data.liveStream?.streamType || "Camera",
          streamURL: data.liveStream?.streamURL || "",
        });

        if (data.image) {
          setImagePreview(getEventImageUrl(data) || "");
        }
      })
      .catch(() => alert("❌ Failed to load event details"))
      .finally(() => setLoading(false));
  }, [eventId, isOpen]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handlePricingChange = (i, value) => {
    const updated = [...form.pricing];
    updated[i].price = value;
    setForm((prev) => ({ ...prev, pricing: updated }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateImageFile(file);
    if (err) {
      alert(err);
      e.target.value = "";
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (key === "pricing") formData.append(key, JSON.stringify(value));
        else formData.append(key, value);
      });

      if (imageFile) formData.append("image", imageFile);

      await API.put(`/events/update/${eventId}`, formData);

      alert("✅ Event updated successfully!");
      onEventUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update event");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`edit-overlay ${isOpen ? "show" : ""}`}>
      <div className="edit-modal scale-in">
        <div className="edit-header">
          <h2>✏️ Edit Event</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        {loading ? (
          <div className="loading">Loading event details...</div>
        ) : (
          <form onSubmit={handleSubmit} className="edit-form">

            {/* 🧭 Event Type Selection */}
            <div className="event-type-selection">
              {eventTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, eventType: type.name }))
                  }
                  className={`event-type-btn ${form.eventType === type.name ? "active" : ""
                    }`}
                >
                  <div className="flex justify-between align-center">
                    <div className="icon">{type.icon}</div>
                    <div className="type-name">{type.name}</div>
                  </div>
                  <div className="type-hint">{type.hint}</div>
                </button>
              ))}
            </div>

            <input
              name="title"
              placeholder="Event Name"
              className="input-field"
              onChange={handleChange}
              value={form.title}
              required
            />

            <textarea
              name="description"
              placeholder="Event Description"
              rows="4"
              className="input-field"
              onChange={handleChange}
              value={form.description}
              required
            ></textarea>

            <input
              name="category"
              placeholder="Category (e.g. Tech, Music, Business)"
              className="input-field"
              onChange={handleChange}
              value={form.category}
              required
            />

            {/* Date and Time */}
            <div className="date-time-row">
              <div>
                <label className="field-label">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  className="input-field"
                  onChange={handleChange}
                  value={form.startDate}
                  required
                />
              </div>
              <div>
                <label className="field-label">Start Time</label>
                <input
                  type="time"
                  name="startTime"
                  className="input-field"
                  onChange={handleChange}
                  value={form.startTime}
                  required
                />
              </div>
              <div>
                <label className="field-label">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  className="input-field"
                  onChange={handleChange}
                  value={form.endDate}
                  required
                />
              </div>
              <div>
                <label className="field-label">End Time</label>
                <input
                  type="time"
                  name="endTime"
                  className="input-field"
                  onChange={handleChange}
                  value={form.endTime}
                  required
                />
              </div>
            </div>

            <input
              name="location"
              placeholder="Event Location"
              className="input-field"
              onChange={handleChange}
              value={form.location}
              required
            />

            {/* Pricing */}
            <div className="pricing-section">
              <h3>💳 Pricing Categories</h3>
              {form.pricing.map((item, index) => (
                <div key={index} className="pricing-grid">
                  <span>{item.type}</span>
                  <input
                    type="number"
                    placeholder={`₦ ${item.type} Price`}
                    className="input-field"
                    value={item.price}
                    onChange={(e) => handlePricingChange(index, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <input
              name="totalTickets"
              type="number"
              placeholder="Total Tickets"
              className="input-field"
              onChange={handleChange}
              value={form.totalTickets}
              required
            />

            {/* Stream Type */}
            <label className="field-label">Stream Type</label>
            <select
              name="streamType"
              value={form.streamType}
              className="input-field"
              onChange={handleChange}
            >
              <option value="Camera">Camera (Native Live Stream)</option>
              <option value="YouTube">YouTube</option>
              <option value="Facebook">Facebook</option>
            </select>

            {form.streamType !== "Camera" && (
              <input
                name="streamURL"
                placeholder={`${form.streamType} Stream URL`}
                className="input-field"
                onChange={handleChange}
                value={form.streamURL}
              />
            )}

            {/* Image Upload */}
            <div className="form-label">
              <label className="image-upload">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="image-preview"
                  />
                ) : (
                  <span>📸 Upload an event image</span>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif"
                  onChange={handleImageChange}
                />
              </label>
            </div>

            {/* Save Button */}
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Saving..." : "💾 Save Changes"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
