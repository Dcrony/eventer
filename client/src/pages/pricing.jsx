import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight, Zap, ShieldCheck, Building2, History, CreditCard, LayoutGrid } from "lucide-react";
import { getBillingHistory, getCurrentPlan, initializeBilling } from "../services/api/billing";
import { useToast } from "../components/ui/toast";
import Badge from "../components/ui/badge";
import "./CSS/landing.css";

const formatMoney = (amount) => `₦${Number(amount || 0).toLocaleString()}`;

export default function Pricing() {
  const toast = useToast();
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [currentPlan, setCurrentPlan] = useState("free");
  const [billingState, setBillingState] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("plans");
  const [upgradingPlan, setUpgradingPlan] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [planRes, historyRes] = await Promise.all([
          getCurrentPlan(),
          getBillingHistory(),
        ]);
        setCurrentPlan(String(planRes.data.plan || "free").toLowerCase());
        setBillingState(planRes.data);
        setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      } catch (err) {
        // Silent catch for unauthenticated landing page view
      }
    };
    loadData();
  }, []);

  const plans = [
    {
      id: "free",
      name: "Free",
      icon: <Zap size={20} />,
      description: "For small local meetups and social gatherings.",
      price: { monthly: 0, yearly: 0 },
      features: [
        "Up to 2 events per month",
        "Standard visibility",
        "Core ticketing & QR check-in",
        "Community support",
      ],
      cta: "Get Started",
      highlight: false,
    },
    {
      id: "pro",
      name: "Pro",
      icon: <ShieldCheck size={20} />,
      description: "For professional organizers who need scale.",
      badge: "Most Popular",
      price: { monthly: 4999, yearly: 49990 },
      features: [
        "Unlimited events",
        "Full analytics dashboard",
        "Featured discovery listings",
        "Live streaming embeds",
        "Priority support",
      ],
      cta: "Upgrade to Pro",
      highlight: true,
    },
    {
      id: "business",
      name: "Business",
      icon: <Building2 size={20} />,
      description: "Custom tools for large-scale production.",
      price: { monthly: "Custom", yearly: "Custom" },
      features: [
        "Everything in Pro",
        "White-label branding",
        "Dedicated success manager",
        "Custom contracts",
        "Advanced API access",
      ],
      cta: "Contact Sales",
      highlight: false,
    },
  ];

  const handleUpgrade = async (planId) => {
    if (planId === "business") {
      toast.info("Please contact our sales team for Business onboarding.");
      return;
    }

    try {
      setUpgradingPlan(planId);
      const response = await initializeBilling({ plan: planId, interval: billingCycle });
      
      if (response.data?.authorization_url) {
        window.location.href = response.data.authorization_url;
      } else {
        toast.error("Unable to generate payment link.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Please login to upgrade your plan.");
    } finally {
      setUpgradingPlan("");
    }
  };

  return (
    <div className="pricing-page-container">
      {/* Visual Background Elements */}
      <div className="pricing-bg-gradient" />
      
      <div className="pricing-content">
        <header className="pricing-header">
          <div className="badge-wrapper">
            <Badge className="pricing-top-tag">Flexible Pricing</Badge>
          </div>
          <h1 className="pricing-title">
            Simple plans for <span className="text-gradient">every creator.</span>
          </h1>
          <p className="pricing-subtitle">
            No hidden fees. Switch plans or cancel your subscription at any time.
          </p>

          {/* SaaS Billing Toggle */}
          <div className="billing-switcher">
            <span className={billingCycle === "monthly" ? "active" : ""}>Monthly</span>
            <button 
              className={`toggle-pill ${billingCycle}`}
              onClick={() => setBillingCycle(b => b === "monthly" ? "yearly" : "monthly")}
            >
              <div className="toggle-knob" />
            </button>
            <span className={billingCycle === "yearly" ? "active" : ""}>
              Yearly <span className="discount-tag">Save 17%</span>
            </span>
          </div>

          {/* Sub-Navigation Tabs */}
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
        </header>

        {activeTab === "plans" && (
          <div className="pricing-grid">
            {plans.map((plan) => {
              const isCurrent = currentPlan === plan.id;
              const isProcessing = upgradingPlan === plan.id;
              const priceValue = billingCycle === "yearly" ? plan.price.yearly : plan.price.monthly;

              return (
                <div key={plan.id} className={`pricing-card ${plan.highlight ? "featured" : ""}`}>
                  {plan.badge && <div className="card-popular-tag">{plan.badge}</div>}
                  
                  <div className="card-top">
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
                  </div>

                  <ul className="card-features">
                    {plan.features.map((feature, i) => (
                      <li key={i}><CheckCircle2 size={18} /> {feature}</li>
                    ))}
                  </ul>

                  <button
                    className={`card-button ${plan.highlight ? "btn-primary" : "btn-secondary"}`}
                    disabled={isCurrent || isProcessing}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {isProcessing ? "Processing..." : isCurrent ? "Active Plan" : plan.cta}
                    {!isCurrent && !isProcessing && <ArrowRight size={16} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "billing" && (
          <div className="info-card-container">
            <div className="info-card">
              <h3>Subscription Details</h3>
              <div className="info-row">
                <span>Current Plan</span>
                <strong>{billingState?.billing?.plan || "Free"}</strong>
              </div>
              <div className="info-row">
                <span>Status</span>
                <Badge variant={billingState?.subscription?.status === "active" ? "success" : "neutral"}>
                  {billingState?.subscription?.status || "Inactive"}
                </Badge>
              </div>
              <div className="info-row">
                <span>Next Invoice</span>
                <strong>{billingState?.subscription?.nextBillingDate ? new Date(billingState.subscription.nextBillingDate).toLocaleDateString() : "N/A"}</strong>
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="info-card-container">
            <div className="info-card">
              <h3>Payment History</h3>
              {history.length > 0 ? (
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
                    {history.map((item, i) => (
                      <tr key={i}>
                        <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                        <td>{item.plan} ({item.interval})</td>
                        <td>{formatMoney(item.amount)}</td>
                        <td><span className={`status-dot ${item.status}`}>{item.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="empty-text">No transaction history found.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}