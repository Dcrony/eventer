import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import "./CSS/landing.css";
import { useEffect, useState } from "react";
import { getBillingHistory, getCurrentPlan, upgradePlan } from "../services/api/billing";
import { useToast } from "../components/ui/toast";
import Badge from "../components/ui/badge";
import { Tabs, TabButton } from "../components/ui/tabs";

export default function Pricing() {
  const toast = useToast();
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [currentPlan, setCurrentPlan] = useState("free");
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState("plans");

  useEffect(() => {
    const load = async () => {
      try {
        const [planRes, historyRes] = await Promise.all([getCurrentPlan(), getBillingHistory()]);
        setCurrentPlan(String(planRes.data.plan || "free"));
        setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      } catch {
        // Public users can still view plans without auth.
      }
    };
    load();
  }, []);

  const plans = [
    {
      name: "Free",
      price: "₦0",
      period: "/month",
      features: [
        "Up to 2 events per month",
        "Standard visibility on discovery",
        "Core ticketing & QR check-in",
        "No analytics dashboard",
        "Community support & help center",
        "Secure payments via Paystack",
      ],
      cta: { to: "/register", label: "Get started" },
      highlight: false,
    },
    {
      name: "Pro",
      price: "₦4,999",
      period: "/month",
      badge: "Most Popular",
      features: [
        "Unlimited events",
        "Full analytics dashboard",
        "Featured listings in discovery",
        "Live streaming embeds",
        "Advanced attendee insights",
        "Custom branding on event pages",
        "Priority support",
      ],
      cta: { to: "/login", label: "Upgrade to Pro" },
      highlight: true,
    },
    {
      name: "Business",
      price: "Custom",
      period: "",
      features: [
        "Everything in Pro",
        "Priority promotion & placement",
        "Advanced analytics & exports",
        "Custom branding & white-label options",
        "Dedicated success manager",
        "Custom contracts & invoicing",
      ],
      cta: { to: "/contact", label: "Talk to sales" },
      highlight: false,
    },
  ];

  const handleUpgrade = async (planName) => {
    const normalized = planName.toLowerCase();
    try {
      await upgradePlan({ plan: normalized, interval: billingCycle });
      setCurrentPlan(normalized);
      toast.success(`Plan changed to ${planName}`);
      setTab("history");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login to upgrade your plan");
    }
  };

  return (
    <div className="landing-page">
      <div className="grid-background" aria-hidden="true" />
      <section className="pricing-section">
        <div className="pricing-section-inner">
          <div className="section-header animate-in">
            <h1 className="section-title">
              <span className="title-box title-box-border">Simple</span>
              <span className="title-box title-box-filled">Pricing</span>
            </h1>
            <p className="section-subtitle">
              Choose the plan that fits your needs. Transparent pricing, no surprise fees.
            </p>
            <div className="mt-3 flex gap-2 justify-center">
              <Tabs>
                <TabButton active={billingCycle === "monthly"} onClick={() => setBillingCycle("monthly")}>Monthly</TabButton>
                <TabButton active={billingCycle === "yearly"} onClick={() => setBillingCycle("yearly")}>Yearly</TabButton>
              </Tabs>
            </div>
            <div className="mt-3 flex gap-2 justify-center">
              <Tabs>
                <TabButton active={tab === "plans"} onClick={() => setTab("plans")}>Plans</TabButton>
                <TabButton active={tab === "billing"} onClick={() => setTab("billing")}>Billing</TabButton>
                <TabButton active={tab === "history"} onClick={() => setTab("history")}>Subscription History</TabButton>
              </Tabs>
            </div>
          </div>

          {tab === "plans" ? <div className="pricing-card-grid">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`pricing-card ${plan.highlight ? "pricing-card--featured" : ""}`}
              >
                {plan.badge && (
                  <span className="pricing-card-badge">{plan.badge}</span>
                )}
                <div className="pricing-card-body">
                  <h3 className="pricing-card-title">{plan.name}</h3>
                  {currentPlan === plan.name.toLowerCase() ? <Badge className="ml-2">Active</Badge> : null}
                  <div className="pricing-card-price-row">
                    <span className="pricing-card-price">{plan.price}</span>
                    {plan.period ? (
                      <span className="pricing-card-period">{plan.period}</span>
                    ) : null}
                  </div>
                  <ul className="pricing-feature-list">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="pricing-feature-item">
                        <CheckCircle2
                          className="pricing-feature-icon"
                          size={18}
                          aria-hidden="true"
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  to={plan.cta?.to || "/register"}
                  className={`btn ${plan.highlight ? "btn-primary" : "btn-outline"} pricing-card-cta`}
                  onClick={(event) => {
                    if (currentPlan === plan.name.toLowerCase()) {
                      event.preventDefault();
                      return;
                    }
                    if (plan.name === "Pro" || plan.name === "Business") {
                      event.preventDefault();
                      handleUpgrade(plan.name);
                    }
                  }}
                >
                  {currentPlan === plan.name.toLowerCase() ? "Current Plan" : plan.cta?.label || `Choose ${plan.name}`}
                </Link>
              </div>
            ))}
          </div> : null}
          {tab === "billing" ? <div className="dash-card"><div className="dash-card-body"><h3>Current Plan</h3><p className="muted mt-1">{currentPlan}</p><p className="muted mt-2">Invoices are currently mocked and shown in the history tab.</p></div></div> : null}
          {tab === "history" ? <div className="dash-card"><div className="dash-card-body"><h3>Subscription History</h3>{history.length ? history.map((item, i) => <p key={`${item.changedAt}-${i}`}>{item.plan} - {item.interval} - {item.amount} - {new Date(item.changedAt).toLocaleDateString()}</p>) : <p className="muted">No records yet.</p>}</div></div> : null}
        </div>
      </section>
    </div>
  );
}
