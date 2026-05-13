import { useState } from "react";
import { Sparkles, AlertCircle, CheckCircle2, Edit2, ChevronDown } from "lucide-react";
import API from "../api/axios";

const EXAMPLE_PROMPTS = [
  "Tech meetup in Lagos for 200 people, ₦3000 ticket",
  "Summer concert featuring live bands, free entry, 500 capacity",
  "Business networking breakfast in Abuja, ₦5000 per person",
  "Fitness bootcamp every weekend, ₦1500, 50 participants max",
  "Comedy show at the waterfront, ₦8000, intimate 100-person venue",
];

// Maps AI category output to what the form accepts
const CATEGORY_SUGGESTIONS = [
  "Tech", "Music", "Business", "Sports", "Arts", "Food", "Health",
  "Education", "Fashion", "Comedy", "Fitness", "Networking", "Other",
];

// Maps AI event type to the three options in CreateEvent
const normalizeEventType = (type) => {
  if (!type) return "In-person";
  const t = type.toLowerCase();
  if (t.includes("virtual") || t.includes("online")) return "Virtual";
  if (t.includes("hybrid")) return "Hybrid";
  return "In-person";
};

// Ensures date is YYYY-MM-DD string (what <input type="date"> expects)
const normalizeDate = (raw) => {
  if (!raw) return "";
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
};

// Ensures time is HH:MM string (what <input type="time"> expects)
const normalizeTime = (raw) => {
  if (!raw) return "14:00";
  // Already HH:MM
  if (/^\d{2}:\d{2}$/.test(raw)) return raw;
  // Try parsing
  try {
    const d = new Date(`1970-01-01T${raw}`);
    if (!isNaN(d.getTime())) {
      return d.toTimeString().slice(0, 5);
    }
  } catch {}
  return "14:00";
};

const EditableField = ({ label, value, onChange, type = "text", options = null }) => {
  const [editing, setEditing] = useState(false);

  if (editing) {
    if (options) {
      return (
        <div className="space-y-1.5">
          <label className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">{label}</label>
          <select
            value={value}
            onChange={(e) => { onChange(e.target.value); setEditing(false); }}
            onBlur={() => setEditing(false)}
            autoFocus
            className="w-full px-3 py-2 rounded-lg border-2 border-pink-500 bg-white text-gray-900 text-sm outline-none cursor-pointer"
          >
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      );
    }
    return (
      <div className="space-y-1.5">
        <label className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">{label}</label>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setEditing(false)}
          autoFocus
          className="w-full px-3 py-2 rounded-lg border-2 border-pink-500 bg-white text-gray-900 text-sm outline-none"
        />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">{label}</label>
      <div
        onClick={() => setEditing(true)}
        className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-sm cursor-pointer transition-all duration-200 hover:border-pink-300 hover:bg-pink-50/30"
      >
        <span className="flex-1 truncate">{value || "—"}</span>
        {options ? <ChevronDown size={12} className="text-gray-400 flex-shrink-0" /> : <Edit2 size={12} className="text-gray-400 flex-shrink-0" />}
      </div>
    </div>
  );
};

const TickiAIGenerator = ({ onGenerate = null, onClose = null }) => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generated, setGenerated] = useState(null);

  const handleGenerateEvent = async (e) => {
    e.preventDefault();
    setError(null);
    const trimmed = prompt.trim();
    if (!trimmed) { setError("Please describe your event"); return; }
    setLoading(true);

    try {
      const response = await API.post("/ai/generate-event", { prompt: trimmed });
      const raw = response.data.event;

      // Normalize ALL fields to exactly match CreateEvent's form state keys
      const normalized = {
        // --- Basic text fields ---
        title: raw.title || "",
        description: raw.description || "",
        category: raw.category || "Other",
        location: raw.location || "",

        // --- Date/time: must be YYYY-MM-DD and HH:MM strings ---
        startDate: normalizeDate(raw.startDate || raw.date),
        endDate: normalizeDate(raw.startDate || raw.date), // default end = start date
        startTime: normalizeTime(raw.startTime || raw.time),
        endTime: normalizeTime(raw.startTime || raw.time), // default end time = start time

        // --- Ticket setup ---
        // totalTickets maps to form.totalTickets (string in form, number from AI)
        totalTickets: String(raw.totalTickets || raw.capacity || 100),

        // pricing[0].price = Regular ticket price (what CreateEvent uses)
        ticketPrice: raw.pricing?.[0]?.price ?? raw.ticketPrice ?? 0,
        isFree: raw.isFree ?? raw.isFreeEvent ?? (raw.pricing?.[0]?.price === 0),

        // --- Event type: must be exactly "In-person", "Virtual", or "Hybrid" ---
        eventType: normalizeEventType(raw.eventType || raw.location),
      };

      setGenerated(normalized);
      setPrompt("");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to generate event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const update = (key) => (value) => setGenerated((prev) => ({ ...prev, [key]: value }));

  const handleApply = () => {
    if (!generated) return;

    // Build the exact payload that handleAIGeneration in CreateEvent expects
    const payload = {
      // Text fields
      title: generated.title,
      description: generated.description,
      category: generated.category,
      location: generated.location,

      // Date/time strings matching <input type="date"> and <input type="time">
      date: generated.startDate,       // → form.startDate & form.endDate
      time: generated.startTime,       // → form.startTime

      // Ticket quantity → form.totalTickets
      capacity: generated.totalTickets,

      // Ticket price → form.pricing[0].price (Regular tier)
      ticketPrice: Number(generated.ticketPrice) || 0,

      // isFree → setIsFreeEvent()
      isFree: generated.isFree,

      // eventType → form.eventType
      eventType: generated.eventType,
    };

    if (onGenerate) onGenerate(payload);
    if (onClose) onClose();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center text-pink-500">
            <Sparkles size={18} />
          </div>
          <h2 className="text-base font-extrabold text-gray-900">AI Event Generator</h2>
        </div>
        <p className="text-xs text-gray-500">Describe your event and let TickiAI build it instantly.</p>
      </div>

      <div className="p-5">
        {!generated ? (
          <>
            <form onSubmit={handleGenerateEvent} className="space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => { setPrompt(e.target.value); setError(null); }}
                placeholder="e.g. Tech meetup in Lagos, 200 people, ₦3000"
                disabled={loading}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none resize-none disabled:opacity-50"
              />

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="w-full py-2.5 rounded-full bg-pink-500 text-white text-sm font-bold transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 shadow-md shadow-pink-500/25"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </span>
                ) : (
                  "Generate Event"
                )}
              </button>
            </form>

            <div className="mt-5">
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400 mb-2">Try these examples</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.map((example) => (
                  <button
                    key={example}
                    onClick={() => { setPrompt(example); setError(null); }}
                    className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium transition-all duration-200 hover:bg-pink-100 hover:text-pink-600"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm mb-5">
              <CheckCircle2 size={16} />
              <span>Event generated — review and edit below, then click <strong>Use Event</strong>.</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Title — full width */}
              <div className="sm:col-span-2">
                <EditableField label="Title" value={generated.title} onChange={update("title")} />
              </div>

              {/* Description — full width */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Description</label>
                <textarea
                  value={generated.description}
                  onChange={(e) => update("description")(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-sm outline-none resize-y focus:border-pink-400 focus:ring-1 focus:ring-pink-100 transition-all duration-200"
                />
              </div>

              {/* Category — dropdown matching common values */}
              <EditableField
                label="Category"
                value={generated.category}
                onChange={update("category")}
                options={CATEGORY_SUGGESTIONS}
              />

              {/* Location */}
              <EditableField label="Location" value={generated.location} onChange={update("location")} />

              {/* Event Type — must be In-person / Virtual / Hybrid */}
              <EditableField
                label="Event Type"
                value={generated.eventType}
                onChange={update("eventType")}
                options={["In-person", "Virtual", "Hybrid"]}
              />

              {/* Total Tickets → form.totalTickets */}
              <EditableField
                label="Total Tickets"
                value={generated.totalTickets}
                onChange={update("totalTickets")}
                type="number"
              />

              {/* Start Date → form.startDate (and endDate) */}
              <EditableField
                label="Start Date"
                value={generated.startDate}
                onChange={(v) => {
                  update("startDate")(v);
                  // also update endDate if it was defaulted to same day
                  if (generated.endDate === generated.startDate) update("endDate")(v);
                }}
                type="date"
              />

              {/* End Date → form.endDate */}
              <EditableField
                label="End Date"
                value={generated.endDate}
                onChange={update("endDate")}
                type="date"
              />

              {/* Start Time → form.startTime */}
              <EditableField
                label="Start Time"
                value={generated.startTime}
                onChange={update("startTime")}
                type="time"
              />

              {/* End Time — not generated but pre-filled so the form isn't blank */}
              <EditableField
                label="End Time"
                value={generated.endTime}
                onChange={update("endTime")}
                type="time"
              />

              {/* Ticket Price — affects form.pricing[0].price (Regular tier) */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Regular Ticket Price (₦)</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 focus-within:border-pink-400 transition-all duration-200">
                    <span className="text-sm font-bold text-gray-400 mr-1">₦</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={generated.ticketPrice}
                      onChange={(e) => {
                        const v = Number(e.target.value) || 0;
                        update("ticketPrice")(v);
                        update("isFree")(v === 0);
                      }}
                      className="flex-1 bg-transparent outline-none py-2 text-sm text-gray-900"
                    />
                  </div>
                  {/* Free event toggle — mirrors CreateEvent's isFreeEvent checkbox */}
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 bg-white text-xs font-bold text-gray-600 cursor-pointer transition-all duration-200 hover:border-pink-300 hover:bg-pink-50 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={generated.isFree}
                      onChange={(e) => {
                        update("isFree")(e.target.checked);
                        if (e.target.checked) update("ticketPrice")(0);
                      }}
                      className="accent-pink-500"
                    />
                    Free Event
                  </label>
                </div>
                {generated.isFree && (
                  <p className="text-xs text-pink-600 bg-pink-50 border border-pink-200 rounded-xl px-3 py-2 mt-1">
                    Free admission — attendees can reserve tickets without payment.
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setGenerated(null)}
                className="flex-1 py-2.5 rounded-full border-2 border-gray-200 bg-white text-gray-600 text-sm font-bold transition-all duration-200 hover:border-pink-300 hover:text-pink-500"
              >
                Back
              </button>
              <button
                onClick={handleApply}
                className="flex-1 py-2.5 rounded-full bg-pink-500 text-white text-sm font-bold transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 shadow-md shadow-pink-500/25"
              >
                Use Event
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TickiAIGenerator;