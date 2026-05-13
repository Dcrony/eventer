import { useState, useEffect } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ui/toast";
import { Building2, Globe2, MonitorPlay, X, Sparkles, Lock, Users, Ticket, Calendar, MapPin, Clock, Eye, EyeOff } from "lucide-react";
import icon from "../assets/icon.svg";
import { validateImageFile } from "../utils/imageUpload";
import TickiAIGenerator from "../components/TickiAIGenerator";
import useFeatureAccess from "../hooks/useFeatureAccess";
import teamService from "../services/api/team";

const eventTypes = [
  { id: 1, icon: <Building2 className="w-5 h-5" />, name: "In-person", hint: "Attendees will join at a physical location." },
  { id: 2, icon: <MonitorPlay className="w-5 h-5" />, name: "Virtual", hint: "Attendees will join online via a streaming platform." },
  { id: 3, icon: <Globe2 className="w-5 h-5" />, name: "Hybrid", hint: "Attendees can choose to join in-person or online." },
];

const teamRoles = [
  { value: "co_organizer", label: "Co Organizer" },
  { value: "ticket_manager", label: "Ticket Manager" },
  { value: "analytics_viewer", label: "Analytics Viewer" },
  { value: "livestream_moderator", label: "Livestream Moderator" },
];

export default function CreateEvent({ isOpen, onClose }) {
  const toast = useToast();
  const { hasAccess: canUseTickiAI, promptUpgrade: promptUpgradeAI } = useFeatureAccess("tickiai");
  const { hasAccess: canUsePrivateEvents, promptUpgrade: promptUpgradePrivate } = useFeatureAccess("private_events");
  const { hasAccess: canUseLiveStreaming, promptUpgrade: promptUpgradeLive } = useFeatureAccess("live_stream");

  const [submitting, setSubmitting] = useState(false);
  const [isFreeEvent, setIsFreeEvent] = useState(false);
  const [showAIGen, setShowAIGen] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [newTeamMemberEmail, setNewTeamMemberEmail] = useState("");
  const [newTeamMemberRole, setNewTeamMemberRole] = useState("co_organizer");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "", description: "", category: "", location: "",
    streamType: "Camera", streamURL: "", eventType: "In-person",
    visibility: "public", startDate: "", startTime: "", endDate: "", endTime: "",
    pricing: [{ type: "Regular", price: "" }, { type: "VIP", price: "" }, { type: "VVIP", price: "" }],
    totalTickets: "",
  });

  // Replace your existing handleAIGeneration in CreateEvent.jsx with this:

const handleAIGeneration = (aiData) => {
  setForm((prev) => ({
    ...prev,
    // Text fields
    title:       aiData.title       || prev.title,
    description: aiData.description || prev.description,
    category:    aiData.category    || prev.category,
    location:    aiData.location    || prev.location,

    // Date/time — aiData.date is already a YYYY-MM-DD string,
    // aiData.time is already a HH:MM string (normalized in TickiAIGenerator)
    startDate: aiData.date || prev.startDate,
    endDate:   aiData.date || prev.endDate,   // default end = same day
    startTime: aiData.time || prev.startTime,
    // endTime is not generated, leave as-is so user fills it

    // Total tickets — form field expects a string
    totalTickets: aiData.capacity ? String(aiData.capacity) : prev.totalTickets,

    // Event type — already normalized to "In-person" / "Virtual" / "Hybrid"
    eventType: aiData.eventType || prev.eventType,

    // Set Regular tier price; leave VIP and VVIP blank for organizer to fill
    pricing: prev.pricing.map((tier) =>
      tier.type === "Regular"
        ? { ...tier, price: aiData.ticketPrice > 0 ? String(aiData.ticketPrice) : "" }
        : tier
    ),
  }));

  // Toggle the free event checkbox
  setIsFreeEvent(aiData.isFree || aiData.ticketPrice === 0);

  setShowAIGen(false);
};

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
    const updated = [...form.pricing];
    updated[index].price = value;
    setForm((prev) => ({ ...prev, pricing: updated }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateImageFile(file);
    if (err) { toast.error(err); e.target.value = ""; return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleAddTeamMember = () => {
    const email = newTeamMemberEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Enter a valid email address"); return; }
    setTeamMembers((prev) => [...prev, { email, role: newTeamMemberRole }]);
    setNewTeamMemberEmail("");
    setNewTeamMemberRole("co_organizer");
  };

  const handleRemoveTeamMember = (index) => setTeamMembers((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "pricing") formData.append("pricing", JSON.stringify(isFreeEvent ? [] : value));
        else formData.append(key, value);
      });
      formData.append("visibility", form.visibility);
      formData.append("isFree", isFreeEvent);
      if (imageFile) formData.append("image", imageFile);

      const response = await API.post("/events/create", formData);
      const createdEvent = response.data.event;

      if (teamMembers.length && createdEvent?._id) {
        const results = await Promise.allSettled(
          teamMembers.map((m) => teamService.inviteTeamMember(createdEvent._id, { email: m.email, role: m.role, message: `You were invited to join ${form.title}` })),
        );
        const failed = results.filter((r) => r.status === "rejected");
        if (failed.length) toast.error(`Event created, but ${failed.length} invitation(s) failed.`);
      }
      toast.success("Event created successfully!");
      navigate("/events");
      onClose();
    } catch (err) {
      const code = err.response?.data?.code;
      const message = err.response?.data?.message || "Failed to create event";
      if (err.response?.status === 403 && code === "PLAN_LIMIT") {
        toast.error(message);
        window.dispatchEvent(new CustomEvent("planLimitHit"));
      } else toast.error(message);
    } finally { setSubmitting(false); }
  };

  const FieldLabel = ({ children }) => (
    <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
      {children}
    </label>
  );

  return (
    <div
      className="fixed inset-0 z-[10003] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative grid grid-cols-1 md:grid-cols-[2.5fr_1.1fr] bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-gray-200 shadow-2xl animate-scale-in">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 border border-gray-200 text-gray-400 transition-all duration-200 hover:bg-red-50 hover:border-red-200 hover:text-red-500 hover:rotate-90"
        >
          <X size={18} />
        </button>

        {/* Left: Form */}
        <div className="overflow-y-auto max-h-[90vh] px-6 py-8">
          <h2 className="text-xl font-extrabold tracking-tight text-gray-900 text-center mb-6">
            Create New Event
          </h2>

          {/* Event Type Selection */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {eventTypes.map((type) => {
              const active = form.eventType === type.name;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, eventType: type.name }))}
                  className={`flex flex-col p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                    active
                      ? "bg-pink-500 border-pink-500 text-white shadow-lg shadow-pink-500/20"
                      : "bg-white border-gray-200 text-gray-600 hover:border-pink-300 hover:-translate-y-0.5 hover:shadow-md"
                  }`}
                >
                  <div className={`flex items-center justify-center w-9 h-9 rounded-lg mb-2 transition ${
                    active ? "bg-white/20 text-white" : "bg-pink-50 text-pink-500"
                  }`}>
                    {type.icon}
                  </div>
                  <span className="text-sm font-bold">{type.name}</span>
                  <span className={`text-xs mt-1 leading-tight ${active ? "text-white/80" : "text-gray-400"}`}>
                    {type.hint}
                  </span>
                </button>
              );
            })}
          </div>

          {/* AI Generator Button */}
          <button
            type="button"
            onClick={() => { if (!canUseTickiAI) { promptUpgradeAI(); return; } setShowAIGen(!showAIGen); }}
            className={`w-full mb-5 flex items-center justify-center gap-2 py-2.5 rounded-full border-2 text-sm font-bold transition-all duration-200 ${
              showAIGen
                ? "bg-gray-900 border-gray-900 text-white"
                : "bg-pink-50 border-pink-200 text-pink-500 hover:bg-pink-500 hover:border-pink-500 hover:text-white hover:shadow-md"
            }`}
          >
            <Sparkles size={18} /> {showAIGen ? "Close AI Assistant" : "Generate with TickiAI"}
          </button>

          {showAIGen && (
            <div className="mb-5 rounded-xl border border-gray-200 overflow-hidden">
              <TickiAIGenerator onGenerate={handleAIGeneration} />
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              name="title"
              value={form.title}
              placeholder="Event Name"
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none"
            />

            <textarea
              name="description"
              value={form.description}
              placeholder="Event Description"
              rows="4"
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none resize-y min-h-[96px]"
            />

            <input
              name="category"
              value={form.category}
              placeholder="Category (e.g. Tech, Music, Business)"
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none"
            />

            {/* Date/Time Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Start Date", name: "startDate", type: "date" },
                { label: "Start Time", name: "startTime", type: "time" },
                { label: "End Date", name: "endDate", type: "date" },
                { label: "End Time", name: "endTime", type: "time" },
              ].map(({ label, name, type }) => (
                <div key={name}>
                  <FieldLabel>{label}</FieldLabel>
                  <input
                    type={type}
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none"
                  />
                </div>
              ))}
            </div>

            <input
              name="location"
              value={form.location}
              placeholder="Event Location"
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none"
            />

            {/* Ticket Setup Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 my-3">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 mb-0.5">Ticket setup</h3>
                  <p className="text-xs text-gray-400">Define ticket pricing or make this event free.</p>
                </div>
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-xs font-bold text-gray-600 cursor-pointer transition-all duration-200 hover:border-pink-300 hover:bg-pink-50">
                  <input type="checkbox" checked={isFreeEvent} onChange={(e) => setIsFreeEvent(e.target.checked)} className="accent-pink-500" />
                  Free Event
                </label>
              </div>

              {!isFreeEvent ? (
                <div className="space-y-2">
                  {form.pricing.map((item, index) => (
                    <div key={index} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:border-pink-300">
                      <div>
                        <span className="block text-sm font-bold text-gray-900">{item.type}</span>
                        <span className="block text-xs text-gray-400 mt-0.5">Price per attendee ticket</span>
                      </div>
                      <div className="flex items-center min-w-[140px] bg-gray-50 border border-gray-200 rounded-xl px-3 focus-within:border-pink-400 transition-all duration-200">
                        <span className="text-sm font-bold text-gray-400 mr-1">₦</span>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          placeholder="0.00"
                          value={item.price}
                          onChange={(e) => handlePricingChange(index, e.target.value)}
                          className="flex-1 bg-transparent outline-none py-2 text-sm text-gray-900"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-pink-300 bg-pink-50 text-pink-700">
                  <strong className="block text-sm mb-1">Free admission enabled</strong>
                  <p className="text-xs text-pink-600 leading-relaxed">
                    Attendees will be able to reserve tickets without payment.
                  </p>
                </div>
              )}
            </div>

            {/* Total Tickets */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <FieldLabel>Total ticket quantity</FieldLabel>
              <p className="text-xs text-gray-400 mb-3">Set the maximum number of tickets available across all tiers.</p>
              <input
                name="totalTickets"
                value={form.totalTickets}
                type="number"
                min="1"
                placeholder="e.g. 500"
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none"
              />
            </div>

            {/* Team Collaboration */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-extrabold text-gray-900 mb-0.5">Team collaboration</h3>
              <p className="text-xs text-gray-400 mb-3">Invite teammates to help manage this event.</p>

              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <input
                  type="email"
                  value={newTeamMemberEmail}
                  placeholder="Team member email"
                  onChange={(e) => setNewTeamMemberEmail(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none"
                />
                <select
                  value={newTeamMemberRole}
                  onChange={(e) => setNewTeamMemberRole(e.target.value)}
                  className="rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm px-4 py-2.5 outline-none focus:border-pink-500 cursor-pointer transition-all duration-200"
                >
                  {teamRoles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <button
                  type="button"
                  onClick={handleAddTeamMember}
                  className="px-5 py-2.5 rounded-full border-2 border-gray-200 bg-white text-sm font-bold text-gray-600 transition-all duration-200 hover:border-pink-300 hover:text-pink-500 hover:bg-pink-50"
                >
                  Add
                </button>
              </div>

              {teamMembers.length > 0 && (
                <div className="space-y-2">
                  {teamMembers.map((member, index) => {
                    const roleLabel = teamRoles.find((r) => r.value === member.role)?.label || member.role;
                    return (
                      <div key={`${member.email}-${index}`} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50">
                        <div>
                          <strong className="block text-sm text-gray-900">{member.email}</strong>
                          <p className="text-xs text-gray-400 mt-0.5">{roleLabel}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTeamMember(index)}
                          className="text-xs font-bold text-gray-400 transition-all duration-200 hover:text-red-500"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Private Event */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-extrabold text-gray-900 mb-0.5">Private event</h3>
              <p className="text-xs text-gray-400 mb-3">Keep the event hidden and share it only by link.</p>
              
              <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-xs font-bold text-gray-600 cursor-pointer transition-all duration-200 hover:border-pink-300 hover:bg-pink-50">
                <input
                  type="checkbox"
                  checked={form.visibility === "private"}
                  className="accent-pink-500"
                  onChange={(e) => {
                    if (!canUsePrivateEvents) { promptUpgradePrivate(); return; }
                    setForm((prev) => ({ ...prev, visibility: e.target.checked ? "private" : "public" }));
                  }}
                />
                Private event
              </label>

              {!canUsePrivateEvents && (
                <p className="mt-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  Private events are a Pro feature. Upgrade to share your event by invite-only link.
                </p>
              )}

              {form.visibility === "private" && (
                <div className="mt-3">
                  <FieldLabel>Private event link</FieldLabel>
                  <input
                    type="text"
                    readOnly
                    value="Your private event link will be generated after creation."
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-400 text-sm outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Share this unique link with guests once the event is created.
                  </p>
                </div>
              )}
            </div>

            {/* Stream Type */}
            <FieldLabel>Stream Type</FieldLabel>
            {canUseLiveStreaming ? (
              <>
                <select
                  name="streamType"
                  value={form.streamType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none cursor-pointer mb-3"
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
                    value={form.streamURL}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none mb-3"
                  />
                )}
              </>
            ) : (
              <>
                <select className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-100 text-gray-400 text-sm cursor-not-allowed mb-3" disabled>
                  <option>Camera (Native Live Stream)</option>
                </select>
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3">
                  Live streaming is a Pro feature. Upgrade to attach your live broadcast.
                </p>
                <button
                  type="button"
                  onClick={promptUpgradeLive}
                  className="w-full py-2.5 rounded-full border-2 border-gray-200 bg-white text-sm font-bold text-gray-600 transition-all duration-200 hover:border-pink-300 hover:text-pink-500 mb-3"
                >
                  Upgrade for live streaming
                </button>
              </>
            )}

            {/* Image Upload */}
            <label className="flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-5 min-h-[100px] text-sm font-medium text-gray-400 cursor-pointer transition-all duration-200 hover:border-pink-400 hover:bg-pink-50/30 hover:text-pink-500 text-center">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full max-h-44 object-cover rounded-xl transition-all duration-200 hover:scale-[1.01]" />
              ) : (
                <span>Upload an event image</span>
              )}
              <input
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif"
                onChange={handleImageChange}
              />
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 mt-4 rounded-full bg-pink-500 text-white text-sm font-bold transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 shadow-lg shadow-pink-500/25"
            >
              {submitting ? "Creating..." : "Create Event"}
            </button>
          </form>
        </div>

        {/* Right: Info Sidebar */}
        <div className="hidden md:flex flex-col items-center justify-center gap-3 bg-gray-50 border-l border-gray-200 px-6 py-8 text-center">
          <img src={icon} alt="Create event" className="w-16 opacity-80 mx-auto" />
          <h2 className="text-base font-extrabold tracking-tight text-gray-900">Create your event</h2>
          <p className="text-xs text-gray-400 leading-relaxed max-w-[180px]">
            Start creating your event by providing the basic details now and complete it later if needed.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
}