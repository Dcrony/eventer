import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getBillingHistory,
  getCurrentPlan,
  initializeBilling,
  verifyBilling,
} from "../services/api/billing";
import { useToast } from "../components/ui/toast";
import {
  CreditCard,
  Download,
  Zap,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";

const formatMoney = (amount) => `₦${Number(amount || 0).toLocaleString()}`;

const STATUS_STYLES = {
  active:     "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  inactive:   "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  cancelled:  "bg-red-50 text-red-700 ring-1 ring-red-200",
  past_due:   "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  success:    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  failed:     "bg-red-50 text-red-700 ring-1 ring-red-200",
  pending:    "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
};

const STATUS_ICONS = {
  active:  <CheckCircle2 size={12} />,
  success: <CheckCircle2 size={12} />,
  failed:  <AlertCircle  size={12} />,
  pending: <Clock        size={12} />,
};

function StatusBadge({ status }) {
  const s = status?.toLowerCase() || "inactive";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-700 ${STATUS_STYLES[s] || STATUS_STYLES.inactive}`}>
      {STATUS_ICONS[s]}
      {status}
    </span>
  );
}

export default function Billing() {
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const [billing, setBilling]   = useState(null);
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [billingInterval, setBillingInterval] = useState("monthly");

  const loadBilling = async () => {
    try {
      setLoading(true);
      const [planRes, historyRes] = await Promise.all([
        getCurrentPlan(),
        getBillingHistory(),
      ]);
      setBilling(planRes.data);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      if (planRes.data?.subscription?.interval) {
        setBillingInterval(planRes.data.subscription.interval);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load billing details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBilling(); }, []);

  useEffect(() => {
    const status    = searchParams.get("status");
    const reference = searchParams.get("reference");
    if ((status === "success" || status === "pending") && reference) {
      verifyBilling(reference)
        .then(() => { toast.success("Subscription verified"); loadBilling(); })
        .catch((e) => toast.error(e.response?.data?.message || "Failed to verify payment"));
    } else if (status === "failed") {
      toast.error("Subscription payment failed");
    }
  }, [searchParams]);

  const currentPlan     = billing?.plan || "free";
  const nextBillingDate = billing?.subscription?.nextBillingDate || billing?.billing?.nextBillingDate;
  const paymentStatus   = (billing?.subscription?.status || billing?.billing?.billingStatus || "inactive").toLowerCase();
  const latestHistory   = useMemo(() => history.slice(0, 10), [history]);

  const handleUpgrade = async () => {
    try {
      setUpgrading(true);
      const response = await initializeBilling({ plan: "pro", interval: billingInterval });
      const authUrl  = response.data?.authorization_url;
      if (!authUrl) { toast.error("No payment link returned"); return; }
      window.location.href = authUrl;
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not start upgrade");
    } finally {
      setUpgrading(false);
    }
  };

  const handleDownloadInvoice = (reference) => {
    toast.info(`Fetching invoice for #${reference}...`);
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 flex flex-col items-center gap-4 max-w-xs w-full">
          <div className="w-10 h-10 rounded-full border-[3px] border-pink-200 border-t-pink-500 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading billing…</p>
        </div>
      </div>
    );
  }

  const isCurrentPro = currentPlan === "pro" && paymentStatus === "active";
  const isBusiness   = currentPlan === "business";

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-pink-500 mb-1">
              Account
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Billing
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your plan, billing cycle, and invoices.
            </p>
          </div>
          <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 border border-pink-100 text-pink-500">
            <CreditCard size={22} />
          </div>
        </div>

        {/* ── Plan overview card ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Pink top bar */}
          <div className="h-1 w-full bg-gradient-to-r from-pink-500 to-fuchsia-500" />

          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-6">

              {/* Plan info */}
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-fuchsia-500 text-white shadow-md shadow-pink-200">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                    Current plan
                  </p>
                  <p className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {billing?.billing?.plan || "Free Account"}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <StatusBadge status={paymentStatus} />
                    {nextBillingDate && (
                      <span className="text-xs text-slate-400 font-medium">
                        Renews {new Date(nextBillingDate).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Cycle toggle + upgrade */}
              <div className="flex flex-col gap-3 min-w-[200px]">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Billing cycle
                  </label>
                  <select
                    value={billingInterval}
                    onChange={(e) => setBillingInterval(e.target.value)}
                    disabled={isCurrentPro || isBusiness}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly — save 20%</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleUpgrade}
                  disabled={upgrading || isCurrentPro || isBusiness}
                  className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-pink-500 text-white text-sm font-bold shadow-md shadow-pink-200 transition-all hover:bg-pink-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-pink-200 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md"
                >
                  {upgrading ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      Processing…
                    </>
                  ) : isCurrentPro ? (
                    <>
                      <CheckCircle2 size={15} />
                      Current plan
                    </>
                  ) : currentPlan === "pro" ? (
                    <>
                      <Zap size={15} />
                      Renew Professional
                    </>
                  ) : (
                    <>
                      <Zap size={15} />
                      Upgrade to Pro
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Pro feature bullets */}
            {!isCurrentPro && !isBusiness && (
              <div className="mt-6 pt-5 border-t border-slate-100">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                  What you get with Pro
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Unlimited events",
                    "Live streaming",
                    "Advanced analytics",
                    "Priority support",
                    "Custom branding",
                    "Instant payouts",
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 size={14} className="text-pink-500 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Invoice history ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Invoice history
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Your last {latestHistory.length} transaction{latestHistory.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-400">
              <Download size={16} />
            </div>
          </div>

          {/* Table — desktop */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Date", "Reference", "Plan", "Amount", "Status", ""].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-bold uppercase tracking-widest text-slate-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {latestHistory.length ? (
                  latestHistory.map((item) => (
                    <tr key={item.reference} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3.5 text-slate-600 font-medium whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString("en-NG", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          #{item.reference?.slice(-8)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 capitalize">
                        {item.plan} · {item.interval}
                      </td>
                      <td className="px-6 py-3.5 font-extrabold text-slate-900">
                        {formatMoney(item.amount)}
                      </td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => handleDownloadInvoice(item.reference)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-500 hover:text-pink-700 transition-colors"
                        >
                          <Download size={13} />
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                      No transactions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Cards — mobile */}
          <div className="sm:hidden divide-y divide-slate-100">
            {latestHistory.length ? (
              latestHistory.map((item) => (
                <div key={item.reference} className="flex items-center justify-between p-4 gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {formatMoney(item.amount)}
                      </span>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-xs text-slate-400 capitalize">
                      {item.plan} · {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs font-mono text-slate-300 mt-0.5">
                      #{item.reference?.slice(-8)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadInvoice(item.reference)}
                    className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50 text-pink-500 hover:bg-pink-100 transition-colors"
                  >
                    <Download size={15} />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-slate-400">
                No transactions yet.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}