import { Check, Sparkles, Zap, ShieldCheck, Building2, ArrowRight, CreditCard, History, LayoutGrid } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentPlan, getBillingHistory, initializeBilling } from "../services/api/billing";
import { useToast } from "../components/ui/toast";
import { useAuth } from "../context/AuthContext";
import { getTrialDaysRemaining, isTrialActive, normalizePlan } from "../utils/planAccess";
import "./CSS/pricing.css";

const formatMoney = (amount) => `₦${Number(amount || 0).toLocaleString()}`;

export default function Pricing() {
  const toast = useToast();
  const { user, isAuthenticated } = useAuth();

  const [billingCycle, setBillingCycle] = useState("monthly");
  const [currentPlan, setCurrentPlan] = useState("free");
  const [billingState, setBillingState] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("plans");
  const [upgradingPlan, setUpgradingPlan] = useState("");

  const trialDaysRemaining = getTrialDaysRemaining(user);
  const trialActive = isTrialActive(user);

  // Pricing
  const monthlyPro = 4999;
  const yearlyPro = 49990; // ~16.7% discount
  const yearlySavings = monthlyPro * 12 - yearlyPro;

  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated) return;
      try {
        const [planRes, historyRes] = await Promise.all([
          getCurrentPlan(),
          getBillingHistory(),
        ]);
        setCurrentPlan(normalizePlan(planRes.data?.plan || user?.plan));
        setBillingState(planRes.data);
        setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      } catch (err) {
        setCurrentPlan(normalizePlan(user?.plan));
      }
    };
    loadData();
  }, [isAuthenticated, user?.plan]);

  const plans = [
    {
      id: "free",
      name: "Free",
      icon: <Zap size={28} />,
      description: "For early organizers validating demand and running lean events.",
      price: { monthly: 0, yearly: 0 },
      features: [
        "Create & publish events",
        "Sell tickets & email notifications",
        "Basic dashboard",
        "Standard visibility",
      ],
      cta: "Start Free",
      highlight: false,
    },
    {
      id: "pro",
      name: "Pro",
      icon: <ShieldCheck size={28} />,
      description: "For production-ready teams that want premium growth tools.",
      badge: "Most Popular",
      price: { monthly: monthlyPro, yearly: yearlyPro },
      features: [
        "TickiAI (event generation + concierge)",
        "Advanced analytics & revenue insights",
        "Live streaming & private events",
        "Team roles & custom branding",
        "Priority payouts",
      ],
      cta: "Upgrade to Pro",
      highlight: true,
    },
    {
      id: "business",
      name: "Business",
      icon: <Building2 size={28} />,
      description: "Custom tools for large-scale productions and enterprises.",
      price: { monthly: "Custom", yearly: "Custom" },
      features: [
        "White-label branding",
        "Dedicated success manager",
        "Advanced API access",
        "Custom contracts & SLAs",
        "Everything in Pro",
      ],
      cta: "Contact Sales",
      highlight: false,
    },
  ];

  const handleUpgrade = async (planId) => {
    if (planId === "business") {
      toast.info("Please contact support@tickispot.com for Business plan.");
      return;
    }
    if (!isAuthenticated) {
      window.location.href = "/register";
      return;
    }

    try {
      setUpgradingPlan(planId);
      const response = await initializeBilling({
        plan: planId,
        interval: billingCycle,
      });

      if (response.data?.authorization_url) {
        window.location.href = response.data.authorization_url;
      } else {
        toast.error("Could not start upgrade flow.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Upgrade failed");
    } finally {
      setUpgradingPlan("");
    }
  };

  return (
    <div className="pricing-page-container">
      <div className="pricing-bg-gradient" />

      <div className="pricing-content">
        {/* Hero */}
        <div className="pricing-hero">
          <div className="pricing-badge">
            <Sparkles size={16} /> 14-day free trial on all Pro features
          </div>
          <h1>Simple, powerful pricing for event organizers</h1>
          <p className="pricing-subtitle">
            Start free. Scale with confidence. Everything you need to grow your events.
          </p>

          {trialActive && (
            <div className="trial-status">
              Your trial is active — {trialDaysRemaining} day{trialDaysRemaining !== 1 ? "s" : ""} remaining
            </div>
          )}
        </div>

        {/* Billing Toggle */}
        <div className="billing-switcher">
          <span className={billingCycle === "monthly" ? "active" : ""}>Monthly</span>
          <button
            className={`toggle-pill ${billingCycle}`}
            onClick={() => setBillingCycle(b => b === "monthly" ? "yearly" : "monthly")}
          >
            <div className="toggle-knob" />
          </button>
          <span className={billingCycle === "yearly" ? "active" : ""}>
            Yearly <span className="discount-tag">Save ~17%</span>
          </span>
        </div>

        {/* Tabs */}
        <nav className="pricing-tabs">
          <button className={activeTab === "plans" ? "active" : ""} onClick={() => setActiveTab("plans")}>
            <LayoutGrid size={16} /> Plans
          </button>
          <button className={activeTab === "billing" ? "active" : ""} onClick={() => setActiveTab("billing")}>
            <CreditCard size={16} /> Billing
          </button>
          <button className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}>
            <History size={16} /> History
          </button>
        </nav>

        {/* Plans Tab */}
        {activeTab === "plans" && (
          <>
            <div className="pricing-grid">
              {plans.map((plan) => {
                const isCurrent = currentPlan === plan.id;
                const isProcessing = upgradingPlan === plan.id;
                const priceValue = billingCycle === "yearly" ? plan.price.yearly : plan.price.monthly;

                return (
                  <div key={plan.id} className={`pricing-card ${plan.highlight ? "featured" : ""}`}>
                    {plan.badge && <div className="card-popular-tag">{plan.badge}</div>}

                    <div className="card-icon">{plan.icon}</div>
                    <h3 className="card-name">{plan.name}</h3>
                    <p className="card-desc">{plan.description}</p>

                    <div className="card-price">
                      {typeof priceValue === "number" ? (
                        <>
                          <span className="currency">₦</span>
                          <span className="amount">{priceValue.toLocaleString()}</span>
                          <span className="period">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                        </>
                      ) : (
                        <span className="amount-custom">Custom</span>
                      )}
                    </div>

                    {billingCycle === "yearly" && plan.id === "pro" && (
                      <p className="savings-text">Save ~17% yearly</p>
                    )}

                    <ul className="card-features">
                      {plan.features.map((feature, i) => (
                        <li key={i}>
                          <Check size={18} /> {feature}
                        </li>
                      ))}
                    </ul>

                    <button
                      className={`card-button ${plan.highlight ? "btn-primary" : "btn-secondary"}`}
                      disabled={isCurrent || isProcessing}
                      onClick={() => handleUpgrade(plan.id)}
                    >
                      {isProcessing
                        ? "Processing..."
                        : isCurrent
                          ? "Current Plan"
                          : plan.cta}
                      {!isCurrent && !isProcessing && <ArrowRight size={16} />}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Feature Comparison Table */}
            <div className="pricing-comparison">
              <h3>Feature Comparison</h3>
              <div className="pricing-table-wrap">
                <table className="pricing-table">
                  <thead>
                    <tr>
                      <th>Feature</th>
                      <th>Free</th>
                      <th>Pro</th>
                      <th>Business</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Create events & sell tickets", "Yes", "Yes", "Yes"],
                      ["Basic dashboard", "Yes", "Yes", "Yes"],
                      ["TickiAI", "No", "Yes", "Yes"],
                      ["Advanced analytics", "No", "Yes", "Yes"],
                      ["Live streaming", "No", "Yes", "Yes"],
                      ["Private events", "No", "Yes", "Yes"],
                      ["Team members & roles", "No", "Yes", "Yes"],
                      ["Custom branding", "No", "Yes", "Yes"],
                      ["Priority payouts", "No", "Yes", "Yes"],
                      ["White-label & API", "No", "No", "Yes"],
                      ["Dedicated manager", "No", "No", "Yes"],
                    ].map(([feature, freeV, proV, busV]) => (
                      <tr key={feature}>
                        <td>{feature}</td>
                        <td>{freeV}</td>
                        <td>{proV}</td>
                        <td>{busV}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Billing Tab */}
        {activeTab === "billing" && (
          <div className="info-card">
            <h3>Subscription Details</h3>
            {billingState ? (
              <div className="billing-details">
                <div className="detail-row">
                  <span className="label">Current Plan:</span>
                  <span className="value">{currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Status:</span>
                  <span className="value">{billingState.status || "N/A"}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Next Billing Date:</span>
                  <span className="value">{billingState.nextBillingDate ? new Date(billingState.nextBillingDate).toLocaleDateString() : "N/A"}</span>
                </div>
                {billingState.currentAmount && (
                  <div className="detail-row">
                    <span className="label">Current Amount:</span>
                    <span className="value">{formatMoney(billingState.currentAmount)}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="empty-state">No active subscription</p>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="info-card">
            <h3>Payment History</h3>
            {history && history.length > 0 ? (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry, idx) => (
                    <tr key={idx}>
                      <td>{new Date(entry.createdAt).toLocaleDateString()}</td>
                      <td>{entry.plan || "N/A"}</td>
                      <td>{formatMoney(entry.amount)}</td>
                      <td>
                        <span className={`status ${entry.status}`}>
                          {entry.status || "pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty-state">No payment history</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}