import {
  Check,
  Sparkles,
  Zap,
  ShieldCheck,
  Building2,
  ArrowRight,
  CreditCard,
  History,
  LayoutGrid,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  getCurrentPlan,
  getBillingHistory,
  initializeBilling,
} from "../services/api/billing";
import { useToast } from "../components/ui/toast";
import { useAuth } from "../context/AuthContext";
import {
  getTrialDaysRemaining,
  isTrialActive,
  normalizePlan,
} from "../utils/planAccess";

const formatMoney = (amount) => `₦${Number(amount || 0).toLocaleString()}`;

const STATUS_STYLES = {
  active:   "bg-green-100 text-green-700 border-green-200",
  success:  "bg-green-100 text-green-700 border-green-200",
  inactive: "bg-gray-100 text-gray-500 border-gray-200",
  failed:   "bg-red-100 text-red-700 border-red-200",
  pending:  "bg-amber-100 text-amber-700 border-amber-200",
};

const STATUS_ICONS = {
  active:   <CheckCircle2 size={12} />,
  success:  <CheckCircle2 size={12} />,
  failed:   <AlertCircle  size={12} />,
  pending:  <Clock        size={12} />,
};

function StatusBadge({ status }) {
  const s = (status || "inactive").toLowerCase();
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_STYLES[s] ?? STATUS_STYLES.inactive}`}>
      {STATUS_ICONS[s]}
      {status || "inactive"}
    </span>
  );
}

export default function Pricing() {
  const toast = useToast();
  const { user, isAuthenticated } = useAuth();

  const [billingCycle, setBillingCycle]   = useState("monthly");
  const [currentPlan, setCurrentPlan]     = useState("free");
  const [billingState, setBillingState]   = useState(null);
  const [history, setHistory]             = useState([]);
  const [activeTab, setActiveTab]         = useState("plans");
  const [upgradingPlan, setUpgradingPlan] = useState("");

  const trialDaysRemaining = getTrialDaysRemaining(user);
  const trialActive        = isTrialActive(user);

  const monthlyPro  = 4999;
  const yearlyPro   = 49990;

  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated) return;
      try {
        const [planRes, historyRes] = await Promise.all([
          getCurrentPlan(),
          getBillingHistory(),
        ]);
        setCurrentPlan(normalizePlan(planRes.data?.plan || user?.plan));
        setBillingState(planRes.data);
        setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      } catch {
        setCurrentPlan(normalizePlan(user?.plan));
      }
    };
    loadData();
  }, [isAuthenticated, user?.plan]);

  const plans = [
    {
      id: "free",
      name: "Free",
      icon: <Zap size={22} />,
      description: "For early organizers validating demand and running lean events.",
      price: { monthly: 0, yearly: 0 },
      features: [
        "Create & publish events",
        "Sell tickets & email notifications",
        "Basic dashboard",
        "Standard visibility",
      ],
      cta: "Start Free",
      highlight: false,
    },
    {
      id: "pro",
      name: "Pro",
      icon: <ShieldCheck size={22} />,
      description: "For production-ready teams that want premium growth tools.",
      badge: "Most Popular",
      price: { monthly: monthlyPro, yearly: yearlyPro },
      features: [
        "TickiAI (event generation + concierge)",
        "Advanced analytics & revenue insights",
        "Live streaming & private events",
        "Team roles & custom branding",
        "Priority payouts",
      ],
      cta: "Upgrade to Pro",
      highlight: true,
    },
    {
      id: "business",
      name: "Business",
      icon: <Building2 size={22} />,
      description: "Custom tools for large-scale productions and enterprises.",
      price: { monthly: "Custom", yearly: "Custom" },
      features: [
        "White-label branding",
        "Dedicated success manager",
        "Advanced API access",
        "Custom contracts & SLAs",
        "Everything in Pro",
      ],
      cta: "Contact Sales",
      highlight: false,
    },
  ];

  const handleUpgrade = async (planId) => {
    if (planId === "business") {
      toast.info("Contact support@tickispot.com for the Business plan.");
      return;
    }
    if (!isAuthenticated) { window.location.href = "/register"; return; }
    try {
      setUpgradingPlan(planId);
      const response = await initializeBilling({ plan: planId, interval: billingCycle });
      if (response.data?.authorization_url) {
        window.location.href = response.data.authorization_url;
      } else {
        toast.error("Could not start upgrade flow.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Upgrade failed");
    } finally {
      setUpgradingPlan("");
    }
  };

  const TABS = [
    { id: "plans",   label: "Plans",   icon: <LayoutGrid size={15} /> },
    { id: "billing", label: "Billing", icon: <CreditCard  size={15} /> },
    { id: "history", label: "History", icon: <History     size={15} /> },
  ];

  const COMPARISON = [
    ["Create events & sell tickets", true,  true,  true],
    ["Basic dashboard",              true,  true,  true],
    ["TickiAI",                      false, true,  true],
    ["Advanced analytics",           false, true,  true],
    ["Live streaming",               false, true,  true],
    ["Private events",               false, true,  true],
    ["Team members & roles",         false, true,  true],
    ["Custom branding",              false, true,  true],
    ["Priority payouts",             false, true,  true],
    ["White-label & API",            false, false, true],
    ["Dedicated manager",            false, false, true],
  ];

  return (
    <div className="min-h-screen bg-white relative lg:pl-[var(--sidebar-width,0px)] px-4 sm:px-8 pt-20 pb-16 transition-all duration-300">
      {/* Radial background gradient */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[600px] z-0"
        style={{ background: "radial-gradient(circle at 50% -10%, #fdf2f8 0%, rgba(255,255,255,0) 65%)" }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Sparkles size={15} />
            14-day free trial on all Pro features
          </span>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
            Simple, powerful pricing<br className="hidden sm:block" /> for event organizers
          </h1>

          <p className="text-lg text-gray-500 mx-auto">
            Start free. Scale with confidence. Everything you need to grow your events.
          </p>

          {trialActive && (
            <div className="inline-block mt-5 bg-green-50 text-green-700 px-5 py-2.5 rounded-xl text-sm font-semibold border border-green-200">
              Your trial is active — {trialDaysRemaining} day{trialDaysRemaining !== 1 ? "s" : ""} remaining
            </div>
          )}
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <span className={`text-sm font-semibold ${billingCycle === "monthly" ? "text-gray-900" : "text-gray-400"}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(c => c === "monthly" ? "yearly" : "monthly")}
            className="relative w-14 h-7 rounded-full bg-gray-900 p-1 transition-colors"
            aria-label="Toggle billing cycle"
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${billingCycle === "yearly" ? "translate-x-7" : "translate-x-0"}`} />
          </button>
          <span className={`text-sm font-semibold flex items-center gap-1.5 ${billingCycle === "yearly" ? "text-gray-900" : "text-gray-400"}`}>
            Yearly
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
              Save ~17%
            </span>
          </span>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center bg-gray-100 p-1 rounded-xl gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Plans Tab */}
        {activeTab === "plans" && (
          <>
            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {plans.map((plan) => {
                const isCurrent    = currentPlan === plan.id;
                const isProcessing = upgradingPlan === plan.id;
                const priceValue   = billingCycle === "yearly" ? plan.price.yearly : plan.price.monthly;

                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-2 ${
                      plan.highlight
                        ? "border-pink-400 shadow-xl shadow-pink-100 bg-gradient-to-b from-pink-50/40 to-white"
                        : "border-gray-200 bg-white hover:shadow-lg hover:shadow-gray-100"
                    }`}
                  >
                    {/* Popular Badge */}
                    {plan.badge && (
                      <div className="absolute -top-3 right-5 bg-pink-500 text-white text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow-md shadow-pink-200">
                        {plan.badge}
                      </div>
                    )}

                    {/* Icon */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${plan.highlight ? "bg-pink-100 text-pink-600" : "bg-gray-100 text-gray-600"}`}>
                      {plan.icon}
                    </div>

                    <h3 className="text-xl font-extrabold text-gray-900 mb-1">{plan.name}</h3>
                    <p className="text-sm text-gray-500 mb-6 leading-relaxed">{plan.description}</p>

                    {/* Price */}
                    <div className="flex items-baseline gap-1 mb-1">
                      {typeof priceValue === "number" ? (
                        <>
                          <span className="text-2xl font-semibold text-gray-700">₦</span>
                          <span className="text-5xl font-extrabold text-gray-900 tracking-tight">
                            {priceValue.toLocaleString()}
                          </span>
                          <span className="text-gray-400 text-base ml-1">
                            /{billingCycle === "monthly" ? "mo" : "yr"}
                          </span>
                        </>
                      ) : (
                        <span className="text-4xl font-extrabold text-gray-900">Custom</span>
                      )}
                    </div>

                    {billingCycle === "yearly" && plan.id === "pro" && (
                      <p className="text-green-600 text-sm font-semibold mb-5">Save ~17% yearly</p>
                    )}

                    {/* Features */}
                    <ul className="space-y-3 mb-8 flex-1 mt-4">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                          <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={isCurrent || isProcessing}
                      className={`w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-bold transition-all duration-200 ${
                        plan.highlight
                          ? "bg-pink-500 text-white hover:bg-pink-600 shadow-md shadow-pink-200 hover:-translate-y-0.5 hover:shadow-lg"
                          : "bg-gray-900 text-white hover:bg-black"
                      } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing…
                        </>
                      ) : isCurrent ? (
                        <>
                          <CheckCircle2 size={15} />
                          Current Plan
                        </>
                      ) : (
                        <>
                          {plan.cta}
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Comparison Table */}
            <div className="mb-8">
              <h3 className="text-xl font-extrabold text-gray-900 text-center mb-6 tracking-tight">
                Feature comparison
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
                <table className="w-full text-sm bg-white">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-left font-bold text-gray-500 text-xs uppercase tracking-wider">Feature</th>
                      {["Free", "Pro", "Business"].map((h) => (
                        <th key={h} className="px-6 py-4 text-center font-bold text-xs uppercase tracking-wider text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {COMPARISON.map(([feature, freeV, proV, busV]) => (
                      <tr key={feature} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-6 py-3.5 text-gray-700 font-medium">{feature}</td>
                        {[freeV, proV, busV].map((val, i) => (
                          <td key={i} className="px-6 py-3.5 text-center">
                            {val ? (
                              <CheckCircle2 size={17} className="text-green-500 mx-auto" />
                            ) : (
                              <span className="block w-4 h-0.5 bg-gray-200 mx-auto rounded" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Billing Tab */}
        {activeTab === "billing" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-extrabold text-gray-900 tracking-tight">Subscription details</h3>
              </div>
              {billingState ? (
                <div className="divide-y divide-gray-100">
                  {[
                    ["Current plan", (currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1))],
                    ["Status",       <StatusBadge key="status" status={billingState.status} />],
                    ["Next billing", billingState.nextBillingDate
                      ? new Date(billingState.nextBillingDate).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })
                      : "N/A"],
                    ...(billingState.currentAmount
                      ? [["Current amount", formatMoney(billingState.currentAmount)]]
                      : []),
                  ].map(([label, value]) => (
                    <div key={String(label)} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                      <span className="text-sm font-semibold text-gray-500">{label}</span>
                      <span className="text-sm font-bold text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-12 text-center text-sm text-gray-400">
                  No active subscription.
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-extrabold text-gray-900 tracking-tight">Payment history</h3>
                {history.length > 0 && (
                  <span className="text-xs text-gray-400 font-medium">{history.length} record{history.length !== 1 ? "s" : ""}</span>
                )}
              </div>

              {history.length > 0 ? (
                <>
                  {/* Desktop Table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {["Date", "Plan", "Amount", "Status"].map((h) => (
                            <th key={h} className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {history.map((entry, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                            <td className="px-6 py-3.5 text-gray-600 whitespace-nowrap">
                              {new Date(entry.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                            </td>
                            <td className="px-6 py-3.5 capitalize text-gray-700 font-medium">{entry.plan || "N/A"}</td>
                            <td className="px-6 py-3.5 font-extrabold text-gray-900">{formatMoney(entry.amount)}</td>
                            <td className="px-6 py-3.5"><StatusBadge status={entry.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="sm:hidden divide-y divide-gray-100">
                    {history.map((entry, idx) => (
                      <div key={idx} className="flex flex-col p-4 gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-gray-900">{formatMoney(entry.amount)}</span>
                          <StatusBadge status={entry.status} />
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400 capitalize">
                            {entry.plan || "N/A"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="px-6 py-12 text-center text-sm text-gray-400">
                  No payment history yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}