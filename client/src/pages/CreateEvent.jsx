import { useState, useEffect } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ui/toast";
import "./CSS/CreateEvent.css";
import { Building2, Globe2, MonitorPlay } from "lucide-react";
import icon from "../assets/icon.svg";
import { validateImageFile } from "../utils/imageUpload";
import TickiAIGenerator from "../components/TickiAiGenerator";
import usePlanAccess from "../hooks/usePlanAccess";
import { promptUpgrade } from "../utils/planAccess";

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

export default function CreateEvent({ isOpen, onClose }) {
  const toast = useToast();
  const canUseTickiAI = usePlanAccess("tickiai");
  const [submitting, setSubmitting] = useState(false);
  const [isFreeEvent, setIsFreeEvent] = useState(false);
  const [showAIGen, setShowAIGen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    streamType: "Camera",
    streamURL: "",
    eventType: "In-person",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    pricing: [
      { type: "Regular", price: "" },
      { type: "VIP", price: "" },
      { type: "VVIP", price: "" },
    ],
    totalTickets: "",
  });

const handleAIGeneration = (aiData) => {
  setForm((prev) => ({
    ...prev,
    title: aiData.title || prev.title,
    description: aiData.description || prev.description,
    category: aiData.category || prev.category,
    location: aiData.location || prev.location,
    // Map AI 'date' to both start and end dates
    startDate: aiData.date || prev.startDate,
    endDate: aiData.date || prev.endDate,
    // Map AI 'time' to start time
    startTime: aiData.time || prev.startTime,
    // Map AI 'capacity' to totalTickets
    totalTickets: aiData.capacity || prev.totalTickets,
    // Map AI 'ticketPrice' to your pricing array
    pricing: prev.pricing.map((tier) => ({
      ...tier,
      price: tier.type === "Regular" ? aiData.ticketPrice : tier.price
    }))
  }));
  
  // Set free event toggle if price is 0
  if (aiData.ticketPrice === 0) {
    setIsFreeEvent(true);
  } else {
    setIsFreeEvent(false);
  }

  setShowAIGen(false);
};

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePricingChange = (index, value) => {
    const updatedPricing = [...form.pricing];
    updatedPricing[index].price = value;
    setForm((prev) => ({ ...prev, pricing: updatedPricing }));
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
      setSubmitting(true);

      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (key === "pricing") {
          formData.append("pricing", JSON.stringify(isFreeEvent ? [] : value));
        } else {
          formData.append(key, value);
        }
      });

      formData.append("isFree", isFreeEvent);

      if (imageFile) formData.append("image", imageFile);

      await API.post("/events/create", formData);

      toast.success("Event created successfully!");
      navigate("/events");
      onClose();
    } catch (err) {
      console.error(err);
      const code = err.response?.data?.code;
      const message = err.response?.data?.message || "Failed to create event";
      if (err.response?.status === 403 && code === "PLAN_LIMIT") {
        toast.error(message);
        window.dispatchEvent(new CustomEvent("planLimitHit"));
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="create-event-overlay"
      onClick={(e) => {
        if (e.target.classList.contains("create-event-overlay")) onClose();
      }}
    >
      <div className={`create-event-container ${showAIGen ? "ai-active" : ""}`}>
        <div className="form-wrapper">
          <button className="close-btn" onClick={onClose}>
            x
          </button>

          <h2 className="form-title">Create New Event</h2>

          <div className="event-type-selection">
            {eventTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, eventType: type.name }))
                }
                className={`event-type-btn ${form.eventType === type.name ? "active" : ""}`}
              >
                <div className="flex justify-between align-center">
                  <div className="icon">{type.icon}</div>
                  <div className="type-name">{type.name}</div>
                </div>
                <div className="type-hint">{type.hint}</div>
              </button>
            ))}
          </div>

      {/* AI Toggle Button - Now styled as a prominent action */}
        <button 
          type="button"
          onClick={() => {
            if (!canUseTickiAI) {
              promptUpgrade("TickiAI");
              return;
            }
            setShowAIGen(!showAIGen);
          }}
          className={`ai-magic-btn ${showAIGen ? 'active' : ''}`}
        >
          {showAIGen ? "✨ Close AI Assistant" : "✨ Generate with TickiAI"}
        </button>

      {showAIGen && (
        <div className="ai-overlay">
          <TickiAIGenerator onGenerate={handleAIGeneration} />
        </div>
      )}

          <form onSubmit={handleSubmit}>
            <input
              name="title"
              value={form.title}
              placeholder="Event Name"
              className="input-field"
              onChange={handleChange}
              required
            />

            <textarea
              name="description"
              value={form.description}
              placeholder="Event Description"
              rows="4"
              className="input-field"
              onChange={handleChange}
              required
            />

            <input
              name="category"
              value={form.category}
              placeholder="Category (e.g. Tech, Music, Business)"
              className="input-field"
              onChange={handleChange}
              required
            />

            <div className="date-time-row">
              <div>
                <label className="field-label">Start Date</label>
                <input
                  type="date"
                  value={form.date}
                  name="startDate"
                  className="input-field"
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="field-label">Start Time</label>
                <input
                  type="time"
                  value={form.time}
                  name="startTime"
                  className="input-field"
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="field-label">End Date</label>
                <input
                  type="date"
                  value={form.date}
                  name="endDate"
                  className="input-field"
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="field-label">End Time</label>
                <input
                  type="time"
                  value={form.time}
                  name="endTime"
                  className="input-field"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <input
              name="location"
              value={form.location}
              placeholder="Event Location"
              className="input-field"
              onChange={handleChange}
              required
            />

            <div className="form-pricing-section">
              <div className="pricing-section-head">
                <div>
                  <h3>Ticket setup</h3>
                  <p>Define ticket pricing or make this event free.</p>
                </div>

                <label className="free-toggle">
                  <input
                    type="checkbox"
                    checked={isFreeEvent}
                    onChange={(e) => setIsFreeEvent(e.target.checked)}
                  />
                  <span>Free Event</span>
                </label>
              </div>

              {!isFreeEvent ? (
                form.pricing.map((item, index) => (
                  <div key={index} className="pricing-ticket-card">
                    <div className="pricing-ticket-copy">
                      <span className="pricing-ticket-name">{item.type}</span>
                      <small className="pricing-ticket-meta">Price per attendee ticket</small>
                    </div>
                    <div className="pricing-ticket-input-wrap">
                      <span className="pricing-ticket-currency">N</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0.00"
                        className="input-field pricing-input-field"
                        value={item.price}
                        onChange={(e) => handlePricingChange(index, e.target.value)}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="pricing-free-state">
                  <strong>Free admission enabled</strong>
                  <p>Pricing is hidden and attendees will be able to reserve tickets without payment.</p>
                </div>
              )}
            </div>

            <div className="ticket-capacity-card">
              <label className="field-label">Total ticket quantity</label>
              <p className="ticket-capacity-hint">
                Set the maximum number of tickets available across all tiers.
              </p>
              <input
                name="totalTickets"
                value={form.totalTickets}
                type="number"
                min="1"
                placeholder="e.g. 500"
                className="input-field"
                onChange={handleChange}
                required
              />
            </div>

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
                value={form.streamURL}
                onChange={handleChange}
              />
            )}

            <div className="form-label">
              <label className="image-upload">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="image-preview"
                  />
                ) : (
                  <span>Upload an event image</span>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif"
                  onChange={handleImageChange}
                />
              </label>
            </div>

            <button type="submit" className="submit-btn" disabled={submitting}>
              Create Event
            </button>
          </form>
        </div>

        <div className="info-sidebar">
          <img src={icon} alt="Create event" />
          <h2>Create your event</h2>
          <p>
            Start creating your event by providing the basic details now and
            complete it later if needed.
          </p>
        </div>
      </div>
    </div>
  );
}
