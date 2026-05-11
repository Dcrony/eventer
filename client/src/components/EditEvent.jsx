import { useEffect, useRef, useState } from "react";
import API from "../api/axios";
import teamService from "../services/api/team";
import { useToast } from "../components/ui/toast";
import { getEventImageUrl, getEventUrl } from "../utils/eventHelpers";
import { validateImageFile } from "../utils/imageUpload";
import "../pages/CSS/CreateEvent.css";
import { Building2, Globe2, MonitorPlay } from "lucide-react";
import icon from "../assets/icon.svg";
import useFeatureAccess from "../hooks/useFeatureAccess";

const DEFAULT_PRICING = [
  { type: "Regular", price: "" },
  { type: "VIP", price: "" },
  { type: "VVIP", price: "" },
];

const FREE_PRICING = [{ type: "Free", price: 0 }];

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

const clonePricing = (pricing) => pricing.map((item) => ({ ...item }));

const normalizePaidPricing = (pricing) => {
  const source = Array.isArray(pricing) ? pricing : [];
  const normalized = source
    .map((item) => ({
      type: String(item?.type || "").trim(),
      price: item?.price ?? "",
    }))
    .filter((item) => item.type && item.type.toLowerCase() !== "free");

  return normalized.length ? normalized : clonePricing(DEFAULT_PRICING);
};

const isEventFree = (event) => {
  if (!event) return false;
  if (event.isFree === true || event.isFreeEvent === true) return true;

  const pricing = Array.isArray(event.pricing) ? event.pricing : [];
  return pricing.length > 0 && pricing.every((tier) => Number(tier?.price || 0) === 0);
};

export default function EditEvent({ isOpen, onClose, eventId, onEventUpdated }) {
  const toast = useToast();
  const { hasAccess: canUsePrivateEvents, promptUpgrade: promptUpgradePrivate } = useFeatureAccess("private_events");
  const { hasAccess: canUseLiveStreaming, promptUpgrade: promptUpgradeLive } = useFeatureAccess("live_stream");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isFree, setIsFree] = useState(false);
  const teamRoles = [
    { value: "manager", label: "Manager", description: "Full access to manage this event and the team." },
    { value: "ticket_manager", label: "Ticket Manager", description: "Manage ticket setup and attendee support." },
    { value: "analytics_viewer", label: "Analytics Viewer", description: "View-only access to event analytics." },
    { value: "livestream_moderator", label: "Livestream Moderator", description: "Manage livestream controls." },
  ];
  const [teamMembers, setTeamMembers] = useState([]);
  const [newTeamMemberEmail, setNewTeamMemberEmail] = useState("");
  const [newTeamMemberRole, setNewTeamMemberRole] = useState("manager");
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    streamType: "Camera",
    streamURL: "",
    eventType: "In-person",
    visibility: "public",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    pricing: clonePricing(DEFAULT_PRICING),
    totalTickets: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const previousPaidPricingRef = useRef(clonePricing(DEFAULT_PRICING));

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!eventId || !isOpen) return;

    const fetchEvent = async () => {
      try {
        setLoading(true);
        const { data } = await API.get(`/events/${eventId}`);
        const freeEvent = isEventFree(data);
        const paidPricing = normalizePaidPricing(data.pricing);

        previousPaidPricingRef.current = clonePricing(paidPricing);
        setIsFree(freeEvent);
        setForm({
          title: data.title || "",
          description: data.description || "",
          category: data.category || "",
          location: data.location || "",
          streamType: data.liveStream?.streamType || "Camera",
          streamURL: data.liveStream?.streamURL || "",
          eventType: data.eventType || "In-person",
          visibility: data.visibility || "public",
          startDate: data.startDate?.split("T")[0] || "",
          startTime: data.startTime || "",
          endDate: data.endDate?.split("T")[0] || "",
          endTime: data.endTime || "",
          pricing: freeEvent ? clonePricing(FREE_PRICING) : clonePricing(paidPricing),
          totalTickets: data.totalTickets || "",
        });
        setTeamMembers([]);
        setImagePreview(data.image ? getEventImageUrl(data) || "" : null);
        setImageFile(null);
      } catch (error) {
        toast.error("Failed to load event details");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, isOpen, toast]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePricingChange = (index, value) => {
    setForm((prev) => {
      const updatedPricing = [...prev.pricing];
      updatedPricing[index] = { ...updatedPricing[index], price: value };
      previousPaidPricingRef.current = clonePricing(updatedPricing);
      return { ...prev, pricing: updatedPricing };
    });
  };

  const handleFreeToggle = (checked) => {
    setIsFree(checked);
    setForm((prev) => {
      if (checked) {
        const paidPricing = normalizePaidPricing(prev.pricing);
        previousPaidPricingRef.current = clonePricing(paidPricing);
        return { ...prev, pricing: clonePricing(FREE_PRICING) };
      }

      return {
        ...prev,
        pricing: clonePricing(previousPaidPricingRef.current),
      };
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      e.target.value = "";
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleAddTeamMember = () => {
    const email = newTeamMemberEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }

    setTeamMembers((prev) => [...prev, { email, role: newTeamMemberRole }]);
    setNewTeamMemberEmail("");
    setNewTeamMemberRole("manager");
  };

  const handleRemoveTeamMember = (index) => {
    setTeamMembers((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      const formData = new FormData();
      const pricing = isFree ? clonePricing(FREE_PRICING) : form.pricing;

      Object.entries(form).forEach(([key, value]) => {
        if (key === "pricing") {
          formData.append("pricing", JSON.stringify(pricing));
        } else {
          formData.append(key, value);
        }
      });

      formData.append("visibility", form.visibility);
      formData.append("isFree", isFree);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await API.put(`/events/update/${eventId}`, formData);
      const updatedEvent = response.data.event;

      if (teamMembers.length && updatedEvent?._id) {
        const inviteResults = await Promise.allSettled(
          teamMembers.map((member) =>
            teamService.inviteTeamMember(updatedEvent._id, {
              email: member.email,
              role: member.role,
              message: `You were invited to join the event ${form.title}`,
            }),
          ),
        );

        const failedInvites = inviteResults
          .map((result, idx) => ({ result, member: teamMembers[idx] }))
          .filter((entry) => entry.result.status === "rejected");

        if (failedInvites.length) {
          toast.error(
            `Event updated, but ${failedInvites.length} team invitation(s) failed. Please verify the email addresses and try again.`,
          );
        }
      }

      toast.success("Event updated successfully!");
      onEventUpdated();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update event");
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
      <div className="create-event-container">
        <div className="form-wrapper">
          <button className="close-btn" onClick={onClose} type="button">
            x
          </button>

          <h2 className="form-title">Edit Event</h2>

          {loading ? (
            <div className="loading">Loading event details...</div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="event-type-selection">
                {eventTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, eventType: type.name }))}
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
              />

              <input
                name="category"
                placeholder="Category (e.g. Tech, Music, Business)"
                className="input-field"
                onChange={handleChange}
                value={form.category}
                required
              />

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

              <div className="form-pricing-section">
                <div className="pricing-section-head">
                  <div>
                    <h3>Ticket setup</h3>
                    <p>Define ticket pricing or make this event free.</p>
                  </div>

                  <label className="free-toggle">
                    <input
                      type="checkbox"
                      checked={isFree}
                      onChange={(e) => handleFreeToggle(e.target.checked)}
                    />
                    <span>Free Event</span>
                  </label>
                </div>

                {!isFree ? (
                  form.pricing.map((item, index) => (
                    <div key={item.type || index} className="pricing-ticket-card">
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
                    <strong>This is a free event</strong>
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
                  type="number"
                  min="1"
                  placeholder="e.g. 500"
                  className="input-field"
                  onChange={handleChange}
                  value={form.totalTickets}
                  required
                />
              </div>

              <div className="team-settings-card">
                <div className="section-head">
                  <div>
                    <h3>Team collaboration</h3>
                    <p>Invite teammates to help manage this event.</p>
                  </div>
                </div>

                <div className="team-input-row">
                  <input
                    type="email"
                    value={newTeamMemberEmail}
                    onChange={(e) => setNewTeamMemberEmail(e.target.value)}
                    placeholder="Team member email"
                    className="input-field"
                  />
                  <select
                    value={newTeamMemberRole}
                    onChange={(e) => setNewTeamMemberRole(e.target.value)}
                    className="input-field"
                  >
                    {teamRoles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="dash-btn" onClick={handleAddTeamMember}>
                    Add
                  </button>
                </div>

                {teamMembers.length > 0 && (
                  <div className="team-members-list">
                    {teamMembers.map((member, index) => {
                      const roleLabel = teamRoles.find((role) => role.value === member.role)?.label || member.role;
                      return (
                        <div key={`${member.email}-${index}`} className="team-member-row">
                          <div>
                            <strong>{member.email}</strong>
                            <p>{roleLabel}</p>
                          </div>
                          <button type="button" className="link-button" onClick={() => handleRemoveTeamMember(index)}>
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="private-event-card">
                <div className="section-head">
                  <div>
                    <h3>Private event</h3>
                    <p>Keep the event hidden and share it only by link.</p>
                  </div>
                </div>
                <label className="free-toggle">
                  <input
                    type="checkbox"
                    checked={form.visibility === "private"}
                    onChange={(e) => {
                      if (!canUsePrivateEvents) {
                        promptUpgradePrivate();
                        return;
                      }
                      setForm((prev) => ({
                        ...prev,
                        visibility: e.target.checked ? "private" : "public",
                      }));
                    }}
                  />
                  <span>Private event</span>
                </label>
                {!canUsePrivateEvents && (
                  <div className="feature-note">
                    Private events are a Pro feature. Upgrade to keep your event invite-only.
                  </div>
                )}
                {form.visibility === "private" && (
                  <div className="private-link-card">
                    <label className="field-label">Private event link</label>
                    <input
                      type="text"
                      value={getEventUrl(eventId)}
                      readOnly
                      className="input-field"
                    />
                    <p className="ticket-capacity-hint">
                      Copy the event link and share it with invited guests.
                    </p>
                  </div>
                )}
              </div>

              <label className="field-label">Stream Type</label>
              {canUseLiveStreaming ? (
                <>
                  <select
                    name="streamType"
                    value={form.streamType}
                    className="input-field"
                    onChange={handleChange}
                  >
                    <option value="Camera">Camera (Native Live Stream)</option>
                    <option value="YouTube">YouTube</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Custom">Custom</option>
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
                </>
              ) : (
                <>
                  <select className="input-field" disabled>
                    <option value="Camera">Camera (Native Live Stream)</option>
                  </select>
                  <div className="feature-note">
                    Live streaming is a Pro feature. Upgrade to attach your live broadcast.
                  </div>
                  <button type="button" className="dash-btn" onClick={promptUpgradeLive}>
                    Upgrade for live streaming
                  </button>
                </>
              )}

              <div className="form-label">
                <label className="image-upload">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="image-preview" />
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
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </form>
          )}
        </div>

        <div className="info-sidebar">
          <img src={icon} alt="Edit event" />
          <h2>Update your event</h2>
          <p>
            Keep your event details current, switch between paid and free ticketing, and save
            changes without affecting the paid checkout flow.
          </p>
        </div>
      </div>
    </div>
  );
}
