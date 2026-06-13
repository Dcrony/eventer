import { useState, useRef } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Edit2,
  ChevronDown,
  ArrowLeft,
  Wand2,
  Zap,
  Image,
  RefreshCw,
  Loader2,
  ChevronRight,
  X,
} from "lucide-react";
import API from "../api/axios";

/* ─── Constants ────────────────────────────────────────────────────────────── */

const EXAMPLE_PROMPTS = [
  "Tech meetup in Lagos for 200 people, ₦3000 ticket, VIP ₦8000",
  "Summer concert featuring live bands, free entry, 500 capacity",
  "Business networking breakfast in Abuja, ₦5000 per person",
  "Fitness bootcamp every Saturday, ₦1500, 50 participants max",
  "Comedy show at the waterfront, ₦8000, intimate 100-person venue",
  "Fashion showcase in Victoria Island, VIP ₦15000, Regular ₦7500",
  "Tech startup pitch night, free entry, 300 attendees, Lagos",
  "Gospel concert, hybrid event, free + VIP ₦5000, 1000 capacity",
];

const CATEGORY_OPTIONS = [
  "Tech", "Music", "Business", "Sports", "Arts", "Food & Drink",
  "Health", "Education", "Fashion", "Comedy", "Fitness", "Networking",
  "Film", "Religious", "Charity", "Other",
];
const EVENT_TYPE_OPTIONS  = ["In-person", "Virtual", "Hybrid"];
const VISIBILITY_OPTIONS  = ["public", "private"];
const STREAM_TYPE_OPTIONS = ["Camera", "YouTube", "Facebook", "Custom"];

/* ─── Normalizers ──────────────────────────────────────────────────────────── */

const normalizeDate = (raw) => {
  if (!raw) return "";
  try {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
  } catch { return ""; }
};

const normalizeTime = (raw) => {
  if (!raw) return "14:00";
  if (/^\d{2}:\d{2}$/.test(raw)) return raw;
  try {
    const d = new Date(`1970-01-01T${raw}`);
    if (!isNaN(d.getTime())) return d.toTimeString().slice(0, 5);
  } catch {}
  return "14:00";
};

/* ─── Primitive UI ─────────────────────────────────────────────────────────── */

const F = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-100";

function FieldLabel({ children }) {
  return (
    <label className="mb-1 block text-[0.62rem] font-bold uppercase tracking-[0.15em] text-gray-400">
      {children}
    </label>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 space-y-3">
      <div className="text-[0.62rem] font-bold uppercase tracking-[0.15em] text-gray-400">{title}</div>
      {children}
    </div>
  );
}

/* ─── Editable field (click-to-edit) ──────────────────────────────────────── */

function EditableField({ label, value, onChange, type = "text", options = null, fullWidth = false, multiline = false, placeholder = "" }) {
  const [editing, setEditing] = useState(false);
  const activeCls = `${F} border-2 border-pink-400`;

  if (multiline) {
    return (
      <div className={`space-y-1.5 ${fullWidth ? "sm:col-span-2" : ""}`}>
        <FieldLabel>{label}</FieldLabel>
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={placeholder} className={`${F} resize-y`} />
      </div>
    );
  }

  if (editing) {
    if (options) {
      return (
        <div className={`space-y-1.5 ${fullWidth ? "sm:col-span-2" : ""}`}>
          <FieldLabel>{label}</FieldLabel>
          <select value={value} onChange={(e) => { onChange(e.target.value); setEditing(false); }} onBlur={() => setEditing(false)} autoFocus className={activeCls}>
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      );
    }
    return (
      <div className={`space-y-1.5 ${fullWidth ? "sm:col-span-2" : ""}`}>
        <FieldLabel>{label}</FieldLabel>
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} onBlur={() => setEditing(false)} autoFocus className={activeCls} placeholder={placeholder} />
      </div>
    );
  }

  return (
    <div className={`space-y-1.5 ${fullWidth ? "sm:col-span-2" : ""}`}>
      <FieldLabel>{label}</FieldLabel>
      <div onClick={() => setEditing(true)} className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 transition hover:border-pink-300 hover:bg-pink-50/30">
        <span className="flex-1 truncate">{value || <span className="italic text-gray-400">{placeholder || "Not set"}</span>}</span>
        {options ? <ChevronDown size={12} className="shrink-0 text-gray-400" /> : <Edit2 size={12} className="shrink-0 text-gray-400" />}
      </div>
    </div>
  );
}

/* ─── Pricing row ──────────────────────────────────────────────────────────── */

function PricingRow({ tier, value, onChange, disabled }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
      <div className="min-w-0 flex-1 text-xs font-semibold text-gray-800">{tier}</div>
      <div className={`flex items-center rounded-lg border border-gray-200 bg-gray-50 px-2.5 ${disabled ? "opacity-40" : ""}`}>
        <span className="text-xs font-bold text-gray-400">₦</span>
        <input type="number" min="0" step="100" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder="0"
          className="w-20 border-0 bg-transparent py-2 text-right text-sm font-semibold text-gray-900 outline-none" />
      </div>
    </div>
  );
}

/* ─── Image generation panel ───────────────────────────────────────────────── */

function ImageGeneratorPanel({ eventTitle, eventDescription, imageSearchQuery, onImageSelect }) {
  const [loading, setLoading]     = useState(false);
  const [imageData, setImageData] = useState(null);
  const [error, setError]         = useState(null);
  const [query, setQuery]         = useState(imageSearchQuery || "");

  const fetchImage = async (customQuery) => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.post("/ai/generate-image", {
        title: eventTitle,
        description: eventDescription,
        searchQuery: customQuery || query || imageSearchQuery,
      });
      setImageData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch image. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUseImage = async () => {
    if (!imageData?.imageUrl) return;
    try {
      const res = await fetch(imageData.imageUrl);
      const blob = await res.blob();
      const file = new File([blob], "ai-cover.jpg", { type: blob.type || "image/jpeg" });
      onImageSelect(file, imageData.imageUrl);
    } catch {
      // If we can't fetch the blob (CORS), just pass the URL for preview
      onImageSelect(null, imageData.imageUrl);
    }
  };

  return (
    <div className="space-y-3">
      {/* Query editor */}
      <div>
        <FieldLabel>Image search keywords</FieldLabel>
        <div className="flex gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={imageSearchQuery || "e.g. tech event Lagos night"} className={`${F} flex-1`} />
          <button type="button" onClick={() => fetchImage(query)} disabled={loading}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-pink-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-pink-600 disabled:opacity-50">
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
            {loading ? "Finding…" : "Find"}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {imageData?.imageUrl && (
        <div className="space-y-2">
          <div className="relative overflow-hidden rounded-xl border border-gray-200">
            <img src={imageData.imageUrl} alt="AI suggested cover" className="h-36 w-full object-cover" />
            {imageData.photographer && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-[0.58rem] text-white/80">
                Photo by {imageData.photographer} on {imageData.source === "unsplash" ? "Unsplash" : "Picsum"}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => fetchImage(query)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white py-2 text-xs font-semibold text-gray-600 transition hover:border-pink-300 hover:text-pink-500">
              <RefreshCw size={11} /> Try another
            </button>
            <button type="button" onClick={handleUseImage}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-pink-500 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-pink-600">
              <CheckCircle2 size={11} /> Use this image
            </button>
          </div>
        </div>
      )}

      {!imageData && !loading && (
        <button type="button" onClick={() => fetchImage(query)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-pink-200 bg-pink-50/40 py-4 text-xs font-semibold text-pink-500 transition hover:bg-pink-50">
          <Image size={14} /> Generate AI cover image
        </button>
      )}
    </div>
  );
}

/* ─── Step indicator ───────────────────────────────────────────────────────── */

const AI_STEPS = [
  { id: 1, label: "Describe" },
  { id: 2, label: "Review"   },
  { id: 3, label: "Cover"    },
];

function AIStepBar({ current }) {
  return (
    <div className="flex items-center gap-1">
      {AI_STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center gap-1">
          <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[0.6rem] font-bold transition ${current >= s.id ? "bg-pink-500 text-white" : "bg-gray-100 text-gray-400"}`}>
            {current > s.id ? <CheckCircle2 size={10} /> : s.id}
          </div>
          <span className={`text-[0.6rem] font-semibold ${current >= s.id ? "text-pink-600" : "text-gray-400"}`}>{s.label}</span>
          {i < AI_STEPS.length - 1 && <div className={`mx-1 h-px w-4 ${current > s.id ? "bg-pink-300" : "bg-gray-200"}`} />}
        </div>
      ))}
    </div>
  );
}

/* ─── Main TickiAIGenerator ────────────────────────────────────────────────── */

/**
 * TickiAIGenerator
 *
 * Props:
 *  onGenerate(payload, imageFile, imagePreviewUrl), called when user applies the event.
 *    payload covers ALL CreateEvent wizard fields (Steps 1–4).
 *    imageFile may be null; imagePreviewUrl is a string URL if an image was chosen.
 *  compact, when true, render inline (no outer padding), used inside CreateEvent Step 1.
 */
const TickiAIGenerator = ({ onGenerate, compact = false }) => {
  const [aiStep,   setAiStep]   = useState(1);  // 1=prompt, 2=review, 3=cover
  const [prompt,   setPrompt]   = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [generated, setGenerated] = useState(null);
  const [isFree,   setIsFree]   = useState(false);

  // Image
  const [chosenImageFile,    setChosenImageFile]    = useState(null);
  const [chosenImagePreview, setChosenImagePreview] = useState(null);

  /* ── Generate ───────────────────────────────────────────────────────────── */

  const handleGenerate = async (e) => {
    e?.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) { setError("Describe your event to get started."); return; }
    setError(null);
    setLoading(true);
    try {
      const response = await API.post("/ai/generate-event", { prompt: trimmed });
      const raw = response.data.event;

      // Pricing, normalize the three tiers
      const slots = [{ type: "Regular", price: "" }, { type: "VIP", price: "" }, { type: "VVIP", price: "" }];
      let pricing = slots;
      if (Array.isArray(raw.pricing) && raw.pricing.length) {
        pricing = slots.map((def) => {
          const match = raw.pricing.find((p) => p.type?.toLowerCase() === def.type.toLowerCase());
          return match ? { type: def.type, price: match.price != null ? String(match.price) : "" } : def;
        });
      } else {
        const reg  = raw.regularPrice ?? raw.ticketPrice ?? 0;
        const vip  = raw.vipPrice  ?? 0;
        const vvip = raw.vvipPrice ?? 0;
        pricing = [
          { type: "Regular", price: reg  > 0 ? String(reg)  : "" },
          { type: "VIP",     price: vip  > 0 ? String(vip)  : "" },
          { type: "VVIP",    price: vvip > 0 ? String(vvip) : "" },
        ];
      }

      const inferFree = raw.isFree ?? raw.isFreeEvent ?? pricing.every((t) => !t.price || Number(t.price) === 0);
      const startDate  = normalizeDate(raw.startDate || raw.date);
      const startTime  = normalizeTime(raw.startTime || raw.time);

      setGenerated({
        // Step 1
        title:       raw.title || "",
        description: raw.description || "",
        category:    raw.category || "Other",
        eventType:   raw.eventType || "In-person",
        location:    raw.eventType === "Virtual" ? "" : (raw.location || ""),
        visibility:  raw.visibility || "public",
        startDate,
        endDate:     normalizeDate(raw.endDate) || startDate,
        startTime,
        endTime:     normalizeTime(raw.endTime) || startTime,
        // Step 3
        totalTickets: String(raw.totalTickets || raw.capacity || 100),
        pricing,
        // Step 4
        streamType: raw.streamType || "Camera",
        streamURL:  raw.streamURL  || "",
        // Image hint
        imageSearchQuery: raw.imageSearchQuery || raw.title || "",
      });
      setIsFree(Boolean(inferFree));
      setPrompt("");
      setAiStep(2);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to generate event. Try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Field updaters ─────────────────────────────────────────────────────── */

  const update = (key) => (value) => setGenerated((p) => ({ ...p, [key]: value }));

  const updatePricingTier = (index, value) =>
    setGenerated((p) => ({
      ...p,
      pricing: p.pricing.map((t, i) => (i === index ? { ...t, price: value } : t)),
    }));

  /* ── Apply to CreateEvent ─────────────────────────────────────────────────
   *
   * Payload is shaped to match CreateEvent's handleAI() function exactly.
   * We include all extended fields so handleAI can set ALL form fields.
   * ─────────────────────────────────────────────────────────────────────── */
  const handleApply = () => {
    if (!generated) return;
    const payload = {
      // Original handleAI keys
      title:       generated.title,
      description: generated.description,
      category:    generated.category,
      location:    generated.location,
      date:        generated.startDate,
      time:        generated.startTime,
      capacity:    generated.totalTickets,
      ticketPrice: Number(generated.pricing?.[0]?.price) || 0,
      isFree,
      eventType:   generated.eventType,
      // Extended keys
      endDate:     generated.endDate,
      endTime:     generated.endTime,
      visibility:  generated.visibility,
      streamType:  generated.streamType,
      streamURL:   generated.streamURL,
      pricing:     isFree ? [] : generated.pricing.map((t) => ({ ...t, price: t.price || "0" })),
      totalTickets: generated.totalTickets,
      startDate:   generated.startDate,
      startTime:   generated.startTime,
    };
    if (onGenerate) onGenerate(payload, chosenImageFile, chosenImagePreview);
  };

  /* ── Image selection ─────────────────────────────────────────────────────── */

  const handleImageSelect = (file, previewUrl) => {
    setChosenImageFile(file);
    setChosenImagePreview(previewUrl);
  };

  /* ── Render: step 1, prompt screen ────────────────────────────────────── */

  if (aiStep === 1) {
    return (
      <div className="space-y-4">
        {/* AI steps indicator */}
        <div className="flex items-center justify-between">
          <AIStepBar current={1} />
        </div>

        {/* Prompt textarea */}
        <div>
          <FieldLabel>Describe your event in plain English</FieldLabel>
          <textarea
            value={prompt}
            onChange={(e) => { setPrompt(e.target.value); setError(null); }}
            placeholder="e.g. Tech meetup in Lagos for 200 people, ₦3000 Regular, ₦8000 VIP, Saturday afternoon"
            disabled={loading}
            rows={3}
            className={`${F} resize-none disabled:opacity-50`}
          />
          {error && (
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              <AlertCircle size={13} /> {error}
            </div>
          )}
        </div>

        {/* Generate button */}
        <button type="button" onClick={handleGenerate} disabled={loading || !prompt.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 py-2.5 text-sm font-bold text-white shadow-md shadow-pink-500/25 transition-all duration-200 hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? (
            <><Loader2 size={14} className="animate-spin" /> Generating all 5 steps…</>
          ) : (
            <><Zap size={14} /> Generate complete event</>
          )}
        </button>

        {/* What AI will fill */}
        <div className="rounded-xl border border-pink-100 bg-pink-50/40 px-3 py-2.5">
          <p className="mb-1.5 text-[0.6rem] font-bold uppercase tracking-[0.15em] text-pink-400">AI will auto-fill</p>
          <div className="flex flex-wrap gap-1.5">
            {["Title & description", "Category & type", "Date & time", "Venue", "Ticket tiers (Regular/VIP/VVIP)", "Capacity", "Visibility", "Livestream settings", "Cover image suggestion"].map((item) => (
              <span key={item} className="rounded-full bg-white px-2 py-0.5 text-[0.62rem] font-medium text-gray-600 shadow-sm border border-gray-100">{item}</span>
            ))}
          </div>
        </div>

        {/* Example prompts */}
        <div>
          <p className="mb-2 text-[0.62rem] font-bold uppercase tracking-[0.15em] text-gray-400">Examples</p>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_PROMPTS.map((ex) => (
              <button key={ex} type="button" onClick={() => { setPrompt(ex); setError(null); }}
                className="rounded-full bg-gray-100 px-2.5 py-1 text-[0.67rem] font-medium text-gray-600 transition hover:bg-pink-100 hover:text-pink-600">
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Render: step 2, review & edit ────────────────────────────────────── */

  if (aiStep === 2) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <AIStepBar current={2} />
          <button type="button" onClick={() => { setGenerated(null); setAiStep(1); setIsFree(false); }}
            className="flex items-center gap-1 text-[0.67rem] font-semibold text-gray-400 transition hover:text-gray-600">
            <ArrowLeft size={11} /> Back
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          <CheckCircle2 size={13} />
          <span>Event generated, review each field, then click <strong>Continue to cover image</strong>.</span>
        </div>

        {/* ── Basic info ─────────────────────────────────────────────────── */}
        <Section title="Basic info">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <EditableField label="Title" value={generated.title} onChange={update("title")} fullWidth />
            <EditableField label="Description" value={generated.description} onChange={update("description")} multiline fullWidth />
            <EditableField label="Category" value={generated.category} onChange={update("category")} options={CATEGORY_OPTIONS} />
            <EditableField label="Event type" value={generated.eventType} onChange={update("eventType")} options={EVENT_TYPE_OPTIONS} />
            {generated.eventType !== "Virtual" && (
              <EditableField label="Venue / Location" value={generated.location} onChange={update("location")} placeholder="Address or venue name" />
            )}
            <EditableField label="Visibility" value={generated.visibility} onChange={update("visibility")} options={VISIBILITY_OPTIONS} />
          </div>
        </Section>

        {/* ── Schedule ───────────────────────────────────────────────────── */}
        <Section title="Schedule">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <EditableField label="Start date" value={generated.startDate} onChange={update("startDate")} type="date" />
            <EditableField label="Start time" value={generated.startTime} onChange={update("startTime")} type="time" />
            <EditableField label="End date"   value={generated.endDate}   onChange={update("endDate")}   type="date" />
            <EditableField label="End time"   value={generated.endTime}   onChange={update("endTime")}   type="time" />
          </div>
        </Section>

        {/* ── Tickets & pricing ──────────────────────────────────────────── */}
        <Section title="Tickets & pricing">
          <div className="flex items-center justify-between">
            <span className="text-[0.62rem] text-gray-500">Leave VIP/VVIP blank if not needed.</span>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-[0.67rem] font-semibold text-gray-700 transition hover:bg-gray-50">
              <input type="checkbox" checked={isFree} onChange={(e) => { setIsFree(e.target.checked); if (e.target.checked) setGenerated((p) => ({ ...p, pricing: p.pricing.map((t) => ({ ...t, price: "" })) })); }} className="accent-pink-500" />
              Free event
            </label>
          </div>
          <div>
            <FieldLabel>Total tickets</FieldLabel>
            <input type="number" min="1" value={generated.totalTickets} onChange={(e) => update("totalTickets")(e.target.value)} className={F} />
          </div>
          {isFree ? (
            <div className="rounded-xl border border-pink-200 bg-pink-50 px-3 py-2 text-xs text-pink-700">
              Free event, attendees reserve without payment.
            </div>
          ) : (
            <div className="space-y-2">
              {generated.pricing.map((tier, i) => (
                <PricingRow key={tier.type} tier={tier.type} value={tier.price} onChange={(v) => updatePricingTier(i, v)} disabled={isFree} />
              ))}
            </div>
          )}
        </Section>

        {/* ── Livestream ─────────────────────────────────────────────────── */}
        <Section title="Livestream (optional)">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <EditableField label="Stream type" value={generated.streamType} onChange={update("streamType")} options={STREAM_TYPE_OPTIONS} />
            {generated.streamType !== "Camera" && (
              <EditableField label="Stream URL" value={generated.streamURL} onChange={update("streamURL")} placeholder="https://…" />
            )}
          </div>
        </Section>

        {/* ── Actions ────────────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <button type="button" onClick={() => { setGenerated(null); setAiStep(1); setIsFree(false); }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full border-2 border-gray-200 bg-white py-2.5 text-sm font-bold text-gray-600 transition hover:border-pink-300 hover:text-pink-500">
            <ArrowLeft size={13} /> Regenerate
          </button>
          <button type="button" onClick={() => setAiStep(3)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-pink-500 py-2.5 text-sm font-bold text-white shadow-md shadow-pink-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-pink-600">
            Cover image <ChevronRight size={13} />
          </button>
        </div>
      </div>
    );
  }

  /* ── Render: step 3, cover image ──────────────────────────────────────── */

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <AIStepBar current={3} />
        <button type="button" onClick={() => setAiStep(2)}
          className="flex items-center gap-1 text-[0.67rem] font-semibold text-gray-400 transition hover:text-gray-600">
          <ArrowLeft size={11} /> Back
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
        <Image size={13} />
        <span>Add a cover image, or skip to go straight to preview.</span>
      </div>

      {/* Image generator */}
      <Section title="AI cover image">
        <ImageGeneratorPanel
          eventTitle={generated?.title}
          eventDescription={generated?.description}
          imageSearchQuery={generated?.imageSearchQuery}
          onImageSelect={handleImageSelect}
        />

        {/* Show chosen image */}
        {chosenImagePreview && (
          <div className="space-y-2">
            <div className="relative overflow-hidden rounded-xl border-2 border-pink-300">
              <img src={chosenImagePreview} alt="Chosen cover" className="h-36 w-full object-cover" />
              <div className="absolute right-2 top-2">
                <span className="rounded-full bg-green-500 px-2 py-0.5 text-[0.62rem] font-bold text-white shadow">Selected</span>
              </div>
              <button type="button" onClick={() => { setChosenImageFile(null); setChosenImagePreview(null); }}
                className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70">
                <X size={11} />
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* Apply buttons */}
      <div className="flex gap-3">
        <button type="button" onClick={handleApply}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border-2 border-gray-200 bg-white py-2.5 text-sm font-bold text-gray-600 transition hover:border-pink-300 hover:text-pink-500">
          Skip image, Apply event
        </button>
        <button type="button" onClick={handleApply}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-pink-500 py-2.5 text-sm font-bold text-white shadow-md shadow-pink-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-pink-600">
          <Wand2 size={13} /> Use this event
        </button>
      </div>
    </div>
  );
};

export default TickiAIGenerator;