// src/components/RoleSelectionModal.jsx
import { useState } from "react";
import { ArrowRight, CalendarDays, Ticket } from "lucide-react";
import API from "../api/axios";

export default function RoleSelectionModal({ user, token, onComplete }) {
  const [role, setRole] = useState(user?.role === "user" ? "user" : "organizer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = async () => {
    setLoading(true);
    setError("");
    try {
      // Attach the token explicitly — login() hasn't been called yet so
      // the global axios instance has no Authorization header at this point.
      await API.patch(
        "/users/me/role",
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onComplete(role);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save role. Please try again.");
      setLoading(false);
    }
  };

  const firstName = user?.name?.split(" ")[0] || "there";

  const roles = [
    {
      id: "organizer",
      label: "Event organizer",
      desc: "Create events, sell tickets, manage attendees and track sales.",
      icon: <CalendarDays size={20} className="text-pink-600" />,
      iconBg: "bg-pink-100",
    },
    {
      id: "user",
      label: "Event attendee",
      desc: "Discover events, buy tickets, and follow creators you love.",
      icon: <Ticket size={20} className="text-blue-600" />,
      iconBg: "bg-blue-100",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-7 animate-slide-up">
        <div className="text-center mb-6">
          <div className="w-11 h-11 rounded-full bg-pink-100 text-pink-600 font-bold text-lg flex items-center justify-center mx-auto mb-3">
            {(user?.name?.[0] || "?").toUpperCase()}
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-1">
            Welcome, {firstName}!
          </h2>
          <p className="text-sm text-gray-500">
            How will you use TickiSpot? You can change this in Settings anytime.
          </p>
        </div>

        <div className="space-y-3 mb-5">
          {roles.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                role === r.id
                  ? "border-pink-500 bg-pink-50"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <span className={`w-10 h-10 rounded-lg ${r.iconBg} flex items-center justify-center shrink-0`}>
                {r.icon}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-bold text-gray-900 mb-0.5">{r.label}</span>
                <span className="block text-xs text-gray-500 leading-relaxed">{r.desc}</span>
              </span>
              <span
                className={`mt-1 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                  role === r.id ? "border-pink-500 bg-pink-500" : "border-gray-300"
                }`}
              >
                {role === r.id && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
              </span>
            </button>
          ))}
        </div>

        {error && <p className="text-xs text-red-500 text-center mb-3">{error}</p>}

        <button
          onClick={handleContinue}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-pink-500 text-white text-sm font-bold hover:bg-pink-600 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Continue as {role === "organizer" ? "organizer" : "attendee"}
              <ArrowRight size={16} />
            </>
          )}
        </button>

        <p className="text-center text-[0.65rem] text-gray-400 mt-3">
          You can switch roles any time in your profile settings.
        </p>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.25s ease-out; }
      `}</style>
    </div>
  );
}