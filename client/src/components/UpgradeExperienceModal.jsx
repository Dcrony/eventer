import { useState } from "react";
import { useToast } from "./ui/toast";

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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-white/50 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full sm:max-w-3xl sm:mx-4 sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: "92svh" }}   // ← svh beats dvh/vh on iOS Safari
        role="dialog"
        aria-labelledby="upgrade-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pink accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-pink-500 to-fuchsia-500 rounded-t-2xl flex-shrink-0" />

        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-2 sm:hidden flex-shrink-0">
          <div className="w-9 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 overscroll-contain px-4 pb-6 pt-1 sm:px-6 sm:pt-2 sm:pb-6">

          {/* Header */}
          <div className="flex items-start justify-between gap-3 py-4">
            <div>
              <h2
                id="upgrade-modal-title"
                className="text-base sm:text-xl font-extrabold text-gray-900 tracking-tight"
              >
                Upgrade to Pro
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">
                Unlock {featureLabel} and start with a 14-day free trial.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-pink-50 hover:text-pink-500 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Plans — single column on mobile, two columns on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-5">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-xl border p-4 sm:p-5 ${
                  plan.highlight
                    ? "border-pink-300 bg-white shadow-sm shadow-pink-100"
                    : "border-gray-200 bg-gray-50/60"
                }`}
              >
                {plan.badge && (
                  <span className="absolute top-3 right-3 text-[0.6rem] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500 text-black">
                    {plan.badge}
                  </span>
                )}
                <h3 className="text-sm sm:text-base font-extrabold text-gray-900 mb-1">
                  {plan.name}
                </h3>
                <p className="mb-3 text-gray-500">
                  <strong className="text-lg sm:text-2xl font-extrabold text-gray-900">
                    {plan.price}
                  </strong>
                  {plan.name === "Pro" && (
                    <span className="text-xs text-gray-400 ml-1">/month</span>
                  )}
                </p>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Actions — stacked on mobile */}
          <div className="flex flex-col gap-2 pt-4 border-t border-gray-100 sm:flex-row sm:items-center sm:gap-3">
            {/* Primary CTA always on top on mobile */}
            <Button
              onClick={handleUpgrade}
              disabled={processing}
              className="w-full sm:w-auto order-first"
            >
              {processing ? "Processing..." : "Upgrade now"}
            </Button>

            <div className="flex gap-2 sm:contents">
              <Button
                variant="secondary"
                onClick={onClose}
                className="flex-1 sm:w-auto sm:flex-none"
              >
                Maybe later
              </Button>
              <Link
                to="/pricing"
                onClick={onClose}
                className="flex-1 sm:flex-none sm:ml-auto inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-pink-500 hover:text-pink-600 transition-colors border border-pink-100 rounded-lg px-3 py-2 sm:border-0 sm:px-0 sm:py-0"
              >
                <Sparkles size={13} />
                Compare plans
              </Link>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.95) } to { opacity: 1; transform: scale(1) } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(100%) } to { opacity: 1; transform: translateY(0) } }
        .animate-fade-in { animation: fade-in 0.2s ease-out }
        .animate-scale-in { animation: scale-in 0.25s cubic-bezier(0.34,1.56,0.64,1) }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.32,0.72,0,1) }
      `}</style>
    </div>
  );
}