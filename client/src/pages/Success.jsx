import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, Ticket, ArrowRight, Home, Sparkles } from "lucide-react";

export default function Success() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/my-tickets");
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 via-white to-pink-50/30 font-geist">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 text-center shadow-xl">
        {/* Success Animation */}
        <div className="flex justify-center mb-5">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-pink-100 animate-pulse">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-pink-500">
              <CheckCircle size={40} className="text-white" />
            </div>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
          Payment Successful! 🎉
        </h1>
        <p className="text-sm text-gray-500 mb-5">
          Your ticket has been created and confirmed.
        </p>

        {/* Ticket Preview */}
        <div className="border border-pink-200 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100/30 p-4 text-left mb-5">
          <div className="flex items-center gap-2 mb-2 text-pink-600 font-semibold">
            <Ticket size={18} />
            <span className="text-sm font-bold">Your Ticket</span>
          </div>
          <div className="text-gray-600">
            <p className="text-sm">A confirmation has been sent to your email</p>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
              <Sparkles size={12} />
              <span>Check your inbox for the e-ticket and QR code</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
          <Link
            to="/my-tickets"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-pink-500 text-white text-sm font-semibold transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 shadow-md shadow-pink-500/25"
          >
            <Ticket size={16} />
            View My Tickets
            <ArrowRight size={16} />
          </Link>

          <Link
            to="/events"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border-2 border-gray-200 bg-white text-gray-700 text-sm font-semibold transition-all duration-200 hover:border-pink-300 hover:text-pink-500"
          >
            <Home size={16} />
            Browse More Events
          </Link>
        </div>

        {/* Auto-redirect Info */}
        <p className="text-xs text-gray-400 mt-5">
          Redirecting to your tickets in 10 seconds...
        </p>
      </div>
    </div>
  );
}