import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import "./CSS/landing.css";
import { useEffect, useState } from "react";
import { getBillingHistory, getCurrentPlan, initializeBilling } from "../services/api/billing";
import { useToast } from "../components/ui/toast";
import Badge from "../components/ui/badge";
import { Tabs, TabButton } from "../components/ui/tabs";

const formatMoney = (amount) => `₦${Number(amount || 0).toLocaleString()}`;

export default function Pricing() {
  const toast = useToast();
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [currentPlan, setCurrentPlan] = useState("free");
  const [billingState, setBillingState] = useState(null);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState("plans");
  const [upgradingPlan, setUpgradingPlan] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [planRes, historyRes] = await Promise.all([getCurrentPlan(), getBillingHistory()]);
        setCurrentPlan(String(planRes.data.plan || "free"));
        setBillingState(planRes.data);
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
      yearlyPrice: "₦0",
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
      yearlyPrice: "₦49,990",
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
      yearlyPrice: "Custom",
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
    if (normalized === "business") {
      toast.info("Business billing is custom. Please contact sales.");
      return;
    }

    try {
      setUpgradingPlan(normalized);
      const response = await initializeBilling({ plan: normalized, interval: billingCycle });
      const authUrl = response.data?.authorization_url;

      if (!authUrl) {
        toast.error("No payment link returned");
        return;
      }

      window.location.href = authUrl;
    } catch (error) {
      toast.error(error.response?.data?.message || "Login to upgrade your plan");
    } finally {
      setUpgradingPlan("");
    }
  };

  const nextBillingDate = billingState?.subscription?.nextBillingDate || billingState?.billing?.nextBillingDate;

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
                <TabButton active={billingCycle === "monthly"} onClick={() => setBillingCycle("monthly")}>
                  Monthly
                </TabButton>
                <TabButton active={billingCycle === "yearly"} onClick={() => setBillingCycle("yearly")}>
                  Yearly
                </TabButton>
              </Tabs>
            </div>
            <div className="mt-3 flex gap-2 justify-center">
              <Tabs>
                <TabButton active={tab === "plans"} onClick={() => setTab("plans")}>
                  Plans
                </TabButton>
                <TabButton active={tab === "billing"} onClick={() => setTab("billing")}>
                  Billing
                </TabButton>
                <TabButton active={tab === "history"} onClick={() => setTab("history")}>
                  Subscription History
                </TabButton>
              </Tabs>
            </div>
          </div>

          {tab === "plans" ? (
            <div className="pricing-card-grid">
              {plans.map((plan, index) => {
                const normalized = plan.name.toLowerCase();
                const isCurrentPlan = currentPlan === normalized;
                const isUpgrading = upgradingPlan === normalized;
                const displayPrice = billingCycle === "yearly" ? plan.yearlyPrice : plan.price;
                const displayPeriod =
                  plan.name === "Pro" ? (billingCycle === "yearly" ? "/year" : "/month") : plan.period;

                return (
                  <div
                    key={index}
                    className={`pricing-card ${plan.highlight ? "pricing-card--featured" : ""}`}
                  >
                    {plan.badge && <span className="pricing-card-badge">{plan.badge}</span>}
                    <div className="pricing-card-body">
                      <h3 className="pricing-card-title">{plan.name}</h3>
                      {isCurrentPlan ? <Badge className="ml-2">Active</Badge> : null}
                      <div className="pricing-card-price-row">
                        <span className="pricing-card-price">{displayPrice}</span>
                        {displayPeriod ? <span className="pricing-card-period">{displayPeriod}</span> : null}
                      </div>
                      <ul className="pricing-feature-list">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="pricing-feature-item">
                            <CheckCircle2 className="pricing-feature-icon" size={18} aria-hidden="true" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link
                      to={plan.cta?.to || "/register"}
                      className={`btn ${plan.highlight ? "btn-primary" : "btn-outline"} pricing-card-cta`}
                      onClick={(event) => {
                        if (isCurrentPlan) {
                          event.preventDefault();
                          return;
                        }
                        if (plan.name === "Pro") {
                          event.preventDefault();
                          handleUpgrade(plan.name);
                        }
                      }}
                      aria-disabled={isUpgrading}
                      style={isUpgrading ? { pointerEvents: "none", opacity: 0.7 } : undefined}
                    >
                      {isUpgrading
                        ? "Redirecting..."
                        : isCurrentPlan
                          ? "Current Plan"
                          : plan.cta?.label || `Choose ${plan.name}`}
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : null}

          {tab === "billing" ? (
            <div className="dash-card">
              <div className="dash-card-body">
                <h3>Current Billing</h3>
                <p className="muted mt-1">Current plan: {billingState?.billing?.plan || "Free"}</p>
                <p className="muted mt-1">
                  Payment status: {billingState?.subscription?.status || billingState?.billing?.billingStatus || "inactive"}
                </p>
                <p className="muted mt-1">
                  Billing cycle: {billingState?.subscription?.interval || billingState?.billing?.cycle || "monthly"}
                </p>
                <p className="muted mt-1">
                  Next billing date: {nextBillingDate ? new Date(nextBillingDate).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>
          ) : null}

          {tab === "history" ? (
            <div className="dash-card">
              <div className="dash-card-body">
                <h3>Subscription History</h3>
                {history.length ? (
                  history.map((item, i) => (
                    <p key={`${item.reference || item.createdAt}-${i}`}>
                      {item.plan} - {item.interval} - {formatMoney(item.amount)} - {item.status} -{" "}
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  ))
                ) : (
                  <p className="muted">No records yet.</p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
