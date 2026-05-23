/**
 * WhatsAppShareModal.jsx
 *
 * Replaces/extends the existing ShareModal.jsx.
 * Reuses: ShareModal layout patterns, existing API.post("/:id/share"), getEventUrl utility.
 *
 * Features:
 * - Auto-generated WhatsApp captions (launch / urgency / reminder / livestream)
 * - Referral-ready URLs
 * - One-tap WhatsApp button
 * - Copy caption or link separately
 * - Tracks share via existing POST /events/:id/share endpoint
 */

import { useState, useCallback } from "react";
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
  [CAPTION_TYPES.URGENCY]:    "⚠️  Last Tickets",
  [CAPTION_TYPES.REMINDER]:   "🔔 Reminder",
  [CAPTION_TYPES.LIVESTREAM]: "🔴 Going Live",
};

export default function WhatsAppShareModal({ open, onClose, event, currentUserId }) {
  const [captionType, setCaptionType]     = useState(CAPTION_TYPES.LAUNCH);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedLink, setCopiedLink]       = useState(false);
  const [shared, setShared]               = useState(false);

  const referralUrl = currentUserId
    ? buildReferralUrl(event?._id, currentUserId)
    : `${window.location.origin}/event/${event?._id}`;

  const caption = event ? generateWhatsAppCaption(event, captionType, currentUserId ? btoa(`${event._id}:${currentUserId}`).replace(/=/g, "") : null) : "";

  const waLink = buildWhatsAppLink(caption);

  const trackShare = useCallback(async () => {
    if (!event?._id || shared) return;
    try {
      await API.post(`/events/${event._id}/share`);
      setShared(true);
    } catch { /* non-fatal */ }
  }, [event?._id, shared]);

  const copyCaption = async () => {
    await navigator.clipboard.writeText(caption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleWhatsApp = () => {
    trackShare();
    window.open(waLink, "_blank", "noopener,noreferrer");
  };

  const regenerate = () => {
    // Force a re-render with same type — engine picks a random template
    setCaptionType((t) => { const keys = Object.values(CAPTION_TYPES); return keys[(keys.indexOf(t) + 1) % keys.length]; });
    setTimeout(() => setCaptionType(captionType), 0);
  };

  if (!open || !event) return null;

  const shareOptions = [
    {
      label: "Facebook",
      href:  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`,
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
      href:  `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(event.title)}`,
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
        {/* Pink accent */}
        <div className="h-1 w-full bg-gradient-to-r from-pink-500 via-emerald-400 to-pink-500" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <MessageCircle size={16} />
            </div>
            <h3 className="text-base font-extrabold text-gray-900 tracking-tight">Share Event</h3>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-pink-500 hover:bg-pink-50 transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Caption Type Selector */}
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1">
              <Sparkles size={11} /> Caption style
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(CAPTION_LABELS).map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => setCaptionType(type)}
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

          {/* Generated Caption */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">WhatsApp caption</p>
              <button onClick={regenerate} className="flex items-center gap-1 text-[0.65rem] text-gray-400 hover:text-pink-500 transition-colors">
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
                {copiedCaption ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* Primary WhatsApp Button */}
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 active:scale-[0.99] transition-all shadow-md shadow-emerald-500/20"
          >
            <MessageCircle size={18} />
            Share on WhatsApp
          </button>

          {/* Referral Link */}
          {currentUserId && (
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
                <Link2 size={11} /> Your referral link
              </p>
              <div className="flex items-center gap-2 bg-pink-50 border border-pink-100 rounded-xl px-3 py-2.5">
                <p className="flex-1 text-xs text-gray-600 truncate font-medium min-w-0">{referralUrl}</p>
                <button
                  onClick={copyLink}
                  className={`flex-shrink-0 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-bold transition-all ${
                    copiedLink ? "bg-green-500 text-white" : "bg-pink-500 text-white hover:bg-pink-600"
                  }`}
                >
                  {copiedLink ? <Check size={11} /> : <Copy size={11} />}
                  {copiedLink ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-[0.6rem] text-gray-400 mt-1">Earn credit when friends buy tickets via your link</p>
            </div>
          )}

          {/* Other platforms */}
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400 mb-2">Also share via</p>
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