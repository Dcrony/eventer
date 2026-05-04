import { Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentPlan, initializeBilling } from "../services/api/billing";
import { useToast } from "../components/ui/toast";
import { useAuth } from "../context/AuthContext";
import { getTrialDaysRemaining, isTrialActive, normalizePlan } from "../utils/planAccess";
import "./CSS/Pricing.css";

const FEATURE_ROWS = [
  ["Create events", "Yes", "Yes"],
  ["Sell tickets", "Yes", "Yes"],
  ["Basic dashboard", "Yes", "Yes"],
  ["Email notifications", "Yes", "Yes"],
  ["Attendee limits", "Limited", "Expanded"],
  ["TickiAI", "No", "Yes"],
  ["Advanced analytics", "No", "Yes"],
  ["Live streaming", "No", "Yes"],
  ["Private events", "No", "Yes"],
  ["Team members and roles", "No", "Yes"],
  ["Custom branding", "No", "Yes"],
  ["Priority payouts", "No", "Yes"],
];

export default function Pricing() {
  const toast = useToast();
  const { user, isAuthenticated } = useAuth();
  const [currentPlan, setCurrentPlan] = useState("free");
  const [loadingUpgrade, setLoadingUpgrade] = useState(false);

  useEffect(() => {
    const loadPlan = async () => {
      if (!isAuthenticated) return;
      try {
        const { data } = await getCurrentPlan();
        setCurrentPlan(normalizePlan(data?.plan || user?.plan));
      } catch {
        setCurrentPlan(normalizePlan(user?.plan));
      }
    };

    loadPlan();
  }, [isAuthenticated, user?.plan]);

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      window.location.href = "/register";
      return;
    }

    try {
      setLoadingUpgrade(true);
      const response = await initializeBilling({ plan: "pro", interval: "monthly" });
      if (response.data?.authorization_url) {
        window.location.href = response.data.authorization_url;
      } else {
        toast.error("Could not start the upgrade flow.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not start the upgrade flow.");
    } finally {
      setLoadingUpgrade(false);
    }
  };

  const trialDaysRemaining = getTrialDaysRemaining(user);
  const trialActive = isTrialActive(user);

  return (
    <div className="pricing-shell">
      <div className="pricing-hero">
        <div className="pricing-badge">
          <Sparkles size={14} />
          14-day free trial
        </div>
        <h1>Simple pricing for growing event organizers</h1>
        <p>
          Start on a useful free plan, then unlock TickiAI, streaming, analytics, and private
          events when you are ready to scale.
        </p>
        {trialActive ? (
          <div className="pricing-status">
            Your trial is active for {trialDaysRemaining} more day{trialDaysRemaining === 1 ? "" : "s"}.
          </div>
        ) : null}
      </div>

      <section className="pricing-cards">
        <article className="pricing-plan-card">
          <div className="pricing-plan-head">
            <span className="pricing-plan-label">Free</span>
            <h2>N0</h2>
            <p>For early organizers validating demand and running lean events.</p>
          </div>
          <ul className="pricing-plan-list">
            <li><Check size={16} /> Create and publish events</li>
            <li><Check size={16} /> Sell tickets and send email notifications</li>
            <li><Check size={16} /> Access the basic dashboard</li>
            <li><Check size={16} /> Keep using TickiSpot with no card required</li>
          </ul>
          <Link className="pricing-secondary-btn" to={isAuthenticated ? "/events" : "/register"}>
            Start Free Trial
          </Link>
        </article>

        <article className="pricing-plan-card pricing-plan-card--featured">
          <div className="pricing-plan-ribbon">Most popular</div>
          <div className="pricing-plan-head">
            <span className="pricing-plan-label">Pro</span>
            <h2>N4,999<span>/month</span></h2>
            <p>For production-ready teams that want premium growth tools and deeper control.</p>
          </div>
          <ul className="pricing-plan-list">
            <li><Check size={16} /> TickiAI for event generation and concierge help</li>
            <li><Check size={16} /> Advanced analytics and revenue insights</li>
            <li><Check size={16} /> Live streaming, private events, and team roles</li>
            <li><Check size={16} /> Custom branding and priority payouts</li>
          </ul>
          <button
            type="button"
            className="pricing-primary-btn"
            onClick={handleUpgrade}
            disabled={loadingUpgrade || currentPlan === "pro"}
          >
            {currentPlan === "pro" ? "Current Plan" : loadingUpgrade ? "Processing..." : "Upgrade to Pro"}
          </button>
        </article>
      </section>

      <section className="pricing-comparison">
        <div className="pricing-section-head">
          <h3>Feature comparison</h3>
          <p>Everything you need to understand what stays free and what scales with Pro.</p>
        </div>

        <div className="pricing-table-wrap">
          <table className="pricing-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Free</th>
                <th>Pro</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_ROWS.map(([feature, freeValue, proValue]) => (
                <tr key={feature}>
                  <td>{feature}</td>
                  <td>{freeValue}</td>
                  <td>{proValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="pricing-cta">
        <div>
          <h3>Start free, upgrade when the workflow proves itself</h3>
          <p>The trial opens every Pro feature for 14 days, so your team can test before paying.</p>
        </div>
        <div className="pricing-cta-actions">
          <Link className="pricing-secondary-btn" to={isAuthenticated ? "/billing" : "/register"}>
            {isAuthenticated ? "View Billing" : "Start Free Trial"}
          </Link>
          <button type="button" className="pricing-primary-btn" onClick={handleUpgrade} disabled={loadingUpgrade}>
            Upgrade to Pro
          </button>
        </div>
      </section>
    </div>
  );
}
