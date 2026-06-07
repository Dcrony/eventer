import { useState, useRef } from "react";
import {
  X, Copy, Check, MessageCircle, Facebook, Send,
  Share2, Link2, Sparkles, RefreshCw, Zap,
} from "lucide-react";
import API from "../api/axios";
import {
  generateWhatsAppCaption,
  buildWhatsAppLink,
  buildReferralUrl,
  CAPTION_TYPES,
} from "../utils/whatsappEngine";

const CAPTION_LABELS = {
  [CAPTION_TYPES.LAUNCH]:     { label: "Event Launch",   emoji: "🎉" },
  [CAPTION_TYPES.URGENCY]:    { label: "Last Tickets",   emoji: "⚡" },
  [CAPTION_TYPES.REMINDER]:   { label: "Reminder",       emoji: "🔔" },
  [CAPTION_TYPES.LIVESTREAM]: { label: "Going Live",     emoji: "🔴" },
};

export default function WhatsAppShareModal({
  open,
  onClose,
  event,
  currentUserId,
  shareUrl = null,
}) {
  const [captionType, setCaptionType] = useState(CAPTION_TYPES.LAUNCH);
  const [captionSeed, setCaptionSeed] = useState(0);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedLink, setCopiedLink]       = useState(false);
  const sharedRef = useRef(false);

  if (!open || !event) return null;

  const refCode = currentUserId
    ? btoa(`${event._id}:${currentUserId}`).replace(/=/g, "")
    : null;

  const resolvedShareUrl = shareUrl
    ? (refCode ? `${shareUrl}?ref=${refCode}` : shareUrl)
    : (currentUserId
        ? buildReferralUrl(event._id, currentUserId)
        : `${window.location.origin}/event/${event._id}`);

  const caption = generateWhatsAppCaption(event, captionType, refCode, captionSeed, resolvedShareUrl);
  const waLink  = buildWhatsAppLink(caption);

  const trackShare = async () => {
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

  const regenerate = () => setCaptionSeed((s) => s + 1);

  const shareOptions = [
    {
      label: "Facebook",
      href:  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(resolvedShareUrl)}`,
      icon:  <Facebook size={14} />,
      cls:   "bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/20 hover:bg-[#1877F2]/20",
    },
    {
      label: "Twitter / X",
      href:  `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}`,
      icon:  <Share2 size={14} />,
      cls:   "bg-gray-900/5 text-gray-800 border-gray-200 hover:bg-gray-900/10",
    },
    {
      label: "Telegram",
      href:  `https://t.me/share/url?url=${encodeURIComponent(resolvedShareUrl)}&text=${encodeURIComponent(event.title)}`,
      icon:  <Send size={14} />,
      cls:   "bg-[#229ED9]/10 text-[#229ED9] border-[#229ED9]/20 hover:bg-[#229ED9]/20",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[420px] overflow-hidden rounded-3xl bg-white shadow-2xl"
        style={{ boxShadow: "0 32px 80px -12px rgba(236,72,153,0.18), 0 0 0 1px rgba(0,0,0,0.06)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top gradient bar */}
        <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #ec4899 0%, #10b981 50%, #ec4899 100%)" }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm shadow-emerald-500/30">
              <MessageCircle size={15} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                {shareUrl ? "Share Profile" : "Share Event"}
              </h3>
              <p className="text-[0.6rem] text-gray-400 font-medium">
                {shareUrl ? "Spread the word" : `Sharing: ${event.title?.slice(0, 28)}${event.title?.length > 28 ? "…" : ""}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-xl text-gray-400 transition-all hover:bg-pink-50 hover:text-pink-500"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[78vh] overflow-y-auto">

          {/* Caption style pills */}
          {!shareUrl && (
            <div>
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-gray-400 mb-2 flex items-center gap-1">
                <Sparkles size={10} className="text-pink-400" /> Caption style
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(CAPTION_LABELS).map(([type, { label, emoji }]) => (
                  <button
                    key={type}
                    onClick={() => { setCaptionType(type); setCaptionSeed(0); }}
                    className={`inline-flex items-center gap-1 text-[0.7rem] px-2.5 py-1.5 rounded-xl border font-semibold transition-all ${
                      captionType === type
                        ? "bg-pink-500 text-white border-pink-500 shadow-sm shadow-pink-500/20"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-pink-300 hover:text-pink-500 hover:bg-pink-50/50"
                    }`}
                  >
                    <span>{emoji}</span> {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Caption preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-gray-400">
                WhatsApp caption
              </p>
              <button
                onClick={regenerate}
                className="flex items-center gap-1 text-[0.65rem] font-semibold text-gray-400 hover:text-pink-500 transition-colors"
              >
                <RefreshCw size={10} /> New variant
              </button>
            </div>
            <div className="relative rounded-2xl border border-gray-100 bg-gray-50/80 p-3.5">
              {/* WhatsApp-style bubble accent */}
              <div className="absolute top-3 left-0 w-0.5 h-8 rounded-r-full bg-emerald-400" />
              <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed pr-8 pl-2">{caption}</p>
              <button
                onClick={copyCaption}
                className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-xl transition-all hover:bg-white hover:shadow-sm"
                title="Copy caption"
              >
                {copiedCaption
                  ? <Check size={13} className="text-emerald-500" />
                  : <Copy size={13} className="text-gray-400 hover:text-pink-500" />
                }
              </button>
            </div>
          </div>

          {/* Primary WhatsApp CTA */}
          <button
            onClick={handleWhatsApp}
            className="group w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-white transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #25D366 0%, #10b981 100%)",
              boxShadow: "0 6px 20px -4px rgba(16,185,129,0.45)",
            }}
          >
            <MessageCircle size={16} className="transition-transform group-hover:scale-110" />
            Share on WhatsApp
          </button>

          {/* Copy link */}
          <div>
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-gray-400 mb-1.5 flex items-center gap-1">
              <Link2 size={10} />
              {currentUserId && !shareUrl ? "Your referral link" : "Share link"}
            </p>
            <div className="flex items-center gap-2 rounded-2xl border border-pink-100 bg-pink-50/60 px-3 py-2.5">
              <p className="flex-1 text-[0.7rem] text-gray-600 truncate font-medium min-w-0">
                {resolvedShareUrl}
              </p>
              <button
                onClick={copyLink}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-xl text-[0.7rem] font-bold transition-all ${
                  copiedLink
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "bg-pink-500 text-white hover:bg-pink-600 shadow-sm shadow-pink-500/20"
                }`}
              >
                {copiedLink ? <Check size={11} /> : <Copy size={11} />}
                {copiedLink ? "Copied!" : "Copy"}
              </button>
            </div>
            {currentUserId && !shareUrl && (
              <p className="text-[0.6rem] text-gray-400 mt-1.5 flex items-center gap-1">
                <Zap size={9} className="text-pink-400" />
                Earn credit when friends buy tickets via your link
              </p>
            )}
          </div>

          {/* Other platforms */}
          <div>
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-gray-400 mb-2">
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
                  className={`inline-flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border text-[0.7rem] font-semibold transition-all hover:-translate-y-0.5 hover:shadow-sm ${cls}`}
                >
                  {icon} {label}
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Footer note */}
        <div className="px-5 pb-4">
          <p className="text-center text-[0.58rem] text-gray-300 font-medium">
            Powered by TickiSpot · Links include your referral code
          </p>
        </div>
      </div>
    </div>
  );
}