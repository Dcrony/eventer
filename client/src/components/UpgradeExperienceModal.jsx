import { Sparkles, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import Button from "./ui/button";
import { initializeBilling } from "../services/api/billing";
import { useToast } from "./ui/toast";

const PLANS = [
  {
    name: "Free",
    price: "N0",
    features: ["Create events", "Sell tickets", "Basic dashboard", "Email notifications"],
    highlight: false,
  },
  {
    name: "Pro",
    price: "N4,999",
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
    <div className="ui-modal-overlay" role="presentation">
      <div className="ui-modal-shell upgrade-modal" role="dialog" aria-labelledby="upgrade-modal-title">
        <div className="ui-modal-header">
          <div>
            <h2 id="upgrade-modal-title" className="ui-modal-title">
              Upgrade to Pro
            </h2>
            <p className="ui-modal-description">
              Unlock {featureLabel}, keep your workflow moving, and start with a 14-day free trial.
            </p>
          </div>
          <button type="button" className="ui-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="ui-modal-body upgrade-modal-body">
          <div className="upgrade-plan-grid upgrade-plan-grid--compact">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`upgrade-plan-card ${plan.highlight ? "is-featured" : ""}`}
              >
                {plan.badge ? <span className="upgrade-plan-badge">{plan.badge}</span> : null}
                <h3>{plan.name}</h3>
                <p className="upgrade-plan-price">
                  <strong>{plan.price}</strong>
                  {plan.name === "Pro" ? <span className="upgrade-plan-period">/mo</span> : null}
                </p>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="upgrade-modal-actions">
            <Button variant="secondary" onClick={onClose}>
              Maybe later
            </Button>
            <Button onClick={handleUpgrade} disabled={processing}>
              {processing ? "Processing..." : "Upgrade Now"}
            </Button>
            <Link to="/pricing" className="upgrade-pricing-link" onClick={onClose}>
              <Sparkles size={14} />
              Compare plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
