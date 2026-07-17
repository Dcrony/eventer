import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  DollarSign,
  RefreshCcw,
  Search,
  Wallet,
  BadgeAlert,
  Banknote,
  Settings2,
  ShieldCheck,
  FileClock,
  ListChecks,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import {
  EmptyState,
  ErrorMessage,
  LoadingSpinner,
  PaginationControls,
  StatCard,
  StatusBadge,
  SurfaceCard,
  TableHead,
  TableWrapper,
} from "../components/AdminComponents";
import {
  adminAction,
  getPayoutSettings,
  listPayouts,
  processPayouts,
  updatePayoutSettings,
} from "../services/api/payouts";
import { formatCurrency, formatDateTime } from "../utils/adminUtils";
import { useToast } from "../components/ui/toast";

const STATE_CONFIG = {
  pending: { tone: "amber", label: "Pending" },
  processing: { tone: "blue", label: "Processing" },
  under_review: { tone: "blue", label: "Under Review" },
  scheduled: { tone: "purple", label: "Scheduled" },
  released: { tone: "green", label: "Released" },
  completed: { tone: "emerald", label: "Completed" },
  frozen: { tone: "gray", label: "Frozen" },
  refunded: { tone: "red", label: "Refunded" },
  PENDING: { tone: "amber", label: "Pending" },
  PROCESSING: { tone: "blue", label: "Processing" },
  PAID: { tone: "green", label: "Paid" },
  FAILED: { tone: "red", label: "Failed" },
  REVERSED: { tone: "red", label: "Reversed" },
};

const emptySettings = {
  commissionPercent: 10,
  withdrawalFeePercent: 2,
  payouts: {
    holdingPeriodHours: 48,
    earlyPayoutPercentVerified: 50,
    earlyPayoutPercentTrusted: 80,
    requireOrganizerVerified: false,
    requireEventCompletion: true,
    autoReleaseIntervalMinutes: 60,
    maxAutoReleaseBatch: 50,
  },
};

function Metric({ icon, label, value, detail, accent = false }) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${
        accent ? "border-pink-200 bg-pink-50/60" : "border-gray-100 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.58rem] font-black uppercase tracking-widest text-gray-400">{label}</p>
          <p className="mt-2 text-xl font-black text-gray-900 tabular-nums">{value}</p>
          {detail && <p className="mt-1 text-xs text-gray-500">{detail}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent ? "bg-pink-500 text-white" : "bg-gray-100 text-gray-500"}`}>
          {icon ? createElement(icon, { size: 18 }) : null}
        </div>
      </div>
    </div>
  );
}

export default function AdminPayouts() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [summary, setSummary] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [settings, setSettings] = useState(emptySettings);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = {};
      if (stateFilter) filters.state = stateFilter;
      if (search) filters.search = search;

      const [payoutsRes, settingsRes] = await Promise.all([
        listPayouts({ page, limit: 25, ...filters }),
        getPayoutSettings().catch(() => ({ settings: emptySettings })),
      ]);

      setItems(payoutsRes.items || []);
      setPagination(payoutsRes.pagination || { page: 1, pages: 1, total: 0 });
      setSummary(payoutsRes.summary || null);
      setSettings({
        ...emptySettings,
        ...(settingsRes?.settings || {}),
        payouts: {
          ...emptySettings.payouts,
          ...(settingsRes?.settings?.payouts || {}),
        },
      });
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load payouts");
    } finally {
      setLoading(false);
    }
  }, [page, stateFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAction = async (id, action) => {
    try {
      setActionLoading(id + action);
      await adminAction(id, action, `${action} by admin`);
      toast.success(`Payout ${action.replaceAll("_", " ")} completed.`);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBatchProcess = async () => {
    try {
      setProcessing(true);
      const res = await processPayouts({ batchSize: 50 });
      toast.success(`Processed ${res.processed || 0} payout(s).`);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Batch processing failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSettingsLoading(true);
      await updatePayoutSettings(settings);
      toast.success("Payout settings saved.");
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to save payout settings");
    } finally {
      setSettingsLoading(false);
    }
  };

  const applySearch = () => {
    setPage(1);
    load();
  };

  const totalPayouts = summary?.totalCount ?? items.length;
  const pendingCount = summary?.pendingCount ?? items.filter((p) => String(p.status).toUpperCase() === "PENDING").length;
  const paidCount = summary?.paidCount ?? items.filter((p) => String(p.status).toUpperCase() === "PAID").length;
  const failedCount = summary?.failedCount ?? items.filter((p) => String(p.status).toUpperCase() === "FAILED").length;
  const reversedCount = summary?.reversedCount ?? items.filter((p) => String(p.status).toUpperCase() === "REVERSED").length;
  const earlyCount = summary?.earlyCount ?? items.filter((p) => p.payoutType === "EARLY").length;
  const finalCount = summary?.finalCount ?? items.filter((p) => p.payoutType === "FINAL").length;

  const filteredStatus = useMemo(() => {
    if (!stateFilter) return "All payouts";
    return STATE_CONFIG[stateFilter]?.label || stateFilter;
  }, [stateFilter]);

  return (
    <AdminLayout
      title="Payout Management"
      description="Automated payout batches, payout logs, retries, and payout settings."
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
          <StatCard icon={Wallet} label="Total Payouts" value={totalPayouts} detail="All payout records" accent />
          <StatCard icon={Clock} label="Pending" value={pendingCount} detail="Awaiting settlement" />
          <StatCard icon={CheckCircle2} label="Paid" value={paidCount} detail="Settled successfully" />
          <StatCard icon={BadgeAlert} label="Failed" value={failedCount} detail="Needs retry" />
          <StatCard icon={BadgeAlert} label="Reversed" value={reversedCount} detail="Returned by provider" />
          <StatCard icon={Banknote} label="Early" value={earlyCount} detail="Organizer advances" />
          <StatCard icon={FileClock} label="Final" value={finalCount} detail="Auto event payouts" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
          <SurfaceCard className="p-5">
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <p className="text-[0.6rem] font-black uppercase tracking-widest text-pink-400">Payout Settings</p>
                <h3 className="mt-1 text-sm font-extrabold text-gray-900">Automation controls</h3>
              </div>
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={settingsLoading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-pink-500 px-3 py-2 text-xs font-semibold text-white hover:bg-pink-600 disabled:opacity-60"
              >
                <Settings2 size={12} />
                {settingsLoading ? "Saving…" : "Save settings"}
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs">
                <span className="block text-[0.6rem] font-black uppercase tracking-widest text-gray-400">Holding period (hours)</span>
                <input
                  type="number"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none"
                  value={settings.payouts.holdingPeriodHours}
                  onChange={(e) => setSettings((prev) => ({ ...prev, payouts: { ...prev.payouts, holdingPeriodHours: Number(e.target.value) } }))}
                />
              </label>
              <label className="space-y-1 text-xs">
                <span className="block text-[0.6rem] font-black uppercase tracking-widest text-gray-400">Commission %</span>
                <input
                  type="number"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none"
                  value={settings.commissionPercent}
                  onChange={(e) => setSettings((prev) => ({ ...prev, commissionPercent: Number(e.target.value) }))}
                />
              </label>
              <label className="space-y-1 text-xs">
                <span className="block text-[0.6rem] font-black uppercase tracking-widest text-gray-400">Verified early %</span>
                <input
                  type="number"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none"
                  value={settings.payouts.earlyPayoutPercentVerified}
                  onChange={(e) => setSettings((prev) => ({ ...prev, payouts: { ...prev.payouts, earlyPayoutPercentVerified: Number(e.target.value) } }))}
                />
              </label>
              <label className="space-y-1 text-xs">
                <span className="block text-[0.6rem] font-black uppercase tracking-widest text-gray-400">Trusted early %</span>
                <input
                  type="number"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none"
                  value={settings.payouts.earlyPayoutPercentTrusted}
                  onChange={(e) => setSettings((prev) => ({ ...prev, payouts: { ...prev.payouts, earlyPayoutPercentTrusted: Number(e.target.value) } }))}
                />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs sm:col-span-2">
                <span className="font-semibold text-gray-700">Require organizer verification</span>
                <input
                  type="checkbox"
                  checked={Boolean(settings.payouts.requireOrganizerVerified)}
                  onChange={(e) => setSettings((prev) => ({ ...prev, payouts: { ...prev.payouts, requireOrganizerVerified: e.target.checked } }))}
                />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs sm:col-span-2">
                <span className="font-semibold text-gray-700">Require event completion</span>
                <input
                  type="checkbox"
                  checked={Boolean(settings.payouts.requireEventCompletion)}
                  onChange={(e) => setSettings((prev) => ({ ...prev, payouts: { ...prev.payouts, requireEventCompletion: e.target.checked } }))}
                />
              </label>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <p className="text-[0.6rem] font-black uppercase tracking-widest text-pink-400">Operations</p>
                <h3 className="mt-1 text-sm font-extrabold text-gray-900">Automation queue</h3>
              </div>
              <button
                type="button"
                onClick={handleBatchProcess}
                disabled={processing}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
              >
                <RefreshCcw size={13} />
                {processing ? "Processing…" : "Run payout batch"}
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric icon={ShieldCheck} label="Early payouts" value={summary?.earlyCount ?? 0} detail="Approved organizer advances" />
              <Metric icon={ListChecks} label="Final payouts" value={summary?.finalCount ?? 0} detail="Automatic settlement records" />
              <Metric icon={DollarSign} label="Gross volume" value={formatCurrency(summary?.totalVolume || 0)} detail="Across all payout records" />
              <Metric icon={DollarSign} label="Net amount" value={formatCurrency(summary?.netAmount || 0)} detail="Amount settled to organizers" accent />
            </div>
          </SurfaceCard>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <SurfaceCard className="p-3">
            <div className="flex items-center gap-2">
              <Search size={15} className="flex-shrink-0 text-pink-500" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applySearch();
                }}
                placeholder="Search organizer, email, or event"
                className="min-w-0 flex-1 bg-transparent text-xs text-gray-800 outline-none placeholder:text-gray-400"
              />
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-3">
            <select
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-transparent text-xs font-medium text-gray-700 outline-none"
            >
              <option value="">All states</option>
              {Object.entries(STATE_CONFIG).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </SurfaceCard>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setPage(1);
                load();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-pink-500 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-pink-600 active:scale-95"
            >
              <RefreshCcw size={13} />
              Refresh
            </button>
          </div>
        </div>

        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

        {loading ? (
          <LoadingSpinner label={`Loading ${filteredStatus.toLowerCase()}...`} />
        ) : items.length === 0 ? (
          <EmptyState icon={Wallet} title="No payouts found" description="No payout records match the current filters." />
        ) : (
          <TableWrapper>
            <TableHead columns={["Organizer", "Event", "Type", "Net", "Status", "Logs", "Created", "Actions"]} />
            <tbody className="divide-y divide-gray-100 bg-white">
              {items.map((payout) => {
                const statusKey = String(payout.status || payout.state || "").toUpperCase();
                const cfg = STATE_CONFIG[payout.state] || STATE_CONFIG[statusKey] || { tone: "gray", label: payout.state || payout.status };
                const isActing = actionLoading?.startsWith(payout._id);
                const latestLog = Array.isArray(payout.logs) && payout.logs.length ? payout.logs[payout.logs.length - 1] : null;
                return (
                  <tr key={payout._id} className="group transition-colors hover:bg-pink-50/40">
                    <td className="px-4 py-3.5">
                      <p className="text-xs font-semibold text-gray-900">
                        {payout.organizer?.name || payout.organizer?.username || "Unknown"}
                      </p>
                      <p className="mt-0.5 text-[0.6rem] text-gray-400">
                        {payout.organizer?.email || "No email"} · {payout.organizer?.organizerLevel || "NEW"}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs font-semibold text-gray-900">{payout.event?.title || "Event payout"}</p>
                      <p className="mt-0.5 text-[0.6rem] text-gray-400 tabular-nums">
                        Revenue: {formatCurrency(payout.event?.totalTicketRevenue || payout.grossAmount || 0)}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-semibold text-gray-500">{payout.payoutType || "FINAL"}</td>
                    <td className="px-4 py-3.5">
                      <div className="text-xs font-bold text-gray-900 tabular-nums">{formatCurrency(payout.netAmount || payout.amount || 0)}</div>
                      <div className="mt-0.5 text-[0.6rem] text-gray-400">
                        {payout.payoutType === "EARLY" ? "Early payout" : "Final settlement"}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge tone={cfg.tone}>{cfg.label}</StatusBadge>
                    </td>
                    <td className="px-4 py-3.5 text-[0.6rem] text-gray-400">
                      <div className="max-w-[180px] truncate" title={latestLog?.message || ""}>
                        {latestLog?.message || "No logs yet"}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-400">{formatDateTime(payout.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {String(payout.status).toUpperCase() === "FAILED" ? (
                          <button
                            type="button"
                            onClick={() => handleAction(payout._id, "retry_failed")}
                            disabled={isActing}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[0.65rem] font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50 active:scale-95"
                          >
                            <RefreshCcw size={11} /> Retry
                          </button>
                        ) : (
                          <span className="text-[0.6rem] font-medium text-gray-400">
                            Automated
                          </span>
                        )}
                        {isActing && <span className="text-[0.6rem] font-medium text-pink-400 animate-pulse">Working…</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrapper>
        )}

        <PaginationControls
          page={pagination.page || page}
          pages={pagination.pages || 1}
          total={pagination.total}
          label="payouts"
          onPrevious={() => setPage((c) => Math.max(1, c - 1))}
          onNext={() => setPage((c) => Math.min(pagination.pages || 1, c + 1))}
        />
      </div>
    </AdminLayout>
  );
}
