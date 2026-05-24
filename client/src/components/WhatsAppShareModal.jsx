import { useState, useRef } from "react";
import {
  X, Copy, Check, MessageCircle, Facebook, Send,
  Share2, Link2, Sparkles, RefreshCw,
} from "lucide-react";
import API from "../api/axios";
import {
  generateWhatsAppCaption,
  buildWhatsAppLink,
  buildReferralUrl,
  CAPTION_TYPES,
} from "../utils/whatsappEngine";

const CAPTION_LABELS = {
  [CAPTION_TYPES.LAUNCH]:     "🎉 Event Launch",
  [CAPTION_TYPES.URGENCY]:    "⚠️ Last Tickets",
  [CAPTION_TYPES.REMINDER]:   "🔔 Reminder",
  [CAPTION_TYPES.LIVESTREAM]: "🔴 Going Live",
};

/**
 * WhatsAppShareModal
 *
 * Props:
 *   open          {boolean}      — controls visibility
 *   onClose       {function}     — called on backdrop click or X
 *   event         {object}       — event document (required)
 *   currentUserId {string|null}  — logged-in user id for referral links
 *   shareUrl      {string|null}  — optional URL override (used for profile sharing)
 *                                  when omitted, builds /event/:id URL automatically
 */
export default function WhatsAppShareModal({
  open,
  onClose,
  event,
  currentUserId,
  shareUrl = null,   // ← override for profile pages / custom links
}) {
  const [captionType, setCaptionType] = useState(CAPTION_TYPES.LAUNCH);
  const [captionSeed, setCaptionSeed] = useState(0);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedLink, setCopiedLink]       = useState(false);
  const sharedRef = useRef(false);

  // Guard: don't render if closed or no event data
  if (!open || !event) return null;

  // ── Referral / share URL ────────────────────────────────────────────────────
  // If a shareUrl override is provided (e.g. profile URL), use that as the base.
  // Otherwise build the standard event URL with optional referral code.
  const refCode = currentUserId
    ? btoa(`${event._id}:${currentUserId}`).replace(/=/g, "")
    : null;

  const resolvedShareUrl = shareUrl
    ? (refCode ? `${shareUrl}?ref=${refCode}` : shareUrl)
    : (currentUserId
        ? buildReferralUrl(event._id, currentUserId)
        : `${window.location.origin}/event/${event._id}`);

  // ── Caption ─────────────────────────────────────────────────────────────────
  const caption = generateWhatsAppCaption(event, captionType, refCode, captionSeed, resolvedShareUrl);
  const waLink  = buildWhatsAppLink(caption);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const trackShare = async () => {
    // Only track share for real events (not synthetic profile objects)
    if (!event._id || sharedRef.current || shareUrl) return;
    try {
      await API.post(`/events/${event._id}/share`);
      sharedRef.current = true;
    } catch { /* non-fatal */ }
  };

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    } catch { /* denied */ }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(resolvedShareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch { /* denied */ }
  };

  const handleWhatsApp = () => {
    trackShare();
    window.open(waLink, "_blank", "noopener,noreferrer");
  };

  // Bump seed → picks next template in the pool
  const regenerate = () => setCaptionSeed((s) => s + 1);

  // ── Share option links ──────────────────────────────────────────────────────
  const shareOptions = [
    {
      label: "Facebook",
      href:  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(resolvedShareUrl)}`,
      icon:  <Facebook size={16} />,
      cls:   "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200",
    },
    {
      label: "Twitter / X",
      href:  `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}`,
      icon:  <Share2 size={16} />,
      cls:   "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200",
    },
    {
      label: "Telegram",
      href:  `https://t.me/share/url?url=${encodeURIComponent(resolvedShareUrl)}&text=${encodeURIComponent(event.title)}`,
      icon:  <Send size={16} />,
      cls:   "bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-200",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-full bg-gradient-to-r from-pink-500 via-emerald-400 to-pink-500" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <MessageCircle size={16} />
            </div>
            <h3 className="text-base font-extrabold text-gray-900 tracking-tight">
              {shareUrl ? "Share Profile" : "Share Event"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-pink-500 hover:bg-pink-50 transition-all"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Caption style — hide for profile shares (only LAUNCH makes sense) */}
          {!shareUrl && (
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1">
                <Sparkles size={11} /> Caption style
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(CAPTION_LABELS).map(([type, label]) => (
                  <button
                    key={type}
                    onClick={() => { setCaptionType(type); setCaptionSeed(0); }}
                    className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-all ${
                      captionType === type
                        ? "bg-pink-500 text-white border-pink-500 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-pink-300 hover:text-pink-500"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Caption preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">
                WhatsApp caption
              </p>
              <button
                onClick={regenerate}
                className="flex items-center gap-1 text-[0.65rem] text-gray-400 hover:text-pink-500 transition-colors"
              >
                <RefreshCw size={10} /> Regenerate
              </button>
            </div>
            <div className="relative bg-gray-50 border border-gray-200 rounded-xl p-3">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed pr-8">{caption}</p>
              <button
                onClick={copyCaption}
                className="absolute top-2 right-2 p-1.5 rounded-lg text-gray-400 hover:text-pink-500 hover:bg-pink-50 transition-all"
                title="Copy caption"
              >
                {copiedCaption
                  ? <Check size={14} className="text-green-500" />
                  : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* WhatsApp button */}
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 active:scale-[0.99] transition-all shadow-md shadow-emerald-500/20"
          >
            <MessageCircle size={18} />
            Share on WhatsApp
          </button>

          {/* Copy link */}
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
              <Link2 size={11} />
              {currentUserId && !shareUrl ? "Your referral link" : "Share link"}
            </p>
            <div className="flex items-center gap-2 bg-pink-50 border border-pink-100 rounded-xl px-3 py-2.5">
              <p className="flex-1 text-xs text-gray-600 truncate font-medium min-w-0">
                {resolvedShareUrl}
              </p>
              <button
                onClick={copyLink}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-bold transition-all ${
                  copiedLink
                    ? "bg-green-500 text-white"
                    : "bg-pink-500 text-white hover:bg-pink-600"
                }`}
              >
                {copiedLink ? <Check size={11} /> : <Copy size={11} />}
                {copiedLink ? "Copied" : "Copy"}
              </button>
            </div>
            {currentUserId && !shareUrl && (
              <p className="text-[0.6rem] text-gray-400 mt-1">
                Earn credit when friends buy tickets via your link
              </p>
            )}
          </div>

          {/* Other platforms */}
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400 mb-2">
              Also share via
            </p>
            <div className="grid grid-cols-3 gap-2">
              {shareOptions.map(({ label, href, icon, cls }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={trackShare}
                  className={`inline-flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-semibold transition-all hover:-translate-y-0.5 ${cls}`}
                >
                  {icon} {label}
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}