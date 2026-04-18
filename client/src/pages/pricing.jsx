import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import "./CSS/landing.css";

export default function Pricing() {
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
          </div>

          <div className="pricing-card-grid">
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
                >
                  {plan.cta?.label || `Choose ${plan.name}`}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
