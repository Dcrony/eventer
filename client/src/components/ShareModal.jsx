import { Copy, Facebook, MessageCircle, Send, Share2, X } from "lucide-react";
import { useState } from "react";

export default function ShareModal({ open, onClose, url, title }) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const encodedUrl   = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOptions = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      icon: <MessageCircle size={18} />,
      colors: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200",
    },
    {
      label: "Twitter / X",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: <Share2 size={18} />,
      colors: "bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-200",
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: <Facebook size={18} />,
      colors: "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200",
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      icon: <Send size={18} />,
      colors: "bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-200",
    },
  ];

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4 sm:pb-0"
      onClick={onClose}
    >
      {/* Modal panel */}
      <div
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-[slideUp_0.25s_cubic-bezier(0.34,1.56,0.64,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pink top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-pink-500 to-fuchsia-500" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Share</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Copy link row */}
        <div className="px-5 pt-4 pb-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
            Link
          </p>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
            <p className="flex-1 text-sm text-slate-600 truncate font-medium min-w-0">
              {url}
            </p>
            <button
              onClick={copyLink}
              className={`shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold transition-all ${
                copied
                  ? "bg-emerald-500 text-white"
                  : "bg-pink-500 text-white hover:bg-pink-600"
              }`}
            >
              <Copy size={13} />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Share options */}
        <div className="px-5 pb-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            Share via
          </p>
          <div className="grid grid-cols-2 gap-2">
            {shareOptions.map(({ label, href, icon, colors }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${colors}`}
              >
                {icon}
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}