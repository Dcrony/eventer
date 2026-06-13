import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Ticket, ArrowRight, Compass, Mail, QrCode } from "lucide-react";

export default function Success() {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(10);

  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    const redirect = setTimeout(() => navigate("/my-tickets"), 10000);
    return () => {
      clearInterval(tick);
      clearTimeout(redirect);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 font-geist">
      <div className="w-full max-w-sm">
        {/* Status line */}
        <div className="flex items-center justify-center gap-2 mb-6 animate-[fadeIn_0.4s_ease-out]">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pink-500">
            <Check size={15} className="text-white" strokeWidth={3} />
          </span>
          <span className="text-sm font-bold text-gray-900">Payment confirmed</span>
        </div>

        {/* Ticket stub */}
        <div className="relative animate-[slideUp_0.5s_ease-out]">
          {/* main card */}
          <div className="rounded-t-2xl bg-white border border-gray-100 shadow-sm p-6 pb-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.6rem] font-black uppercase tracking-widest text-pink-500">
                  Admission ticket
                </p>
                <h1 className="mt-1 text-xl font-black text-gray-900 leading-tight">
                  You're going! 🎉
                </h1>
              </div>
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-500">
                <Ticket size={20} />
              </div>
            </div>

            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              Your order is complete and your ticket has been generated.
            </p>

            <div className="mt-5 space-y-2.5">
              <div className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-3 py-2.5">
                <Mail size={14} className="text-gray-400 flex-shrink-0" />
                <p className="text-xs text-gray-600">
                  A receipt and e-ticket were sent to your email
                </p>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-3 py-2.5">
                <QrCode size={14} className="text-gray-400 flex-shrink-0" />
                <p className="text-xs text-gray-600">
                  Your QR code is in "My tickets" — show it at the door
                </p>
              </div>
            </div>
          </div>

          {/* perforation */}
          <div className="relative flex items-center">
            <div className="absolute left-0 -ml-3 h-6 w-6 rounded-full bg-gray-50" />
            <div className="flex-1 border-t-2 border-dashed border-gray-200" />
            <div className="absolute right-0 -mr-3 h-6 w-6 rounded-full bg-gray-50" />
          </div>

          {/* stub footer */}
          <div className="rounded-b-2xl bg-white border border-t-0 border-gray-100 shadow-sm p-5">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <Link
                to="/my-tickets"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-pink-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-pink-500/20 hover:bg-pink-600 transition-all active:scale-[0.98]"
              >
                View my ticket
                <ArrowRight size={14} />
              </Link>
              <Link
                to="/events"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-600 hover:border-pink-200 hover:text-pink-600 transition-colors"
              >
                <Compass size={14} />
                Find more events
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[0.65rem] text-gray-400">
          Taking you to your tickets in {secondsLeft}s
        </p>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; }
        }
      `}</style>
    </div>
  );
}