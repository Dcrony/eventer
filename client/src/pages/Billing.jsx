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
  const paymentStatus = (billing?.subscription?.status || billing?.billing?.billingStatus || "inactive").toLowerCase();

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

  const handleDownloadInvoice = (reference) => {
    // This is a placeholder for your actual invoice download logic
    toast.info(`Fetching invoice for #${reference}...`);
    // Example: window.open(`/api/billing/invoice/${reference}`, '_blank');
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="dash-card">
            <div className="dash-card-body">
              <p className="muted">Loading your secure billing data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* Active Subscription Overview */}
        <div className="dash-card">
          <div className="dash-card-body">
            <h2>Billing</h2>
            <div className="plan-overview">
              <div className="plan-info">
                <p className="muted">Current plan</p>
                <p className="plan-name">{billing?.billing?.plan || "Free Account"}</p>
              </div>
              <div className="plan-info">
                <p className="muted">Status</p>
                <span className={`status-badge ${paymentStatus}`}>{paymentStatus}</span>
              </div>
            </div>

            <p className="muted mt-3">
              {paymentStatus === "active" ? (
                <>Your plan will automatically renew on <strong>{new Date(nextBillingDate).toLocaleDateString()}</strong>.</>
              ) : (
                <>Next billing date: <strong>{nextBillingDate ? new Date(nextBillingDate).toLocaleDateString() : "No active billing"}</strong></>
              )}
            </p>

            <div className="mt-3 billing-cycle-box">
              <label>
                Billing cycle
                <select 
                  value={interval} 
                  onChange={(event) => setInterval(event.target.value)} 
                  className="input-field"
                  disabled={paymentStatus === "active" && currentPlan === "pro"}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly (Save 20%)</option>
                </select>
              </label>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleUpgrade}
              disabled={upgrading || currentPlan === "business" || (currentPlan === "pro" && paymentStatus === "active")}
            >
              {upgrading ? "Processing..." : 
               (currentPlan === "pro" && paymentStatus === "active") ? "Current Plan" : 
               currentPlan === "pro" ? "Renew Professional" : "Upgrade to Pro"}
            </button>
          </div>
        </div>

        {/* Transaction History */}
        <div className="dash-card mt-4">
          <div className="dash-card-body p-0">
            <h3 className="p-3">Invoice History</h3>
            <div className="table-responsive">
              <table className="billing-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Reference</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {latestHistory.length ? (
                    latestHistory.map((item) => (
                      <tr key={item.reference}>
                        <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                        <td className="small muted">#{item.reference?.slice(-8)}</td>
                        <td className="capitalize">{item.plan} ({item.interval})</td>
                        <td className="fw-bold">{formatMoney(item.amount)}</td>
                        <td>
                          <span className={`status-badge ${item.status?.toLowerCase()}`}>
                            {item.status}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn-text" 
                            onClick={() => handleDownloadInvoice(item.reference)}
                            title="Download PDF"
                          >
                            PDF
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="muted text-center py-4">
                        No transactions found in your history.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}