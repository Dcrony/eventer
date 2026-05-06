import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  normalizePlan,
  isTrialActive,
  getTrialDaysRemaining,
  isTrialEndingSoon,
} from "../utils/planAccess";
import "./css/TrialNotificationBanner.css";

export default function TrialNotificationBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const plan = normalizePlan(user?.plan);
  const trialActive = isTrialActive(user);
  const daysLeft = getTrialDaysRemaining(user);
  const endingSoon = isTrialEndingSoon(user, 3);
  const isExpired = plan === "trial" && !trialActive;
  const isNewUser = trialActive && daysLeft >= 13; // just signed up

  // Reset dismiss on each login (key by userId + date)
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

  // Only show for trial/free plan users
  if (!user || plan === "pro" || dismissed) return null;
  if (plan === "free" && !trialActive && !isExpired) return null;

  const progressPercent = Math.round((daysLeft / 14) * 100);

  if (isNewUser) {
    return (
      <div className="trial-banner new-user">
        <div className="trial-icon">★</div>
        <div className="trial-text">
          <p className="trial-title">Welcome! Your 14-day Pro trial has started</p>
          <p className="trial-desc">
            You have full access to live streaming, advanced analytics, and all
            Pro features — free for 14 days. No credit card needed.
          </p>
          <div className="trial-actions">
            <button className="trial-btn primary" onClick={handleExplore}>
              Explore Pro features
            </button>
            <button className="trial-btn ghost" onClick={handleDismiss}>
              Dismiss
            </button>
          </div>
        </div>
        <button className="trial-close" onClick={handleDismiss}>✕</button>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="trial-banner expired">
        <div className="trial-icon">✗</div>
        <div className="trial-text">
          <p className="trial-title">Your Pro trial has ended</p>
          <p className="trial-desc">
            You're now on the free plan. Upgrade to Pro to restore access to
            live streaming, analytics, and more.
          </p>
          <div className="trial-actions">
            <button className="trial-btn primary" onClick={handleUpgrade}>
              Upgrade to Pro
            </button>
            <button className="trial-btn ghost" onClick={handleDismiss}>
              Stay on free
            </button>
          </div>
        </div>
        <button className="trial-close" onClick={handleDismiss}>✕</button>
      </div>
    );
  }

  return (
    <div className={`trial-banner ${endingSoon ? "warning" : "active"}`}>
      <div className="trial-icon">{endingSoon ? "⚠" : "▶"}</div>
      <div className="trial-text">
        <p className="trial-title">
          {endingSoon
            ? `Only ${daysLeft} day${daysLeft === 1 ? "" : "s"} left — your trial is ending soon`
            : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left on your Pro trial`}
        </p>
        <p className="trial-desc">
          {endingSoon
            ? "Upgrade now to keep live streaming, analytics, and all Pro features without interruption."
            : "You still have full access to all Pro features. Upgrade before your trial ends to keep access."}
        </p>
        <div className="progress-wrap">
          <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="trial-actions">
          <button className="trial-btn primary" onClick={handleUpgrade}>
            {endingSoon ? "Upgrade now" : "Upgrade to Pro"}
          </button>
          <button className="trial-btn ghost" onClick={handleDismiss}>
            {endingSoon ? "Dismiss" : "Remind me later"}
          </button>
        </div>
      </div>
      <button className="trial-close" onClick={handleDismiss}>✕</button>
    </div>
  );
}