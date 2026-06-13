import { Link, useNavigate, useLocation } from "react-router-dom";
import { X, RotateCcw, MessageCircle, ArrowLeft, AlertTriangle } from "lucide-react";

export default function Failed() {
  const navigate = useNavigate();
  const location = useLocation();

  // Optional context passed via navigate("/payment-failed", { state: { reason, eventId } })
  const reason = location.state?.reason || "Your payment could not be completed.";
  const eventId = location.state?.eventId;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 font-geist">
      <div className="w-full max-w-sm">
        {/* Status line */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-300">
            <X size={15} className="text-white" strokeWidth={3} />
          </span>
          <span className="text-sm font-bold text-gray-900">Payment not completed</span>
        </div>

        {/* Ticket stub, voided */}
        <div className="relative">
          <div className="rounded-t-2xl bg-white border border-gray-100 shadow-sm p-6 pb-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.6rem] font-black uppercase tracking-widest text-gray-400">
                  Order status
                </p>
                <h1 className="mt-1 text-xl font-black text-gray-900 leading-tight">
                  No charge was made
                </h1>
              </div>
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                <AlertTriangle size={20} />
              </div>
            </div>

            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              {reason} Your tickets are still available, you can try again with the same or a different payment method.
            </p>

            <div className="mt-5 rounded-xl bg-gray-50 px-3 py-2.5">
              <p className="text-xs text-gray-600">
                If money left your account, it will be reversed by your bank within
                24 hours. No ticket was issued.
              </p>
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
              <button
                onClick={() => navigate(eventId ? `/events/${eventId}` : -1)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-pink-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-pink-500/20 hover:bg-pink-600 transition-all active:scale-[0.98]"
              >
                <RotateCcw size={14} />
                Try again
              </button>
              <Link
                to="/support"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-600 hover:border-pink-200 hover:text-pink-600 transition-colors"
              >
                <MessageCircle size={14} />
                Contact support
              </Link>
            </div>
          </div>
        </div>

        <Link
          to="/events"
          className="mt-4 flex items-center justify-center gap-1.5 text-[0.7rem] font-semibold text-gray-400 hover:text-pink-500 transition-colors"
        >
          <ArrowLeft size={12} />
          Back to events
        </Link>
      </div>
    </div>
  );
}