import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Edit2,
  Globe2,
  ImagePlus,
  Lock,
  MapPin,
  Menu,
  MonitorPlay,
  Radio,
  RotateCcw,
  Save,
  Sparkles,
  Ticket,
  Upload,
  Users,
  Wand2,
  X,
  Zap,
  Check,
  Tag,
  Palette,
  ToggleLeft,
  ToggleRight,
  Gift,
  Settings2,
  ChevronUp,
  Plus,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import Button from "../components/ui/button";
import { useToast } from "../components/ui/toast";
import useFeatureAccess from "../hooks/useFeatureAccess";
import teamService from "../services/api/team";
import { validateImageFile } from "../utils/imageUpload";
import TickiAIGenerator from "../components/TickiAIGenerator";

/* ─── Constants ─────────────────────────────────────────────────────────────── */

const DRAFT_STORAGE_KEY = "tickispot-create-event-draft-v1";

const eventTypes = [
  { name: "In-person", icon: Building2, hint: "Venue-based with guests on-site." },
  { name: "Virtual", icon: MonitorPlay, hint: "Online workshops, classes, broadcasts." },
  { name: "Hybrid", icon: Globe2, hint: "Physical + online livestream." },
];

const teamRoles = [
  { value: "co_organizer", label: "Co Organizer" },
  { value: "ticket_manager", label: "Ticket Manager" },
  { value: "analytics_viewer", label: "Analytics Viewer" },
  { value: "livestream_moderator", label: "Livestream Moderator" },
  { value: "checkin_staff", label: "Check-in Staff" },
];

const steps = [
  { id: 1, title: "Basic Info", icon: Calendar },
  { id: 2, title: "Media & AI", icon: ImagePlus },
  { id: 3, title: "Tickets", icon: Ticket },
  { id: 4, title: "Settings", icon: Radio },
  { id: 5, title: "Preview", icon: CheckCircle2 },
];

const CATEGORY_OPTIONS = [
  "Tech", "Music", "Business", "Sports", "Arts", "Food & Drink",
  "Health", "Education", "Fashion", "Comedy", "Fitness", "Networking",
  "Film", "Religious", "Charity", "Other",
];

/* Preset accent colours for tier colour picker */
const TIER_COLORS = [
  { label: "Pink", value: "#ec4899" },
  { label: "Violet", value: "#8b5cf6" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Cyan", value: "#06b6d4" },
  { label: "Green", value: "#22c55e" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Rose", value: "#f43f5e" },
  { label: "Slate", value: "#64748b" },
];

/* ─── Default tier shape ─────────────────────────────────────────────────────── */
const makeTier = (overrides = {}) => ({
  type: "",
  price: "",
  isEnabled: true,
  isFree: false,
  isRefundable: true,
  isTransferable: true,
  label: "",
  color: "",
  description: "",
  benefits: "",
  groupSize: "1",
  availableQuantity: "",
  saleStartDate: "",
  saleEndDate: "",
  priceIncreaseDate: "",
  maxPerOrder: "",
  ...overrides,
});

const DEFAULT_PRICING = [
  makeTier({ type: "Regular" }),
  makeTier({ type: "VIP" }),
  makeTier({ type: "VVIP" }),
];

/* ─── Default state ──────────────────────────────────────────────────────────── */

const defaultForm = {
  title: "", description: "", category: "", location: "",
  streamType: "Camera", streamURL: "",
  eventType: "In-person", visibility: "public",
  startDate: "", startTime: "", endDate: "", endTime: "",
  pricing: DEFAULT_PRICING,
  totalTickets: "",
};

const emptyRecoveryState = {
  form: defaultForm, isFreeEvent: false, teamMembers: [],
  draftId: null, imagePreview: null, imageName: "",
  updatedAt: null, step: 1,
};

/* ─── Normalizers ────────────────────────────────────────────────────────────── */

const normalizeEventType = (type, location) => {
  const t = (type || location || "").toLowerCase();
  if (t.includes("virtual") || t.includes("online")) return "Virtual";
  if (t.includes("hybrid")) return "Hybrid";
  return "In-person";
};

const normalizeDate = (raw) => {
  if (!raw) return "";
  try { const d = new Date(raw); return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0]; }
  catch { return ""; }
};

const normalizeTime = (raw) => {
  if (!raw) return "14:00";
  if (/^\d{2}:\d{2}$/.test(raw)) return raw;
  try {
    const d = new Date(`1970-01-01T${raw}`);
    if (!isNaN(d.getTime())) return d.toTimeString().slice(0, 5);
  } catch { }
  return "14:00";
};

const normalizePricingFromServer = (pricing) => {
  if (!Array.isArray(pricing) || !pricing.length) return DEFAULT_PRICING;
  return pricing.map((t) => makeTier({
    type: t?.type || "",
    price: t?.price != null ? String(t.price) : "",
    isEnabled: t?.isEnabled !== false,
    isFree: Boolean(t?.isFree),
    isRefundable: t?.isRefundable !== false,
    isTransferable: t?.isTransferable !== false,
    label: t?.label || "",
    color: t?.color || "",
    description: t?.description || "",
    benefits: t?.benefits || "",
    groupSize: t?.groupSize != null ? String(t.groupSize) : "1",
    availableQuantity: t?.availableQuantity != null ? String(t.availableQuantity) : "",
    saleStartDate: t?.saleStartDate || "",
    saleEndDate: t?.saleEndDate || "",
    priceIncreaseDate: t?.priceIncreaseDate || "",
    maxPerOrder: t?.maxPerOrder ? String(t.maxPerOrder) : "",
  }));
};

const sanitizeRecoveryPayload = (value) => {
  if (!value || typeof value !== "object") return emptyRecoveryState;
  return {
    form: {
      ...defaultForm,
      ...(value.form || {}),
      pricing:
        Array.isArray(value.form?.pricing) && value.form.pricing.length
          ? value.form.pricing.map((t) => makeTier(t))
          : DEFAULT_PRICING,
    },
    isFreeEvent: Boolean(value.isFreeEvent),
    teamMembers: Array.isArray(value.teamMembers) ? value.teamMembers : [],
    draftId: value.draftId || null,
    imagePreview: value.imagePreview || null,
    imageName: value.imageName || "",
    updatedAt: value.updatedAt || null,
    step: Math.min(5, Math.max(1, Number(value.step || 1))),
  };
};

const normalizeEventToWizardState = (event) =>
  sanitizeRecoveryPayload({
    form: {
      ...defaultForm,
      title: event?.title || "",
      description: event?.description || "",
      category: event?.category || "",
      location: event?.location || "",
      streamType: event?.liveStream?.streamType || "Camera",
      streamURL: event?.liveStream?.streamURL || "",
      eventType: event?.eventType || "In-person",
      visibility: event?.visibility || "public",
      startDate: event?.startDate ? String(event.startDate).slice(0, 10) : "",
      startTime: event?.startTime || "",
      endDate: event?.endDate ? String(event.endDate).slice(0, 10) : "",
      endTime: event?.endTime || "",
      pricing: normalizePricingFromServer(event?.pricing),
      totalTickets: event?.totalTickets != null ? String(event.totalTickets) : "",
    },
    isFreeEvent: Boolean(event?.isFree || event?.isFreeEvent),
    teamMembers: Array.isArray(event?.draftTeamMembers) ? event.draftTeamMembers : [],
    draftId: event?._id || null,
    imagePreview: event?.image || null,
    imageName: event?.image ? "Saved event image" : "",
    updatedAt: event?.draftUpdatedAt || event?.updatedAt || event?.createdAt,
    step: Number(event?.draftStep || 1),
  });

/* ─── Step validation ────────────────────────────────────────────────────────── */

const getStepValidation = (step, form, isFreeEvent) => {
  if (step === 1) {
    if (!form.title.trim()) return "Add an event title to continue.";
    if (!form.description.trim()) return "Add a short event description.";
    if (!form.category.trim()) return "Choose a category for your event.";
    if (!form.startDate || !form.startTime || !form.endDate || !form.endTime)
      return "Complete the event schedule before moving on.";
    if (!form.location.trim() && form.eventType !== "Virtual")
      return "Add a location for your event.";
  }
  if (step === 3) {
    if (!form.totalTickets || Number(form.totalTickets) <= 0)
      return "Set how many tickets are available.";
    if (!isFreeEvent) {
      const enabledPaid = form.pricing.filter(
        (t) => t.isEnabled && !t.isFree && Number(t.price) > 0
      );
      if (!enabledPaid.length) return "Add at least one enabled paid ticket tier.";
    }
  }
  if (step === 4 && form.streamType !== "Camera" && !form.streamURL.trim())
    return "Add the livestream URL for the selected stream type.";
  return "";
};

/* ─── Primitive UI ───────────────────────────────────────────────────────────── */

function FieldLabel({ children }) {
  return (
    <label className="mb-1 block text-[0.62rem] font-bold uppercase tracking-[0.15em] text-gray-400">
      {children}
    </label>
  );
}

const F =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-100";

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white p-4 ${className}`}>
      {children}
    </div>
  );
}

function StepBtn({ step, activeStep, onClick }) {
  const Icon = step.icon;
  const active = step.id === activeStep;
  const done = step.id < activeStep;
  return (
    <button
      type="button"
      onClick={() => onClick(step.id)}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition ${active ? "bg-pink-50 text-pink-700"
        : done ? "bg-green-50 text-green-700"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        }`}
    >
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${active ? "bg-pink-500 text-white"
        : done ? "bg-green-500 text-white"
          : "bg-gray-100 text-gray-400"
        }`}>
        <Icon size={13} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-semibold">{step.title}</div>
        <div className="text-[0.58rem] opacity-50">Step {step.id}</div>
      </div>
      {active && <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-pink-400" />}
    </button>
  );
}

/* ─── TierEditor ─────────────────────────────────────────────────────────────── */
/**
 * Renders a single pricing tier row with:
 *  - enable / disable toggle
 *  - price field (locked to 0 when isFree is on)
 *  - per-tier "free" toggle
 *  - expandable customisation panel (label, color, description, maxPerOrder)
 *  - delete button (only for custom tiers, i.e. non-default ones)
 */
function TierEditor({ tier, index, onChange, onDelete, isEventFree }) {
  const [expanded, setExpanded] = useState(false);

  const update = (patch) => onChange(index, { ...tier, ...patch });

  const displayName = tier.label || tier.type || `Tier ${index + 1}`;
  const accentColor = tier.color || "#ec4899";

  return (
    <div
      className={`rounded-2xl border transition-all ${tier.isEnabled
        ? "border-gray-200 bg-white"
        : "border-gray-100 bg-gray-50/60 opacity-60"
        }`}
    >
      {/* ── Main row ── */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Colour dot */}
        <div
          className="h-3 w-3 shrink-0 rounded-full ring-2 ring-offset-1 ring-gray-100"
          style={{ backgroundColor: accentColor }}
        />

        {/* Name */}
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-gray-900">{displayName}</div>
          {tier.description && (
            <div className="truncate text-[0.62rem] text-gray-400">{tier.description}</div>
          )}
        </div>

        {/* Price */}
        {!isEventFree && (
          <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-2.5">
            <span className="text-xs font-bold text-gray-400">₦</span>
            <input
              type="number"
              min="0"
              step="100"
              value={tier.isFree ? "0" : tier.price}
              disabled={!tier.isEnabled || tier.isFree}
              onChange={(e) => update({ price: e.target.value })}
              placeholder="0"
              className="w-20 border-0 bg-transparent py-2 text-right text-sm font-semibold text-gray-900 outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        )}

        {/* Per-tier free badge */}
        {!isEventFree && tier.isEnabled && (
          <button
            type="button"
            title={tier.isFree ? "Remove free override" : "Make this tier free"}
            onClick={() => update({ isFree: !tier.isFree, price: !tier.isFree ? "0" : tier.price })}
            className={`flex h-6 items-center gap-1 rounded-full px-2 text-[0.6rem] font-bold transition ${tier.isFree
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
          >
            <Gift size={10} />
            {tier.isFree ? "Free" : "Set free"}
          </button>
        )}

        {/* Enable toggle */}
        <button
          type="button"
          title={tier.isEnabled ? "Disable tier" : "Enable tier"}
          onClick={() => update({ isEnabled: !tier.isEnabled })}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition hover:bg-gray-100"
        >
          {tier.isEnabled
            ? <ToggleRight size={18} className="text-pink-500" />
            : <ToggleLeft size={18} className="text-gray-400" />
          }
        </button>

        {/* Customise expand */}
        <button
          type="button"
          title="Customise tier"
          onClick={() => setExpanded((p) => !p)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition hover:bg-gray-100 text-gray-400"
        >
          <Settings2 size={14} />
        </button>

        {/* Delete (only non-default custom tiers) */}
        {onDelete && (
          <button
            type="button"
            title="Remove tier"
            onClick={() => onDelete(index)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition hover:bg-red-50 text-gray-300 hover:text-red-400"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* ── Expanded customisation ── */}
      {expanded && (
        <div className="border-t border-gray-100 px-3 py-3 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Display label */}
            <div>
              <FieldLabel>Display name (optional)</FieldLabel>
              <input
                value={tier.label}
                onChange={(e) => update({ label: e.target.value })}
                placeholder={`e.g. Early Bird ${tier.type}`}
                className={F}
              />
              <p className="mt-1 text-[0.6rem] text-gray-400">Overrides "{tier.type}" in checkout</p>
            </div>

            {/* Max per order */}
            <div>
              <FieldLabel>Max per order</FieldLabel>
              <input
                type="number"
                min="0"
                value={tier.maxPerOrder}
                onChange={(e) => update({ maxPerOrder: e.target.value })}
                placeholder="Unlimited"
                className={F}
              />
              <p className="mt-1 text-[0.6rem] text-gray-400">0 = no limit</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <FieldLabel>Benefit description (optional)</FieldLabel>
            <input
              value={tier.description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="e.g. Front-row seat + free drink"
              className={F}
            />
          </div>

          <div>
            <FieldLabel>Benefits summary (optional)</FieldLabel>
            <input
              value={tier.benefits}
              onChange={(e) => update({ benefits: e.target.value })}
              placeholder="e.g. Priority entry, complimentary drink"
              className={F}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Refundable</FieldLabel>
              <label className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={tier.isRefundable}
                  onChange={() => update({ isRefundable: !tier.isRefundable })}
                  className="accent-pink-500"
                />
                Allowed
              </label>
            </div>
            <div>
              <FieldLabel>Transferable</FieldLabel>
              <label className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={tier.isTransferable}
                  onChange={() => update({ isTransferable: !tier.isTransferable })}
                  className="accent-pink-500"
                />
                Allowed
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <FieldLabel>Group size</FieldLabel>
              <input
                type="number"
                min="1"
                value={tier.groupSize}
                onChange={(e) => update({ groupSize: e.target.value })}
                className={F}
              />
            </div>
            <div>
              <FieldLabel>Available quantity</FieldLabel>
              <input
                type="number"
                min="0"
                value={tier.availableQuantity}
                onChange={(e) => update({ availableQuantity: e.target.value })}
                className={F}
              />
            </div>
            <div>
              <FieldLabel>Max per order</FieldLabel>
              <input
                type="number"
                min="0"
                value={tier.maxPerOrder}
                onChange={(e) => update({ maxPerOrder: e.target.value })}
                placeholder="Unlimited"
                className={F}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <FieldLabel>Sale starts</FieldLabel>
              <input
                type="date"
                value={tier.saleStartDate}
                onChange={(e) => update({ saleStartDate: e.target.value })}
                className={F}
              />
            </div>
            <div>
              <FieldLabel>Sale ends</FieldLabel>
              <input
                type="date"
                value={tier.saleEndDate}
                onChange={(e) => update({ saleEndDate: e.target.value })}
                className={F}
              />
            </div>
            <div>
              <FieldLabel>Price increase</FieldLabel>
              <input
                type="date"
                value={tier.priceIncreaseDate}
                onChange={(e) => update({ priceIncreaseDate: e.target.value })}
                className={F}
              />
            </div>
          </div>

          {/* Colour picker */}
          <div>
            <FieldLabel>Accent colour</FieldLabel>
            <div className="flex flex-wrap items-center gap-2">
              {TIER_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => update({ color: c.value })}
                  className={`h-6 w-6 rounded-full transition ring-offset-1 ${tier.color === c.value ? "ring-2 ring-gray-400 scale-110" : "hover:scale-110"
                    }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
              {/* Custom hex */}
              <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-2 py-1">
                <Palette size={11} className="text-gray-400" />
                <input
                  type="text"
                  value={tier.color}
                  onChange={(e) => update({ color: e.target.value })}
                  placeholder="#hex"
                  className="w-16 border-0 bg-transparent text-xs outline-none text-gray-700"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main CreateEvent ───────────────────────────────────────────────────────── */

export default function CreateEvent({ isOpen, onClose, initialOptions = null }) {
  const toast = useToast();
  const navigate = useNavigate();
  const { hasAccess: canUseTickiAI, promptUpgrade: promptUpgradeAI } = useFeatureAccess("tickiai");
  const { hasAccess: canUsePrivateEvents, promptUpgrade: promptUpgradePrivate } = useFeatureAccess("private_events");
  const { hasAccess: canUseLiveStreaming, promptUpgrade: promptUpgradeLive } = useFeatureAccess("live_stream");

  const [form, setForm] = useState(defaultForm);
  const [activeStep, setActiveStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [showAIGen, setShowAIGen] = useState(false);
  const [isFreeEvent, setIsFreeEvent] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("co_organizer");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [draftId, setDraftId] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [saveState, setSaveState] = useState("idle");
  const [loadingSession, setLoadingSession] = useState(false);
  const [recoverableDraft, setRecoverableDraft] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const hasHydratedRef = useRef(false);
  const autosaveTimerRef = useRef(null);

  const stepError = useMemo(
    () => getStepValidation(activeStep, form, isFreeEvent),
    [activeStep, form, isFreeEvent]
  );

  /* Lock body scroll */
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  /* ── Wizard reset ── */
  const resetWizard = () => {
    setForm(defaultForm); setActiveStep(1); setSubmitting(false);
    setShowAIGen(false); setIsFreeEvent(false); setTeamMembers([]);
    setNewEmail(""); setNewRole("co_organizer");
    setImageFile(null); setImagePreview(null); setDraftId(null);
    setLastSavedAt(null); setSaveState("idle"); setRecoverableDraft(null);
    setDrawerOpen(false);
  };

  const applyWizardState = (state) => {
    const n = sanitizeRecoveryPayload(state);
    setForm(n.form); setIsFreeEvent(n.isFreeEvent); setTeamMembers(n.teamMembers);
    setDraftId(n.draftId); setImagePreview(n.imagePreview); setImageFile(null);
    setActiveStep(n.step); setLastSavedAt(n.updatedAt ? new Date(n.updatedAt) : null);
  };

  const persistLocal = (overrides = {}) => {
    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        form, isFreeEvent, teamMembers, draftId, imagePreview,
        imageName: imageFile?.name || overrides.imageName || "",
        updatedAt: new Date().toISOString(),
        step: activeStep,
        ...overrides,
      })
    );
  };

  /* ── Draft save ── */
  const saveDraft = async ({ silent = false } = {}) => {
    if (!isOpen) return null;
    if (!form.title.trim() && !form.description.trim() && !imagePreview && !imageFile) return null;
    try {
      setSaveState("saving");
      persistLocal();
      const payload = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "pricing") payload.append("pricing", JSON.stringify(isFreeEvent ? [] : v));
        else payload.append(k, v ?? "");
      });
      payload.append("isFree", isFreeEvent ? "true" : "false");
      payload.append("draftStep", String(activeStep));
      payload.append("teamMembers", JSON.stringify(teamMembers));
      if (draftId) payload.append("draftId", draftId);
      if (imageFile) payload.append("image", imageFile);
      const response = await API.post("/events/drafts", payload);
      const saved = response.data?.draft;
      if (saved?._id) {
        setDraftId(saved._id);
        setLastSavedAt(new Date(saved.draftUpdatedAt || Date.now()));
        setSaveState("saved");
        persistLocal({ draftId: saved._id, updatedAt: saved.draftUpdatedAt || new Date().toISOString() });
      }
      if (!silent) toast.success("Draft saved.");
      return saved;
    } catch (err) {
      setSaveState("error");
      if (!silent) toast.error(err.response?.data?.message || "Failed to save draft");
      return null;
    }
  };

  /* ── Hydration ── */
  useEffect(() => {
    if (!isOpen) {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      hasHydratedRef.current = false;
      resetWizard();
      return;
    }
    if (hasHydratedRef.current) return;
    hasHydratedRef.current = true;
    setLoadingSession(true);
    const hydrate = async () => {
      try {
        if (initialOptions?.draftEvent) {
          applyWizardState(normalizeEventToWizardState(initialOptions.draftEvent));
          return;
        }
        if (initialOptions?.duplicateEventId) {
          const r = await API.post(`/events/${initialOptions.duplicateEventId}/duplicate`);
          if (r.data?.draft) {
            applyWizardState(normalizeEventToWizardState(r.data.draft));
            toast.success("Event duplicated. Review and publish.");
            return;
          }
        }
        const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
        const local = raw ? sanitizeRecoveryPayload(JSON.parse(raw)) : null;
        const res = await API.get("/events/drafts/latest");
        const remote = res.data?.draft ? normalizeEventToWizardState(res.data.draft) : null;
        if (initialOptions?.resumeLatest && remote?.draftId) { applyWizardState(remote); return; }
        const lt = local?.updatedAt ? new Date(local.updatedAt).getTime() : 0;
        const rt = remote?.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
        if (lt || rt) setRecoverableDraft(lt >= rt ? local : remote);
      } catch (e) {
        console.error("Hydrate error:", e);
      } finally {
        setLoadingSession(false);
      }
    };
    hydrate();
  }, [initialOptions, isOpen]);

  /* ── Autosave ── */
  useEffect(() => {
    if (!isOpen || !hasHydratedRef.current || loadingSession) return;
    persistLocal();
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => saveDraft({ silent: true }), 1400);
    return () => { if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current); };
  }, [activeStep, draftId, form, imageFile, imagePreview, isFreeEvent, isOpen, loadingSession, teamMembers]);

  /* ── Field handlers ── */
  const hc = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  /* Per-tier update */
  const handleTierChange = (index, updatedTier) => {
    setForm((p) => ({
      ...p,
      pricing: p.pricing.map((t, ti) => (ti === index ? updatedTier : t)),
    }));
  };

  /* Delete custom tier */
  const handleTierDelete = (index) => {
    setForm((p) => ({
      ...p,
      pricing: p.pricing.filter((_, ti) => ti !== index),
    }));
  };

  /* Add new custom tier */
  const handleAddTier = () => {
    setForm((p) => ({
      ...p,
      pricing: [
        ...p.pricing,
        makeTier({ type: `Tier ${p.pricing.length + 1}`, color: TIER_COLORS[p.pricing.length % TIER_COLORS.length].value }),
      ],
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateImageFile(file);
    if (err) { toast.error(err); e.target.value = ""; return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleAddMember = () => {
    const email = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Enter a valid email."); return; }
    if (teamMembers.some((m) => m.email === email)) { toast.error("Already added."); return; }
    setTeamMembers((p) => [...p, { email, role: newRole }]);
    setNewEmail(""); setNewRole("co_organizer");
  };

  /* ── handleAI ── */
  const handleAI = (aiData, aiImageFile = null, aiImagePreview = null) => {
    setForm((prev) => {
      let nextPricing = prev.pricing;
      const normalizedAIPricing = Array.isArray(aiData.pricing) && aiData.pricing.length
        ? aiData.pricing
            .map((tier) => ({
              type: String(tier?.type || tier?.label || tier?.name || "").trim(),
              price: tier?.price != null
                ? String(tier.price)
                : tier?.amount != null
                  ? String(tier.amount)
                  : "",
              isEnabled: tier?.isEnabled !== false,
              isFree: Boolean(tier?.isFree) || Number(tier?.price ?? tier?.amount ?? 0) === 0,
              isRefundable: tier?.isRefundable !== false,
              isTransferable: tier?.isTransferable !== false,
              label: tier?.label || "",
              color: tier?.color || "",
              description: tier?.description || "",
              benefits: tier?.benefits || "",
              groupSize: tier?.groupSize != null ? String(tier.groupSize) : "1",
              availableQuantity: tier?.availableQuantity != null ? String(tier.availableQuantity) : "",
              saleStartDate: tier?.saleStartDate || "",
              saleEndDate: tier?.saleEndDate || "",
              priceIncreaseDate: tier?.priceIncreaseDate || "",
              maxPerOrder: tier?.maxPerOrder != null ? String(tier.maxPerOrder) : "",
            }))
            .filter((tier) => tier.type)
        : [];

      if (normalizedAIPricing.length) {
        const existingByType = new Map(prev.pricing.map((tier) => [String(tier.type || "").toLowerCase(), tier]));
        const merged = normalizedAIPricing.map((aiTier) => {
          const existing = existingByType.get(aiTier.type.toLowerCase());
          return {
            ...existing,
            ...aiTier,
            price: aiTier.price != null ? aiTier.price : existing?.price || "",
            groupSize: aiTier.groupSize || existing?.groupSize || "1",
            availableQuantity: aiTier.availableQuantity || existing?.availableQuantity || "",
            maxPerOrder: aiTier.maxPerOrder || existing?.maxPerOrder || "",
          };
        });
        const appended = prev.pricing.filter((tier) => !normalizedAIPricing.some((aiTier) => aiTier.type.toLowerCase() === String(tier.type || "").toLowerCase()));
        nextPricing = [...merged, ...appended];
      } else if (aiData.ticketPrice != null) {
        nextPricing = prev.pricing.map((t) =>
          t.type === "Regular"
            ? { ...t, price: aiData.ticketPrice > 0 ? String(aiData.ticketPrice) : "" }
            : t
        );
      }

      return {
        ...prev,
        title: aiData.title || prev.title,
        description: aiData.description || prev.description,
        category: aiData.category || prev.category,
        location: aiData.location !== undefined ? aiData.location : prev.location,
        eventType: aiData.eventType || prev.eventType,
        startDate: aiData.startDate || aiData.date || prev.startDate,
        startTime: aiData.startTime || aiData.time || prev.startTime,
        endDate: aiData.endDate || aiData.date || prev.endDate,
        endTime: aiData.endTime || aiData.time || prev.endTime,
        totalTickets: aiData.totalTickets
          ? String(aiData.totalTickets)
          : aiData.capacity
            ? String(aiData.capacity)
            : prev.totalTickets,
        pricing: nextPricing,
        visibility: aiData.visibility || prev.visibility,
        streamType: aiData.streamType || prev.streamType,
        streamURL: aiData.streamURL !== undefined ? aiData.streamURL : prev.streamURL,
      };
    });

    const inferFree = aiData.isFree ?? aiData.isFreeEvent ?? (Array.isArray(aiData.pricing) && aiData.pricing.length
      ? aiData.pricing.every((tier) => Number(tier?.price ?? tier?.amount ?? 0) === 0 || tier?.isFree)
      : aiData.ticketPrice === 0) ?? false;
    setIsFreeEvent(Boolean(inferFree));

    if (aiImageFile) {
      setImageFile(aiImageFile);
      setImagePreview(aiImagePreview || URL.createObjectURL(aiImageFile));
    } else if (aiImagePreview) {
      setImagePreview(aiImagePreview);
      setImageFile(null);
    }

    setShowAIGen(false);
    setActiveStep(5);
    toast.success("TickiAI filled your entire event, review the preview before publishing.");
  };

  /* ── Navigation ── */
  const goStep = (target) => {
    if (target > activeStep && stepError) { toast.error(stepError); return; }
    setActiveStep(target);
    setDrawerOpen(false);
  };

  const handleNext = () => {
    if (stepError) { toast.error(stepError); return; }
    setActiveStep((p) => Math.min(5, p + 1));
  };

  /* ── Publish ── */
  const handleSubmit = async (e) => {
    e?.preventDefault();
    const msg =
      getStepValidation(1, form, isFreeEvent) ||
      getStepValidation(3, form, isFreeEvent) ||
      getStepValidation(4, form, isFreeEvent);
    if (msg) { toast.error(msg); return; }
    try {
      setSubmitting(true);
      const payload = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "pricing") payload.append("pricing", JSON.stringify(isFreeEvent ? [] : v));
        else payload.append(k, v ?? "");
      });
      payload.append("isFree", isFreeEvent ? "true" : "false");
      if (draftId) payload.append("draftId", draftId);
      if (imageFile) payload.append("image", imageFile);
      const res = await API.post("/events/create", payload);
      const created = res.data?.event;
      if (teamMembers.length && created?._id) {
        const results = await Promise.allSettled(
          teamMembers.map((m) =>
            teamService.inviteTeamMember(created._id, {
              email: m.email,
              role: m.role,
              message: `You were invited to join ${form.title}`,
            })
          )
        );
        const failed = results.filter((r) => r.status === "rejected");
        if (failed.length) toast.error(`Published, but ${failed.length} invite(s) failed.`);
      }
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      toast.success("Event created!");
      navigate("/events");
      onClose();
    } catch (err) {
      const code = err.response?.data?.code;
      const msg2 = err.response?.data?.message || "Failed to create event";
      if (err.response?.status === 403 && code === "PLAN_LIMIT") {
        toast.error(msg2);
        window.dispatchEvent(new CustomEvent("planLimitHit"));
      } else if (err.response?.status === 403 && code === "VERIFICATION_REQUIRED") {
        toast.error("Verification required: Events with 50+ tickets need organizer verification");
        // Wait for toast to show, then navigate
        setTimeout(() => {
          navigate("/verification");
        }, 1500);
      } else {
        toast.error(msg2);
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* Compute preview pricing (only enabled tiers) */
  const previewPricing = isFreeEvent
    ? [{ type: "Free", price: 0, isEnabled: true }]
    : form.pricing.filter((t) => t.isEnabled);

  const saveLabel =
    saveState === "saving" ? "Saving…"
      : saveState === "saved"
        ? `Saved ${lastSavedAt ? lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}`
        : saveState === "error" ? "Save failed"
          : "Auto-save on";

  /* Default tiers (Regular, VIP, VVIP) can't be deleted */
  const DEFAULT_TYPES = ["Regular", "VIP", "VVIP"];

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      {/* Modal shell */}
      <div className="relative z-10 flex w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-4xl sm:rounded-2xl max-h-[96dvh] sm:max-h-[90vh]">

        {/* ── HEADER ── */}
        <div className="flex shrink-0 items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
          <button type="button" onClick={() => setDrawerOpen(true)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 sm:hidden" aria-label="Open steps menu">
            <Menu size={15} />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pink-500 text-white shadow-sm">
              {(() => { const Icon = steps[activeStep - 1].icon; return <Icon size={13} />; })()}
            </div>
            <div className="min-w-0">
              <div className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-gray-400">Step {activeStep} of 5</div>
              <div className="truncate text-sm font-bold text-gray-900">{steps[activeStep - 1].title}</div>
            </div>
          </div>

          <div className="hidden items-center gap-1 sm:flex">
            {steps.map((s) => (
              <button key={s.id} type="button" onClick={() => goStep(s.id)} title={s.title}
                className={`h-1.5 rounded-full transition-all ${s.id === activeStep ? "w-5 bg-pink-500" : s.id < activeStep ? "w-2 bg-green-400" : "w-2 bg-gray-200 hover:bg-gray-300"}`} />
            ))}
          </div>

          <button type="button" onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* ── BODY ── */}
        <div className="flex min-h-0 flex-1 overflow-hidden">

          {/* Desktop sidebar */}
          <aside className="hidden w-44 shrink-0 flex-col gap-0.5 border-r border-gray-100 bg-gray-50 p-3 sm:flex">
            <div className="mb-3 rounded-xl bg-gradient-to-br from-gray-900 to-pink-700 p-3 text-white">
              <div className="text-[0.54rem] font-bold uppercase tracking-[0.18em] text-pink-200">Event studio</div>
              <div className="mt-0.5 text-xs font-bold">Create &amp; publish</div>
              <div className="mt-2 flex gap-0.5">
                {steps.map((s) => (
                  <div key={s.id} className={`h-1 rounded-full transition-all ${s.id <= activeStep ? "flex-1 bg-pink-400" : "w-2 bg-white/20"}`} />
                ))}
              </div>
            </div>
            {steps.map((step) => (
              <StepBtn key={step.id} step={step} activeStep={activeStep} onClick={goStep} />
            ))}
            <div className="mt-auto border-t border-gray-200 pt-3">
              <div className="space-y-1 rounded-xl border border-gray-100 bg-white p-2.5 text-[0.63rem]">
                <div className="truncate font-semibold text-gray-800">{form.title || "Untitled draft"}</div>
                {[
                  ["Access", form.visibility === "private" ? "Private" : "Public"],
                  ["Pricing", isFreeEvent ? "Free" : "Paid"],
                  ["Team", `${teamMembers.length} added`],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between text-gray-400">
                    <span>{label}</span>
                    <span className="font-medium text-gray-600">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Mobile step drawer */}
          {drawerOpen && (
            <div className="fixed inset-0 z-50 flex sm:hidden">
              <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
              <div className="relative z-10 flex h-full w-56 flex-col gap-0.5 bg-white p-3 shadow-xl">
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-gray-700">Steps</span>
                  <button type="button" onClick={() => setDrawerOpen(false)} className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100"><X size={13} /></button>
                </div>
                {steps.map((step) => (
                  <StepBtn key={step.id} step={step} activeStep={activeStep} onClick={goStep} />
                ))}
              </div>
            </div>
          )}

          {/* Scrollable content + pinned footer */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">

              {/* Recovery banner */}
              {recoverableDraft?.updatedAt && !loadingSession && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-amber-900">Draft recovery available</div>
                      <div className="text-xs text-amber-700">From {new Date(recoverableDraft.updatedAt).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => { applyWizardState(recoverableDraft); setRecoverableDraft(null); }}>Restore</Button>
                      <Button variant="ghost" size="sm" onClick={() => { localStorage.removeItem(DRAFT_STORAGE_KEY); setRecoverableDraft(null); }}>Start fresh</Button>
                    </div>
                  </div>
                </div>
              )}

              {loadingSession ? (
                <div className="space-y-3">
                  {[72, 160, 100].map((h) => (
                    <div key={h} style={{ height: h }} className="animate-pulse rounded-xl bg-gray-100" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">

                  {/* ══════════════════════════════════════════════════════
                      STEP 1, Basic Info
                  ══════════════════════════════════════════════════════ */}
                  {activeStep === 1 && (
                    <>
                      <Card className="border-pink-100 bg-gradient-to-br from-pink-50/60 to-white">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-sm">
                              <Sparkles size={13} />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-gray-900">TickiAI Fill all 5 steps</h3>
                              <p className="text-[0.62rem] text-gray-400">Describe your event; AI fills everything including cover image</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (!canUseTickiAI) { promptUpgradeAI(); return; }
                              setShowAIGen((p) => !p);
                            }}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${showAIGen
                              ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              : "bg-pink-500 text-white shadow-md shadow-pink-500/25 hover:bg-pink-600"
                              }`}
                          >
                            <Wand2 size={12} />
                            {showAIGen ? "Hide AI" : "Use TickiAI"}
                          </button>
                        </div>

                        {showAIGen ? (
                          <div className="max-h-[60vh] overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white p-4">
                            <TickiAIGenerator onGenerate={handleAI} compact />
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-pink-200 bg-white/70 px-4 py-3 text-center">
                            <p className="text-xs text-gray-500">
                              Click <strong className="text-pink-600">Use TickiAI</strong> to auto-fill all 5 wizard steps, title, schedule, tickets, pricing, settings, and cover image, then jump straight to preview.
                            </p>
                          </div>
                        )}
                      </Card>

                      <Card>
                        <h3 className="mb-0.5 text-sm font-bold text-gray-900">Event type</h3>
                        <p className="mb-3 text-xs text-gray-500">How will people attend?</p>
                        <div className="grid grid-cols-3 gap-2">
                          {eventTypes.map(({ name, icon: Icon, hint }) => {
                            const active = form.eventType === name;
                            return (
                              <button key={name} type="button" onClick={() => setForm((p) => ({ ...p, eventType: name }))}
                                className={`rounded-xl border p-3 text-left transition ${active ? "border-pink-300 bg-pink-50" : "border-gray-200 bg-gray-50 hover:border-pink-200"}`}>
                                <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${active ? "bg-pink-500 text-white" : "border border-gray-200 bg-white text-gray-400"}`}>
                                  <Icon size={15} />
                                </div>
                                <div className={`text-xs font-semibold ${active ? "text-pink-700" : "text-gray-800"}`}>{name}</div>
                                <div className="mt-0.5 text-[0.62rem] leading-tight text-gray-400">{hint}</div>
                              </button>
                            );
                          })}
                        </div>
                      </Card>

                      <Card>
                        <h3 className="mb-3 text-sm font-bold text-gray-900">Event details</h3>
                        <div className="space-y-3">
                          <div>
                            <FieldLabel>Event title</FieldLabel>
                            <input name="title" value={form.title} onChange={hc} placeholder="e.g. Lagos Founder Mixer 2026" className={F} />
                          </div>
                          <div>
                            <FieldLabel>Description</FieldLabel>
                            <textarea name="description" value={form.description} onChange={hc} rows={3} placeholder="What makes this event worth showing up for?" className={`${F} resize-y`} />
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <FieldLabel>Category</FieldLabel>
                              <select name="category" value={form.category} onChange={hc} className={F}>
                                <option value="">Select a category…</option>
                                {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                            <div>
                              <FieldLabel>{form.eventType === "Virtual" ? "Host location (optional)" : "Venue"}</FieldLabel>
                              <input name="location" value={form.location} onChange={hc}
                                placeholder={form.eventType === "Virtual" ? "City or host location" : "Address or venue name"} className={F} />
                            </div>
                          </div>
                        </div>
                      </Card>

                      <Card>
                        <h3 className="mb-3 text-sm font-bold text-gray-900">Schedule</h3>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <div><FieldLabel>Start date</FieldLabel><input type="date" name="startDate" value={form.startDate} onChange={hc} className={F} /></div>
                          <div><FieldLabel>Start time</FieldLabel><input type="time" name="startTime" value={form.startTime} onChange={hc} className={F} /></div>
                          <div><FieldLabel>End date</FieldLabel>  <input type="date" name="endDate" value={form.endDate} onChange={hc} className={F} /></div>
                          <div><FieldLabel>End time</FieldLabel>  <input type="time" name="endTime" value={form.endTime} onChange={hc} className={F} /></div>
                        </div>
                      </Card>
                    </>
                  )}

                  {/* ══════════════════════════════════════════════════════
                      STEP 2, Media
                  ══════════════════════════════════════════════════════ */}
                  {activeStep === 2 && (
                    <Card>
                      <h3 className="mb-0.5 text-sm font-bold text-gray-900">Cover image</h3>
                      <p className="mb-3 text-xs text-gray-500">Sharp imagery converts better in listings. Upload or let TickiAI suggest one.</p>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <label className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 text-center transition hover:border-pink-300 hover:bg-pink-50/30">
                          {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="h-full max-h-[200px] w-full rounded-lg object-cover" />
                          ) : (
                            <>
                              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-pink-400 shadow-sm">
                                <Upload size={18} />
                              </div>
                              <div className="text-sm font-semibold text-gray-700">Upload cover image</div>
                              <div className="mt-1 text-xs text-gray-400">JPEG, PNG, WEBP · Max 10 MB</div>
                            </>
                          )}
                          <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif" onChange={handleImageChange} />
                        </label>

                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <div className="mb-2 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-gray-400">Tips</div>
                          <div className="space-y-2">
                            {[
                              "Use imagery that matches your event vibe.",
                              "Short, sharp titles work best on mobile.",
                              "TickiAI (Step 1) can suggest a cover image automatically.",
                            ].map((tip, i) => (
                              <div key={i} className="flex gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs text-gray-600">
                                <span className="shrink-0 font-bold text-pink-400">{i + 1}.</span>
                                {tip}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* ══════════════════════════════════════════════════════
                      STEP 3, Tickets (UPDATED)
                  ══════════════════════════════════════════════════════ */}
                  {activeStep === 3 && (
                    <div className="space-y-4">
                      {/* Quantity + free event toggle */}
                      <Card>
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-bold text-gray-900">Ticket quantity</h3>
                            <p className="text-xs text-gray-500">Total seats available across all tiers.</p>
                          </div>
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100">
                            <input type="checkbox" checked={isFreeEvent} onChange={(e) => setIsFreeEvent(e.target.checked)} className="accent-pink-500" />
                            All tickets free
                          </label>
                        </div>
                        <div>
                          <FieldLabel>Total ticket quantity</FieldLabel>
                          <input name="totalTickets" value={form.totalTickets} onChange={hc} type="number" min="1" placeholder="e.g. 250" className={F} />
                        </div>
                      </Card>

                      {/* Tier editor */}
                      <Card>
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-bold text-gray-900">Ticket tiers</h3>
                            <p className="text-xs text-gray-500">
                              {isFreeEvent
                                ? "All tiers are free, toggle individual tiers on/off to control visibility."
                                : "Enable, disable, customise or add tiers. Disabled tiers won't appear to buyers."}
                            </p>
                          </div>
                          {!isFreeEvent && (
                            <button
                              type="button"
                              onClick={handleAddTier}
                              className="flex items-center gap-1.5 rounded-full border border-dashed border-pink-300 bg-pink-50 px-3 py-1.5 text-xs font-bold text-pink-600 transition hover:bg-pink-100"
                            >
                              <Plus size={12} /> Add tier
                            </button>
                          )}
                        </div>

                        {isFreeEvent ? (
                          <div className="rounded-xl border border-pink-200 bg-pink-50 px-3 py-2.5 text-xs text-pink-700">
                            Free event mode, attendees reserve spots without payment. All pricing is hidden from buyers.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {form.pricing.map((tier, i) => (
                              <TierEditor
                                key={`${tier.type}-${i}`}
                                tier={tier}
                                index={i}
                                onChange={handleTierChange}
                                onDelete={DEFAULT_TYPES.includes(tier.type) ? null : handleTierDelete}
                                isEventFree={isFreeEvent}
                              />
                            ))}
                          </div>
                        )}
                      </Card>

                      {/* Buyer preview */}
                      {!isFreeEvent && (
                        <Card className="border-gray-100 bg-gray-50">
                          <div className="mb-2 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-gray-400">
                            Buyer preview · only enabled tiers show
                          </div>
                          {previewPricing.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">No enabled tiers yet.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {previewPricing.map((tier) => {
                                const displayName = tier.label || tier.type;
                                const accentColor = tier.color || "#ec4899";
                                return (
                                  <div
                                    key={tier.type}
                                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="h-2 w-2 rounded-full"
                                        style={{ backgroundColor: accentColor }}
                                      />
                                      <div>
                                        <span className="text-xs font-semibold text-gray-800">{displayName}</span>
                                        {tier.description && (
                                          <span className="ml-2 text-[0.6rem] text-gray-400">{tier.description}</span>
                                        )}
                                      </div>
                                    </div>
                                    <span className="text-xs font-bold text-gray-900">
                                      {tier.isFree ? "Free" : `₦${Number(tier.price || 0).toLocaleString("en-NG")}`}
                                    </span>
                                  </div>
                                );
                              })}
                              <div className="rounded-lg border border-gray-100 bg-white px-3 py-1.5 text-[0.65rem] text-gray-400">
                                <strong className="text-gray-700">{form.totalTickets || 0}</strong> tickets total ·{" "}
                                <strong className="text-gray-700">{form.pricing.filter((t) => !t.isEnabled).length}</strong> tier(s) hidden from buyers
                              </div>
                            </div>
                          )}
                        </Card>
                      )}
                    </div>
                  )}

                  {/* ══════════════════════════════════════════════════════
                      STEP 4, Settings
                  ══════════════════════════════════════════════════════ */}
                  {activeStep === 4 && (
                    <>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Card>
                          <div className="mb-3 flex items-center gap-2">
                            <Lock size={13} className="text-pink-500" />
                            <h4 className="text-sm font-bold text-gray-900">Visibility</h4>
                          </div>
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100">
                            <input type="checkbox" checked={form.visibility === "private"}
                              onChange={(e) => {
                                if (!canUsePrivateEvents) { promptUpgradePrivate(); return; }
                                setForm((p) => ({ ...p, visibility: e.target.checked ? "private" : "public" }));
                              }} className="accent-pink-500" />
                            Private event
                          </label>
                          <p className="mt-2 text-xs leading-relaxed text-gray-500">Hidden from discovery. Share via direct link.</p>
                          {!canUsePrivateEvents && (
                            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">Requires a Pro plan.</div>
                          )}
                        </Card>

                        <Card>
                          <div className="mb-3 flex items-center gap-2">
                            <Radio size={13} className="text-pink-500" />
                            <h4 className="text-sm font-bold text-gray-900">Livestream</h4>
                          </div>
                          {canUseLiveStreaming ? (
                            <div className="space-y-2">
                              <select name="streamType" value={form.streamType} onChange={hc} className={F}>
                                <option value="Camera">Camera (Native)</option>
                                <option value="YouTube">YouTube</option>
                                <option value="Facebook">Facebook</option>
                                <option value="Custom">Custom</option>
                              </select>
                              {form.streamType !== "Camera" && (
                                <input name="streamURL" value={form.streamURL} onChange={hc} placeholder={`${form.streamType} stream URL`} className={F} />
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">Requires a Pro plan.</div>
                              <Button variant="secondary" size="sm" onClick={promptUpgradeLive}>Upgrade for livestreaming</Button>
                            </div>
                          )}
                        </Card>
                      </div>

                      <Card>
                        <div className="mb-3 flex items-center gap-2">
                          <Users size={13} className="text-pink-500" />
                          <h4 className="text-sm font-bold text-gray-900">Team collaboration</h4>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                          <div className="flex-1">
                            <FieldLabel>Email</FieldLabel>
                            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="teammate@example.com" className={F} />
                          </div>
                          <div className="sm:w-40">
                            <FieldLabel>Role</FieldLabel>
                            <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className={F}>
                              {teamRoles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                          </div>
                          <Button size="sm" onClick={handleAddMember}>Add</Button>
                        </div>
                        <div className="mt-3 space-y-2">
                          {teamMembers.length ? (
                            teamMembers.map((m, i) => (
                              <div key={`${m.email}-${i}`} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                                <div>
                                  <div className="text-xs font-semibold text-gray-900">{m.email}</div>
                                  <div className="text-[0.62rem] text-gray-400">{teamRoles.find((r) => r.value === m.role)?.label || m.role}</div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setTeamMembers((p) => p.filter((_, mi) => mi !== i))}>Remove</Button>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-xl border border-dashed border-gray-200 px-4 py-4 text-center text-xs text-gray-400">
                              No teammates yet. Publish solo or add now.
                            </div>
                          )}
                        </div>
                      </Card>
                    </>
                  )}

                  {/* ══════════════════════════════════════════════════════
                      STEP 5, Preview
                  ══════════════════════════════════════════════════════ */}
                  {activeStep === 5 && (
                    <Card>
                      <h3 className="mb-0.5 text-sm font-bold text-gray-900">Preview before publish</h3>
                      <p className="mb-4 text-xs text-gray-500">Final pass, make sure everything looks clean.</p>

                      {form.title && (
                        <div className="mb-4 flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs text-purple-700">
                          <Sparkles size={13} />
                          <span>TickiAI filled this event. Review all steps via the sidebar before publishing.</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
                        {/* Visual card */}
                        <div className="overflow-hidden rounded-xl border border-gray-200">
                          {imagePreview ? (
                            <img src={imagePreview} alt={form.title || "Event"} className="h-40 w-full object-cover sm:h-48" />
                          ) : (
                            <div className="flex h-40 items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-pink-700 sm:h-48">
                              <div className="text-center text-white">
                                <Sparkles size={20} className="mx-auto mb-1.5 opacity-70" />
                                <p className="text-xs text-white/60">No cover image yet</p>
                                <button type="button" onClick={() => setActiveStep(2)}
                                  className="mt-2 rounded-full bg-white/20 px-3 py-1 text-[0.67rem] font-semibold text-white hover:bg-white/30 transition">
                                  Add one →
                                </button>
                              </div>
                            </div>
                          )}
                          <div className="p-4">
                            <div className="mb-1.5 flex flex-wrap gap-1">
                              <span className="rounded-full bg-pink-50 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-pink-600">{form.category || "Category"}</span>
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[0.6rem] font-semibold text-gray-600">{form.eventType}</span>
                              {form.visibility === "private" && (
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[0.6rem] font-semibold text-amber-700">Private</span>
                              )}
                            </div>
                            <h2 className="text-lg font-black text-gray-900">{form.title || "Untitled event"}</h2>
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500">{form.description || "No description yet."}</p>
                          </div>
                        </div>

                        {/* Summary */}
                        <div className="space-y-3">
                          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5">
                            <div className="mb-2 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-gray-400">Summary</div>
                            <div className="space-y-2 text-xs">
                              {[
                                [Calendar, `${form.startDate || "No date"}${form.startTime ? ` · ${form.startTime}` : ""}`],
                                [MapPin, form.location || "No location"],
                                [Clock3, `${form.totalTickets || 0} tickets`],
                              ].map(([Icon, text]) => (
                                <div key={text} className="flex items-start gap-2">
                                  <Icon size={12} className="mt-0.5 shrink-0 text-pink-400" />
                                  <span className="font-semibold text-gray-800">{text}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5">
                            <div className="mb-2 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-gray-400">
                              Ticket options · {previewPricing.length} visible to buyers
                            </div>
                            <div className="space-y-1.5">
                              {previewPricing.map((tier) => {
                                const displayName = tier.label || tier.type;
                                const accentColor = tier.color || "#ec4899";
                                return (
                                  <div key={tier.type} className="flex items-center gap-2 justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs">
                                    <div className="flex items-center gap-2">
                                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: accentColor }} />
                                      <span className="font-semibold text-gray-800">{displayName}</span>
                                    </div>
                                    <span className="font-bold text-gray-900">
                                      {isFreeEvent || tier.isFree ? "Free" : `₦${Number(tier.price || 0).toLocaleString("en-NG")}`}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Step shortcuts */}
                          <div className="rounded-xl border border-gray-100 p-3">
                            <div className="mb-2 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-gray-400">Edit a step</div>
                            <div className="flex flex-wrap gap-1.5">
                              {steps.slice(0, 4).map((s) => (
                                <button key={s.id} type="button" onClick={() => setActiveStep(s.id)}
                                  className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[0.67rem] font-semibold text-gray-600 transition hover:border-pink-300 hover:text-pink-500">
                                  {s.title}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                </div>
              )}
            </div>

            {/* ── FOOTER ── */}
            <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-3 sm:px-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2 text-xs text-gray-400">
                  <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${saveState === "saving" ? "animate-pulse bg-amber-400"
                    : saveState === "saved" ? "bg-green-400"
                      : saveState === "error" ? "bg-red-400"
                        : "bg-gray-300"
                    }`} />
                  <span className="truncate">{saveLabel}</span>
                  {stepError && (
                    <span className="hidden truncate text-amber-500 sm:inline">· {stepError}</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => saveDraft()}>
                    <Save size={12} /> Save draft
                  </Button>
                  {activeStep > 1 && (
                    <Button variant="outline" size="sm" onClick={() => setActiveStep((p) => Math.max(1, p - 1))}>
                      <ChevronLeft size={13} /> Back
                    </Button>
                  )}
                  {activeStep < 5 ? (
                    <Button size="sm" onClick={handleNext}>
                      Continue <ChevronRight size={13} />
                    </Button>
                  ) : (
                    <Button size="sm" onClick={handleSubmit} loading={submitting}>
                      Publish event
                    </Button>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}