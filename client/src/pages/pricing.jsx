import "./CSS/pricing.css";

export default function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "₦0/month",
      features: ["2 Events per month", "Basic Support", "Community Access"],
    },
    {
      name: "Pro",
      price: "₦4,999/month",
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
    <div className="page-container">
      <h1 className="page-title">Pricing</h1>
      <div className="pricing-grid">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`pricing-card ${plan.highlight ? "highlight" : ""}`}
          >
            <h2>{plan.name}</h2>
            <p>{plan.price}</p>
            <ul>
              {plan.features.map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
            <button>Choose Plan</button>
          </div>
        ))}
      </div>
    </div>
  );
}
