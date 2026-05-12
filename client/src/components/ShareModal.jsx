import { Copy, Facebook, MessageCircle, Send, Share2, X } from "lucide-react";
import { useState } from "react";

export default function ShareModal({ open, onClose, url, title }) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const encodedUrl = encodeURIComponent(url);
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
      bg: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    },
    {
      label: "Twitter / X",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: <Share2 size={18} />,
      bg: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: <Facebook size={18} />,
      bg: "bg-blue-50 text-blue-700 hover:bg-blue-100",
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      icon: <Send size={18} />,
      bg: "bg-sky-50 text-sky-700 hover:bg-sky-100",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pink accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-pink-500 to-fuchsia-500" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-extrabold text-gray-900 tracking-tight">Share</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-all duration-200 hover:text-pink-500 hover:bg-pink-50"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Copy Link Section */}
        <div className="px-5 pt-4 pb-3">
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400 mb-2">Link</p>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
            <p className="flex-1 text-sm text-gray-600 truncate font-medium min-w-0">{url}</p>
            <button
              onClick={copyLink}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${
                copied
                  ? "bg-green-500 text-white"
                  : "bg-pink-500 text-white hover:bg-pink-600"
              }`}
            >
              <Copy size={13} />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Share Options */}
        <div className="px-5 pb-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400 mb-3">Share via</p>
          <div className="grid grid-cols-2 gap-2">
            {shareOptions.map(({ label, href, icon, bg }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2.5 px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 ${bg}`}
              >
                {icon}
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
}