import { useState } from "react";
import { X, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "./ui/button";
import { initializeBilling } from "../services/api/billing";
import { useToast } from "./ui/toast";

const PLANS = [
  {
    name: "Free",
    price: "₦0",
    features: ["Create events", "Sell tickets", "Basic dashboard", "Email notifications"],
    highlight: false,
  },
  {
    name: "Pro",
    price: "₦4,999",
    badge: "14-day free trial",
    features: ["TickiAI", "Advanced analytics", "Live streaming", "Private events and team roles"],
    highlight: true,
  },
];

export default function UpgradeExperienceModal({ open, onClose, featureName = "" }) {
  const toast = useToast();
  const [processing, setProcessing] = useState(false);

  if (!open) return null;

  const featureLabel = featureName
    ? String(featureName).replace(/[_-]+/g, " ")
    : "premium features";

  const handleUpgrade = async () => {
    try {
      setProcessing(true);
      const response = await initializeBilling({ plan: "pro", interval: "monthly" });
      if (response.data?.authorization_url) {
        window.location.href = response.data.authorization_url;
      } else {
        toast.error("Unable to generate payment link.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Please login to upgrade your plan.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10010] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl border border-gray-200 flex flex-col max-h-[85vh] sm:max-h-[90vh] animate-slide-up"
        role="dialog"
        aria-labelledby="upgrade-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pink accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-pink-500 to-fuchsia-500 flex-shrink-0" />

        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-2 pb-0 sm:hidden flex-shrink-0">
          <div className="w-9 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <div>
            <h2
              id="upgrade-modal-title"
              className="text-base font-extrabold tracking-tight text-gray-900"
            >
              Upgrade to Pro
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
              Unlock {featureLabel} — start with a 14-day free trial.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 transition-all duration-200 hover:bg-red-50 hover:border-red-200 hover:text-red-500 hover:rotate-90"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5">

          {/* Plans */}
          <div className="flex flex-col gap-3 mb-5">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-xl border p-4 transition-all duration-200 ${
                  plan.highlight
                    ? "border-pink-300 bg-white shadow-sm shadow-pink-100"
                    : "border-gray-200 bg-gray-50/60"
                }`}
              >
                {plan.badge && (
                  <span className="absolute top-3 right-3 text-[0.6rem] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500 text-white">
                    {plan.badge}
                  </span>
                )}
                <h3 className="text-sm font-extrabold text-gray-900 mb-1">
                  {plan.name}
                </h3>
                <p className="mb-3">
                  <strong className="text-xl font-extrabold text-gray-900">
                    {plan.price}
                  </strong>
                  {plan.name === "Pro" && (
                    <span className="text-xs text-gray-400 ml-1">/month</span>
                  )}
                </p>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs text-gray-600">
                      <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions — always visible, never scrolls away */}
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0 flex flex-col gap-2">
          <button
            onClick={handleUpgrade}
            disabled={processing}
            className="w-full h-10 rounded-full bg-pink-500 text-white text-sm font-bold hover:bg-pink-600 transition-all shadow-sm shadow-pink-500/25 disabled:opacity-60"
          >
            {processing ? "Processing..." : "Upgrade now"}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex-1 h-10 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
            >
              Maybe later
            </button>
            <Link
              to="/pricing"
              onClick={onClose}
              className="flex-1 h-10 rounded-full border border-pink-100 bg-white inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-pink-500 hover:bg-pink-50 hover:border-pink-300 transition-all"
            >
              <Sparkles size={13} />
              Compare plans
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.25s cubic-bezier(0.34,1.56,0.64,1); }
      `}</style>
    </div>
  );
}