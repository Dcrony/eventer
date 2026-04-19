import { useEffect, useState } from "react";
import { getBillingHistory, getCurrentPlan } from "../services/api/billing";

export default function Billing() {
  const [plan, setPlan] = useState("free");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [planRes, historyRes] = await Promise.all([getCurrentPlan(), getBillingHistory()]);
      setPlan(planRes.data.plan || "free");
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
    };
    load().catch(() => null);
  }, []);

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dash-card">
          <div className="dash-card-body">
            <h2>Billing</h2>
            <p className="muted">Current plan: {plan}</p>
          </div>
        </div>
        <div className="dash-card mt-4">
          <div className="dash-card-body">
            <h3>Subscription History</h3>
            {history.length ? (
              <ul className="mt-2">
                {history.map((item, index) => (
                  <li key={`${item.changedAt}-${index}`}>
                    {item.plan} - {item.interval} - {item.amount} ({new Date(item.changedAt).toLocaleDateString()})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted mt-2">No billing records yet.</p>
            )}
            <p className="muted mt-3">Invoices are available as mock records in this release.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
