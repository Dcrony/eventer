import React from "react";
import LandingNavbar from "../components/LandingNavbar";
import Footer from "../components/Footer";
import { CheckCircle2 } from "lucide-react";
import "./CSS/landing.css";

export default function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "₦0",
      period: "/month",
      features: ["2 Events per month", "Basic Support", "Community Access"],
      highlight: false,
    },
    {
      name: "Pro",
      price: "₦4,999",
      period: "/month",
      features: ["Unlimited Events", "Analytics Dashboard", "Priority Support"],
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      features: ["Dedicated Manager", "Custom Branding", "Full Integrations"],
    },
  ];

  return (
    <div className="landing-page">
      <div className="grid-background"></div>
      <LandingNavbar />

      <div style={{ paddingTop: "120px", paddingBottom: "80px", maxWidth: "1200px", margin: "0 auto", paddingLeft: "20px", paddingRight: "20px", position: "relative", zIndex: 1 }}>
        <div className="section-header animate-in">
          <h1 className="section-title">
            <span className="title-box title-box-border">Simple</span>
            <span className="title-box title-box-filled">Pricing</span>
          </h1>
          <p className="section-subtitle">
            Choose the plan that fits your needs. No hidden fees.
          </p>
        </div>

        <div className="features-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`feature-card animate-in ${plan.highlight ? 'highlight-plan' : ''}`}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                border: plan.highlight ? "2px solid #ec4899" : undefined,
                transform: plan.highlight ? "scale(1.02)" : undefined,
                boxShadow: plan.highlight ? "0 12px 32px rgba(236, 72, 153, 0.2)" : undefined
              }}
            >
              <div>
                <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{plan.name}</h3>
                <div style={{ fontSize: "2.5rem", fontWeight: "800", marginBottom: "1.5rem", color: plan.highlight ? "#ec4899" : "inherit" }}>
                  {plan.price}<span style={{ fontSize: "1rem", color: "#666", fontWeight: "500" }}>{plan.period}</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2rem 0" }}>
                  {plan.features.map((feature, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", color: "#4b5563" }}>
                      <CheckCircle2 size={18} color="#ec4899" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <button className={`btn ${plan.highlight ? 'btn-primary' : 'btn-outline'}`} style={{ width: "100%", justifyContent: "center" }}>
                Choose {plan.name}
              </button>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
