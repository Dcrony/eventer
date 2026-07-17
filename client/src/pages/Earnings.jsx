import { createElement, useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Banknote,
  Info,
  Receipt,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  CircleDollarSign,
  CreditCard,
  ChevronRight,
  X,
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { getEventImageUrl } from "../utils/eventHelpers";
import { requestEarlyPayout } from "../services/api/payouts";

// ── Shared formatter ──────────────────────────────────────────────────────────
const fmt = (n) => {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "0";
  return new Intl.NumberFormat("en-NG").format(Number(n));
};

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, hint, icon, accent = false, delta }) {
  return (
    <div
      className={`relative flex flex-col gap-3 rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${accent
          ? "border-pink-200 bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/20"
          : "border-gray-200 bg-white shadow-sm"
        }`}
    >
      <div className="flex items-start justify-between">
        <span
          className={`text-[0.65rem] font-black uppercase tracking-widest ${accent ? "text-pink-100" : "text-gray-400"
            }`}
        >
          {label}
        </span>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${accent ? "bg-white/20" : "bg-gray-100"
            }`}
        >
          {icon ? createElement(icon, { size: 15, className: accent ? "text-white" : "text-gray-500" }) : null}
        </div>
      </div>
      <div>
        <p
          className={`text-2xl font-black tracking-tight tabular-nums ${accent ? "text-white" : "text-gray-900"
            }`}
        >
          {value}
        </p>
        {hint && (
          <p
            className={`mt-1 text-xs leading-relaxed ${accent ? "text-pink-100" : "text-gray-400"
              }`}
          >
            {hint}
          </p>
        )}
      </div>
      {delta != null && (
        <div
          className={`inline-flex items-center gap-1 text-[0.65rem] font-bold ${accent ? "text-pink-100" : delta >= 0 ? "text-emerald-600" : "text-red-500"
            }`}
        >
          <TrendingUp size={11} />
          {delta >= 0 ? "+" : ""}
          {delta}% vs last month
        </div>
      )}
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-5">
      <h2 className="text-base font-black text-gray-900">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ onClose, title, subtitle, children }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-gray-200 bg-white p-7 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <X size={15} />
        </button>
        <div className="mb-5">
          <h3 className="text-lg font-black text-gray-900">{title}</h3>
          {subtitle && (
            <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-[0.65rem] font-black uppercase tracking-widest text-gray-400">
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Input / Select styles shared ──────────────────────────────────────────────
const inputCls =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-pink-400 focus:bg-white focus:ring-2 focus:ring-pink-100";

export default function Earnings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [payoutAccount, setPayoutAccount] = useState(null);
  const [banks, setBanks] = useState([]);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showConnectAccountModal, setShowConnectAccountModal] = useState(false);
  const [showEarlyPayoutModal, setShowEarlyPayoutModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [earlyPayoutAmount, setEarlyPayoutAmount] = useState("");
  const [earlyPayoutEventId, setEarlyPayoutEventId] = useState("");
  const [earlyPayoutLoading, setEarlyPayoutLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
    bankCode: "",
  });

  const uniqueBanks = useMemo(() => {
    const seen = new Set();
    return banks.filter((b) => {
      if (seen.has(b.code)) return false;
      seen.add(b.code);
      return true;
    });
  }, [banks]);

  const loadEarnings = () => {
    setLoading(true);
    setError(null);
    API.get("/organizer/earnings")
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Could not load earnings");
        setLoading(false);
      });
  };

  const loadPayoutAccount = () => {
    API.get("/organizer/payout/account")
      .then((res) => setPayoutAccount(res.data))
      .catch((err) => {
        if (err.response?.status === 404) setPayoutAccount(null);
      });
  };

  useEffect(() => {
    loadEarnings();
    loadPayoutAccount();
  }, []);

  useEffect(() => {
    API.get("/banks")
      .then((res) => setBanks(res.data || []))
      .catch(() => { });
  }, []);

  const handleWithdraw = async () => {
    if (!withdrawAmount || Number(withdrawAmount) <= 0)
      return alert("Enter a valid amount");
    try {
      setWithdrawLoading(true);
      await API.post("/organizer/withdraw", { amount: Number(withdrawAmount) });
      alert("Withdrawal request submitted successfully");
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      loadEarnings();
    } catch (err) {
      if (err.response?.data?.code === "PAYOUT_ACCOUNT_REQUIRED") {
        alert("Please connect a payout account first");
        setShowWithdrawModal(false);
        setShowConnectAccountModal(true);
        return;
      }
      alert(err.response?.data?.message || "Withdrawal failed");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleConnectPayoutAccount = async () => {
    if (!bankDetails.bankCode || !bankDetails.accountNumber || !bankDetails.accountName)
      return alert("Please complete all bank details");
    try {
      setConnectLoading(true);
      await API.post("/organizer/payout/connect", bankDetails);
      alert("Payout account connected successfully!");
      setShowConnectAccountModal(false);
      setBankDetails({ bankName: "", accountNumber: "", accountName: "", bankCode: "" });
      loadPayoutAccount();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to connect payout account");
    } finally {
      setConnectLoading(false);
    }
  };

  const handleEarlyPayoutRequest = async () => {
    if (!earlyPayoutEventId || !earlyPayoutAmount || Number(earlyPayoutAmount) <= 0) {
      return alert("Select an event and enter a valid amount");
    }

    try {
      setEarlyPayoutLoading(true);
      await requestEarlyPayout({ eventId: earlyPayoutEventId, amount: Number(earlyPayoutAmount) });
      alert("Early payout request submitted successfully");
      setShowEarlyPayoutModal(false);
      setEarlyPayoutAmount("");
      setEarlyPayoutEventId("");
      loadEarnings();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit early payout request");
    } finally {
      setEarlyPayoutLoading(false);
    }
  };

  const minW = data?.minWithdrawalAmount ?? 1000;
  const platformPct = data?.platformTicketFeePercent ?? 10;
  const organizerLevel = data?.organizerLevel || "NEW";
  const maxEarlyPayoutPercent = data?.organizerPolicy?.allowedEarlyPercent || data?.perEvent?.[0]?.maxEarlyPayoutPercent || 0;
  const availableEarlyPayout = data?.availableEarlyPayout || 0;
  const remainingHeldBalance = data?.remainingHeldBalance || 0;

  return (
    <div className="min-h-screen bg-gray-50 font-geist">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 ">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500">
                  <CircleDollarSign size={14} className="text-white" />
                </div>
                <span className="text-[0.65rem] font-black uppercase tracking-widest text-pink-500">
                  Earnings
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900">
                Revenue & Payouts
              </h1>
              <p className="mt-0.5 text-sm text-gray-400">
                Track ticket revenue and manage withdrawals.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/transactions"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-600 transition-all hover:border-pink-200 hover:text-pink-600"
              >
                <Receipt size={13} /> Transactions
                <ChevronRight size={13} />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gray-900 px-4 text-xs font-semibold text-white transition-all hover:bg-gray-700"
              >
                <Wallet size={13} /> Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Loading skeleton */}
        {loading && (
          <div className="animate-pulse space-y-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-gray-200" />
              ))}
            </div>
            <div className="h-14 rounded-xl bg-gray-200" />
            <div className="h-72 rounded-2xl bg-gray-200" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-red-500" />
            <div className="flex-1">
              <p className="font-bold text-red-800">{error}</p>
              <button
                onClick={loadEarnings}
                className="mt-2 text-sm font-semibold text-red-600 underline hover:text-red-800"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {!loading && !error && data && (
          <div className="space-y-8">
            {/* ── Stat grid ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              <StatCard
                label="Gross ticket sales"
                value={`₦${fmt(data.grossTicketSales)}`}
                hint="Total ticket revenue"
                icon={Receipt}
              />
              <StatCard
                label="Net earnings"
                value={`₦${fmt(data.netAfterSalesCommission)}`}
                hint={`After ${platformPct}% platform fee`}
                icon={TrendingUp}
              />
              <StatCard
                label="Available to withdraw"
                value={`₦${fmt(data.availableBalance)}`}
                hint="Ready for payout"
                icon={Wallet}
                accent
              />
              <StatCard
                label="Held balance"
                value={`₦${fmt(remainingHeldBalance)}`}
                hint="Waiting for automatic release"
                icon={Clock}
              />
              <StatCard
                label="Total withdrawn"
                value={`₦${fmt(data.totalWithdrawn)}`}
                hint="Lifetime completed payouts"
                icon={Banknote}
              />
            </div>

            {/* ── Platform fee notice ─────────────────────────────────────── */}
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
              <Info size={16} className="mt-0.5 flex-shrink-0 text-amber-600" />
              <p className="text-sm leading-relaxed text-amber-800">
                {platformPct > 0 ? (
                  <>
                    <strong>{platformPct}%</strong> of each ticket sale is retained by the
                    platform. Minimum withdrawal:{" "}
                    <strong>₦{fmt(minW)}</strong>.
                  </>
                ) : (
                  <>
                    No platform fee is applied. Minimum withdrawal:{" "}
                    <strong>₦{fmt(minW)}</strong>.
                  </>
                )}
                {data.pendingWithdrawalAmount > 0 && (
                  <>
                    {" "}
                    <strong>₦{fmt(data.pendingWithdrawalAmount)}</strong> in pending
                    requests.
                  </>
                )}
              </p>
            </div>

            {/* ── Payout account row ──────────────────────────────────────── */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                    <Building2 size={18} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400">
                      Payout account
                    </p>
                    {payoutAccount ? (
                      <p className="mt-0.5 text-sm font-bold text-gray-900">
                        {payoutAccount.accountName} ·{" "}
                        <span className="font-medium text-gray-500">
                          {payoutAccount.bankName}
                        </span>{" "}
                        · {payoutAccount.accountNumber}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-sm font-semibold text-red-600">
                        No payout account connected
                      </p>
                    )}
                  </div>
                  {payoutAccount && (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  )}
                </div>
                <div className="flex gap-2">
                  {payoutAccount ? (
                    <button
                      onClick={() => setShowWithdrawModal(true)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-pink-500 px-4 text-xs font-bold text-white shadow-md shadow-pink-500/25 transition-all hover:bg-pink-600 hover:-translate-y-0.5"
                    >
                      <Banknote size={13} /> Withdraw funds
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowConnectAccountModal(true)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border-2 border-gray-900 bg-gray-900 px-4 text-xs font-bold text-white transition-all hover:bg-gray-700"
                    >
                      <CreditCard size={13} /> Connect bank account
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400">Smart payout status</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">Level: {organizerLevel}</p>
                  <p className="text-xs text-gray-500">Early payout availability: {maxEarlyPayoutPercent}% of eligible revenue</p>
                  <p className="text-xs text-gray-500">Available early payout: ₦{fmt(availableEarlyPayout)}</p>
                  {data?.nextAutomaticPayoutAt ? (
                    <p className="text-xs text-gray-500">Next automatic payout: {new Date(data.nextAutomaticPayoutAt).toLocaleString()}</p>
                  ) : (
                    <p className="text-xs text-gray-500">Next automatic payout: pending.</p>
                  )}
              </div>
                <button
                  onClick={() => setShowEarlyPayoutModal(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white transition-all hover:bg-emerald-700"
                >
                  <Banknote size={13} /> Request early payout
                </button>
              </div>
            </div>

            {/* ── Earnings by event ───────────────────────────────────────── */}
            <div>
              <SectionHeader
                title="Earnings by event"
                subtitle="Revenue breakdown per event after platform fees"
              />
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                {data.perEvent.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                      <CircleDollarSign size={22} className="text-gray-400" />
                    </div>
                    <p className="font-bold text-gray-700">No events yet</p>
                    <p className="mt-1 text-sm text-gray-400">
                      Create an event and sell tickets to see your earnings here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/60">
                          <th className="px-5 py-3.5 text-left text-[0.6rem] font-black uppercase tracking-widest text-gray-400">
                            Event
                          </th>
                          <th className="px-5 py-3.5 text-left text-[0.6rem] font-black uppercase tracking-widest text-gray-400">
                            Tickets
                          </th>
                          <th className="px-5 py-3.5 text-right text-[0.6rem] font-black uppercase tracking-widest text-gray-400">
                            Net earnings
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {data.perEvent.map((row) => (
                          <tr
                            key={String(row.eventId)}
                            className="transition-colors hover:bg-gray-50/60"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                {getEventImageUrl({ image: row.image }) ? (
                                  <img
                                    src={getEventImageUrl({ image: row.image })}
                                    alt=""
                                    className="h-10 w-10 flex-shrink-0 rounded-xl border border-gray-200 object-cover"
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 text-[0.55rem] font-black text-pink-500">
                                    EVENT
                                  </div>
                                )}
                                <span
                                  className="max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold text-gray-900"
                                  title={row.title}
                                >
                                  {row.title}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm font-medium text-gray-600">
                              {fmt(row.ticketsSold)}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className="text-sm font-black text-gray-900">
                                ₦{fmt(row.netEarnings)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t-2 border-gray-200">
                        <tr>
                          <td className="px-5 py-4 text-xs font-black uppercase tracking-widest text-gray-400">
                            Total
                          </td>
                          <td className="px-5 py-4 text-sm font-bold text-gray-700">
                            {fmt(
                              data.perEvent.reduce(
                                (s, r) => s + Number(r.ticketsSold || 0),
                                0
                              )
                            )}
                          </td>
                          <td className="px-5 py-4 text-right text-sm font-black text-pink-500">
                            ₦{fmt(data.netAfterSalesCommission)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Withdraw modal ───────────────────────────────────────────────── */}
      {showWithdrawModal && data && payoutAccount && (
        <Modal
          onClose={() => setShowWithdrawModal(false)}
          title="Request a withdrawal"
          subtitle={`Available balance: ₦${fmt(data.availableBalance)} · Minimum: ₦${fmt(minW)}`}
        >
          <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400">
              Payout to
            </p>
            <p className="mt-1 text-sm font-bold text-gray-900">
              {payoutAccount.accountName}
            </p>
            <p className="text-xs text-gray-500">
              {payoutAccount.bankName} · {payoutAccount.accountNumber}
            </p>
          </div>
          <Field label="Amount (₦)">
            <input
              className={inputCls}
              type="number"
              placeholder={`Min ₦${fmt(minW)}`}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
            />
          </Field>
          <button
            onClick={handleWithdraw}
            disabled={withdrawLoading}
            className="mt-1 w-full rounded-xl bg-pink-500 py-3 text-sm font-bold text-white shadow-lg shadow-pink-500/25 transition-all hover:bg-pink-600 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {withdrawLoading ? "Submitting…" : "Submit withdrawal request"}
          </button>
        </Modal>
      )}

      {/* ── Early payout modal ────────────────────────────────────────── */}
      {showEarlyPayoutModal && (
        <Modal
          onClose={() => setShowEarlyPayoutModal(false)}
          title="Request early payout"
          subtitle="Submit a payout request before the event has fully completed."
        >
          <Field label="Event">
            <select
              className={inputCls}
              value={earlyPayoutEventId}
              onChange={(e) => setEarlyPayoutEventId(e.target.value)}
            >
              <option value="">Select event</option>
              {data?.perEvent?.map((event) => (
                <option key={event.eventId} value={event.eventId}>
                  {event.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Amount (₦)">
            <input
              className={inputCls}
              type="number"
              placeholder="Enter amount"
              value={earlyPayoutAmount}
              onChange={(e) => setEarlyPayoutAmount(e.target.value)}
            />
          </Field>
          <button
            onClick={handleEarlyPayoutRequest}
            disabled={earlyPayoutLoading}
            className="mt-2 w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {earlyPayoutLoading ? "Submitting…" : "Submit early payout request"}
          </button>
        </Modal>
      )}

      {/* ── Connect account modal ────────────────────────────────────────── */}
      {showConnectAccountModal && (
        <Modal
          onClose={() => setShowConnectAccountModal(false)}
          title="Connect payout account"
          subtitle="Your bank details are stored securely and used for all future withdrawals."
        >
          <Field label="Bank">
            <select
              className={inputCls}
              value={bankDetails.bankCode}
              onChange={(e) => {
                const selected = uniqueBanks.find((b) => b.code === e.target.value);
                if (selected)
                  setBankDetails({
                    ...bankDetails,
                    bankCode: selected.code,
                    bankName: selected.name,
                  });
              }}
            >
              <option value="">Select your bank</option>
              {uniqueBanks.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Account number">
            <input
              className={inputCls}
              placeholder="10-digit account number"
              value={bankDetails.accountNumber}
              onChange={(e) =>
                setBankDetails({ ...bankDetails, accountNumber: e.target.value })
              }
            />
          </Field>
          <Field label="Account name">
            <input
              className={inputCls}
              placeholder="As it appears on your bank records"
              value={bankDetails.accountName}
              onChange={(e) =>
                setBankDetails({ ...bankDetails, accountName: e.target.value })
              }
            />
          </Field>
          <button
            onClick={handleConnectPayoutAccount}
            disabled={connectLoading}
            className="mt-2 w-full rounded-xl bg-gray-900 py-3 text-sm font-bold text-white transition-all hover:bg-gray-700 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {connectLoading ? "Connecting…" : "Connect account"}
          </button>
        </Modal>
      )}
    </div>
  );
}
