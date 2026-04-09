import React from "react";
import { CheckCircle2 } from "lucide-react";
import "./CSS/landing.css";

export default function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "₦0",
      period: "/month",
      features: [
        "Up to 2 published events per month",
        "Core ticketing with QR code check-in",
        "Standard event landing page",
        "Email notifications for attendees",
        "Community support & help center",
        "Secure payments via Paystack",
        "Mobile-friendly organizer experience",
      ],
      highlight: false,
    },
    {
      name: "Pro",
      price: "₦4,999",
      period: "/month",
      badge: "Most Popular",
      features: [
        "Unlimited events & ticket types",
        "Full analytics & revenue dashboard",
        "Priority email & chat support",
        "Live streaming embeds (YouTube, RTMP)",
        "Advanced attendee insights & exports",
        "Custom branding on event pages",
        "Discount codes & promotional tools",
        "Lower platform fees on ticket sales",
      ],
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      features: [
        "Dedicated account manager",
        "SLA, onboarding & staff training",
        "Custom contracts & invoicing",
        "White-label & API access",
        "SSO / advanced security options",
        "Volume pricing & multi-org billing",
        "Custom integrations & webhooks",
        "Strategic review & roadmap input",
      ],
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
                <button
                  type="button"
                  className={`btn ${plan.highlight ? "btn-primary" : "btn-outline"} pricing-card-cta`}
                >
                  Choose {plan.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
