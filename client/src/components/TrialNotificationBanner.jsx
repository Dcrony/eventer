import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  normalizePlan,
  isTrialActive,
  getTrialDaysRemaining,
  isTrialEndingSoon,
} from "../utils/planAccess";
import { X, Sparkles, AlertTriangle, Star } from "lucide-react";

export default function TrialNotificationBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const plan = normalizePlan(user?.plan);
  const trialActive = isTrialActive(user);
  const daysLeft = getTrialDaysRemaining(user);
  const endingSoon = isTrialEndingSoon(user, 3);
  const isExpired = plan === "trial" && !trialActive;
  const isNewUser = trialActive && daysLeft >= 13;

  const dismissKey = `trial_banner_dismissed_${user?._id}_${new Date().toDateString()}`;

  useEffect(() => {
    setDismissed(localStorage.getItem(dismissKey) === "true");
  }, [dismissKey]);

  const handleDismiss = () => {
    localStorage.setItem(dismissKey, "true");
    setDismissed(true);
  };

  const handleUpgrade = () => {
    window.location.href = "/upgrade";
  };

  const handleExplore = () => {
    window.location.href = "/features";
  };

  if (!user || plan === "pro" || dismissed) return null;
  if (plan === "free" && !trialActive && !isExpired) return null;

  const progressPercent = Math.round((daysLeft / 14) * 100);

  // New User Banner
  if (isNewUser) {
    return (
      <div className="relative mx-4 mb-4 overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 shadow-lg">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 pr-12">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Star size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-extrabold text-white mb-1">Welcome! Your 14-day Pro trial has started</p>
            <p className="text-xs text-white/80 leading-relaxed">
              You have full access to live streaming, advanced analytics, and all Pro features — free for 14 days. No credit card needed.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={handleExplore} className="px-4 py-1.5 rounded-full bg-white text-pink-600 text-xs font-bold hover:bg-gray-100 transition-all">Explore Pro features</button>
              <button onClick={handleDismiss} className="px-4 py-1.5 rounded-full bg-white/20 text-white text-xs font-bold hover:bg-white/30 transition-all">Dismiss</button>
            </div>
          </div>
        </div>
        <button onClick={handleDismiss} className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors"><X size={16} /></button>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
    );
  }

  // Expired Trial Banner
  if (isExpired) {
    return (
      <div className="relative mx-4 mb-4 overflow-hidden rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 shadow-lg">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 pr-12">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <AlertTriangle size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-extrabold text-white mb-1">Your Pro trial has ended</p>
            <p className="text-xs text-white/80 leading-relaxed">
              You're now on the free plan. Upgrade to Pro to restore access to live streaming, analytics, and more.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={handleUpgrade} className="px-4 py-1.5 rounded-full bg-white text-red-600 text-xs font-bold hover:bg-gray-100 transition-all">Upgrade to Pro</button>
              <button onClick={handleDismiss} className="px-4 py-1.5 rounded-full bg-white/20 text-white text-xs font-bold hover:bg-white/30 transition-all">Stay on free</button>
            </div>
          </div>
        </div>
        <button onClick={handleDismiss} className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors"><X size={16} /></button>
      </div>
    );
  }

  // Active/Ending Soon Banner
  return (
    <div className={`relative mx-4 mb-4 overflow-hidden rounded-2xl shadow-lg ${
      endingSoon ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-pink-500 to-purple-600"
    }`}>
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 pr-12">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
          <Sparkles size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-extrabold text-white mb-1">
            {endingSoon
              ? `Only ${daysLeft} day${daysLeft === 1 ? "" : "s"} left — your trial is ending soon`
              : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left on your Pro trial`}
          </p>
          <p className="text-xs text-white/80 leading-relaxed">
            {endingSoon
              ? "Upgrade now to keep live streaming, analytics, and all Pro features without interruption."
              : "You still have full access to all Pro features. Upgrade before your trial ends to keep access."}
          </p>
          <div className="w-full h-1.5 bg-white/20 rounded-full mt-3 mb-2">
            <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <button onClick={handleUpgrade} className="px-4 py-1.5 rounded-full bg-white text-pink-600 text-xs font-bold hover:bg-gray-100 transition-all">
              {endingSoon ? "Upgrade now" : "Upgrade to Pro"}
            </button>
            <button onClick={handleDismiss} className="px-4 py-1.5 rounded-full bg-white/20 text-white text-xs font-bold hover:bg-white/30 transition-all">
              {endingSoon ? "Dismiss" : "Remind me later"}
            </button>
          </div>
        </div>
      </div>
      <button onClick={handleDismiss} className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors"><X size={16} /></button>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
      </div>
    </div>
  );
}