import { Sparkles, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
      role="presentation"
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-scale-in"
        role="dialog"
        aria-labelledby="upgrade-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pink accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-pink-500 to-fuchsia-500" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 pb-3">
          <div>
            <h2 id="upgrade-modal-title" className="text-xl font-extrabold text-gray-900 tracking-tight">
              Upgrade to Pro
            </h2>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              Unlock {featureLabel}, keep your workflow moving, and start with a 14-day free trial.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 transition-all duration-200 hover:bg-pink-50 hover:text-pink-500"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 pt-2">
          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-xl border p-5 transition-all duration-200 ${
                  plan.highlight
                    ? "border-pink-300 bg-gradient-to-br from-pink-50/50 to-white shadow-md shadow-pink-100"
                    : "border-gray-200 bg-gray-50/50 hover:border-pink-200"
                }`}
              >
                {plan.badge && (
                  <span className="absolute top-3 right-3 text-[0.65rem] font-extrabold uppercase tracking-wider px-2 py-1 rounded-full bg-pink-500 text-white shadow-sm">
                    {plan.badge}
                  </span>
                )}
                <h3 className="text-lg font-extrabold text-gray-900 mb-1">{plan.name}</h3>
                <p className="mb-3 text-gray-500">
                  <strong className="text-2xl font-extrabold text-gray-900">{plan.price}</strong>
                  {plan.name === "Pro" && <span className="text-sm text-gray-400 ml-1">/month</span>}
                </p>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
              Maybe later
            </Button>
            <Button onClick={handleUpgrade} disabled={processing} className="w-full sm:w-auto">
              {processing ? "Processing..." : "Upgrade Now"}
            </Button>
            <Link
              to="/pricing"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-pink-500 hover:text-pink-600 transition-colors sm:ml-auto"
            >
              <Sparkles size={14} />
              Compare plans
            </Link>
          </div>
        </div>

        <style jsx>{`
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scale-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in {
            animation: fade-in 0.2s ease-out;
          }
          .animate-scale-in {
            animation: scale-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
        `}</style>
      </div>
    </div>
  );
}