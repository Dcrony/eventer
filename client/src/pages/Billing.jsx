import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getBillingHistory, getCurrentPlan, initializeBilling, verifyBilling } from "../services/api/billing";
import { useToast } from "../components/ui/toast";

const formatMoney = (amount) => `₦${Number(amount || 0).toLocaleString()}`;

export default function Billing() {
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const [billing, setBilling] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [interval, setInterval] = useState("monthly");

  const loadBilling = async () => {
    try {
      setLoading(true);
      const [planRes, historyRes] = await Promise.all([getCurrentPlan(), getBillingHistory()]);
      setBilling(planRes.data);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      if (planRes.data?.subscription?.interval) {
        setInterval(planRes.data.subscription.interval);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load billing details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBilling();
  }, [toast]);

  useEffect(() => {
    const status = searchParams.get("status");
    const reference = searchParams.get("reference");

    if (status === "success" && reference) {
      verifyBilling(reference)
        .then(() => {
          toast.success("Subscription payment verified successfully");
          loadBilling();
        })
        .catch((error) => {
          toast.error(error.response?.data?.message || "Failed to verify payment");
        });
    } else if (status === "failed") {
      toast.error("Subscription payment failed");
    }
  }, [searchParams, toast]);

  const currentPlan = billing?.plan || "free";
  const nextBillingDate = billing?.subscription?.nextBillingDate || billing?.billing?.nextBillingDate;
  const paymentStatus = billing?.subscription?.status || billing?.billing?.billingStatus || "inactive";

  const latestHistory = useMemo(() => history.slice(0, 10), [history]);

  const handleUpgrade = async () => {
    try {
      setUpgrading(true);
      const response = await initializeBilling({ plan: "pro", interval });
      const authUrl = response.data?.authorization_url;
      if (!authUrl) {
        toast.error("No payment link returned");
        return;
      }
      window.location.href = authUrl;
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not start billing upgrade");
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="dash-card">
            <div className="dash-card-body">
              <p className="muted">Loading billing details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dash-card">
          <div className="dash-card-body">
            <h2>Billing</h2>
            <p className="muted">Current plan: {billing?.billing?.plan || "Free"}</p>
            <p className="muted">Payment status: {paymentStatus}</p>
            <p className="muted">
              Next billing date: {nextBillingDate ? new Date(nextBillingDate).toLocaleDateString() : "N/A"}
            </p>
            <div className="mt-3">
              <label>
                Billing cycle
                <select value={interval} onChange={(event) => setInterval(event.target.value)} className="input-field">
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </label>
            </div>
            <button
              type="button"
              className="btn btn-primary mt-3"
              onClick={handleUpgrade}
              disabled={upgrading || currentPlan === "business" || (currentPlan === "pro" && paymentStatus === "active")}
            >
              {upgrading ? "Redirecting..." : (currentPlan === "pro" && paymentStatus === "active") ? "Active Plan" : currentPlan === "pro" ? "Renew Pro" : "Upgrade to Pro"}
            </button>
          </div>
        </div>

        <div className="dash-card mt-4">
          <div className="dash-card-body">
            <h3>Billing History</h3>
            {latestHistory.length ? (
              <ul className="mt-2">
                {latestHistory.map((item) => (
                  <li key={item.reference}>
                    {item.plan} - {item.interval} - {formatMoney(item.amount)} - {item.status} (
                    {new Date(item.createdAt).toLocaleDateString()})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted mt-2">No billing records yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
