import { useEffect, useState } from "react";
import { AlertTriangle, Radio, ShieldAlert, UserX } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { EmptyState, ErrorMessage, LoadingSpinner, StatusBadge, SurfaceCard } from "../components/AdminComponents";
import adminService from "../services/adminService";
import { formatCurrency, formatDateTime, getStatusTone } from "../utils/adminUtils";
import { useToast } from "../components/ui/toast";

export default function AdminModeration() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [livestreams, setLivestreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadModeration = async () => {
    try {
      setLoading(true);
      setError("");
      const [moderationRes, livestreamRes] = await Promise.all([
        adminService.getModerationOverview(),
        adminService.getLivestreams(1, 8, { live: "all" }),
      ]);
      setData(moderationRes);
      setLivestreams(livestreamRes.events || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load moderation data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModeration();
  }, []);

  const handleStopLivestream = async (eventId) => {
    try {
      await adminService.forceStopLivestream(eventId);
      toast.success("Livestream stopped.");
      loadModeration();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to stop livestream.");
    }
  };

  const summary = data?.summary || {};
  const queues = data?.queues || {};

  return (
    <AdminLayout title="Moderation & Risk" description="Review event approvals, account restrictions, refund anomalies, and live-stream safety issues.">
      {error ? <ErrorMessage message={error} onDismiss={() => setError("")} /> : null}

      {loading ? (
        <LoadingSpinner label="Loading moderation queues..." />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <SurfaceCard className="p-4"><p className="text-xs font-bold uppercase tracking-wider text-gray-400">Pending Events</p><p className="mt-2 text-2xl font-extrabold text-gray-900">{summary.pendingEvents || 0}</p></SurfaceCard>
            <SurfaceCard className="p-4"><p className="text-xs font-bold uppercase tracking-wider text-gray-400">Suspended Events</p><p className="mt-2 text-2xl font-extrabold text-gray-900">{summary.suspendedEvents || 0}</p></SurfaceCard>
            <SurfaceCard className="p-4"><p className="text-xs font-bold uppercase tracking-wider text-gray-400">Suspended Users</p><p className="mt-2 text-2xl font-extrabold text-gray-900">{summary.suspendedUsers || 0}</p></SurfaceCard>
            <SurfaceCard className="p-4"><p className="text-xs font-bold uppercase tracking-wider text-gray-400">Refunded Tickets</p><p className="mt-2 text-2xl font-extrabold text-gray-900">{summary.refundedTickets || 0}</p></SurfaceCard>
            <SurfaceCard className="p-4"><p className="text-xs font-bold uppercase tracking-wider text-gray-400">Failed Payouts</p><p className="mt-2 text-2xl font-extrabold text-gray-900">{summary.failedWithdrawals || 0}</p></SurfaceCard>
            <SurfaceCard className="p-4"><p className="text-xs font-bold uppercase tracking-wider text-gray-400">Live Events</p><p className="mt-2 text-2xl font-extrabold text-gray-900">{summary.liveEvents || 0}</p></SurfaceCard>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <SurfaceCard>
              <div className="mb-4 flex items-center gap-2">
                <ShieldAlert size={18} className="text-pink-500" />
                <h3 className="text-lg font-extrabold text-gray-900">Event Review Queue</h3>
              </div>
              <div className="space-y-3">
                {(queues.pendingEvents || []).map((event) => (
                  <div key={event._id} className="rounded-2xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{event.createdBy?.name || event.createdBy?.email || "Unknown organizer"}</p>
                      </div>
                      <StatusBadge tone={getStatusTone(event.status)}>{event.status}</StatusBadge>
                    </div>
                    <p className="mt-2 text-xs text-gray-400">{formatDateTime(event.createdAt)}</p>
                  </div>
                ))}
                {!(queues.pendingEvents || []).length ? <EmptyState icon={ShieldAlert} title="Queue clear" description="There are no pending events waiting for review." /> : null}
              </div>
            </SurfaceCard>

            <SurfaceCard>
              <div className="mb-4 flex items-center gap-2">
                <Radio size={18} className="text-pink-500" />
                <h3 className="text-lg font-extrabold text-gray-900">Livestream Oversight</h3>
              </div>
              <div className="space-y-3">
                {livestreams.map((event) => (
                  <div key={event._id} className="rounded-2xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{event.createdBy?.name || event.createdBy?.email || "Unknown organizer"}</p>
                      </div>
                      <StatusBadge tone={event.liveStream?.isLive ? "emerald" : "slate"}>
                        {event.liveStream?.isLive ? "Live" : "Offline"}
                      </StatusBadge>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-gray-500">{event.liveStream?.streamType || "No stream type"}</p>
                      {event.liveStream?.isLive ? (
                        <button
                          type="button"
                          onClick={() => handleStopLivestream(event._id)}
                          className="rounded-full bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600"
                        >
                          Force stop
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
                {!livestreams.length ? <p className="text-sm text-gray-500">No livestream records found.</p> : null}
              </div>
            </SurfaceCard>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <SurfaceCard>
              <div className="mb-4 flex items-center gap-2">
                <UserX size={18} className="text-pink-500" />
                <h3 className="text-lg font-extrabold text-gray-900">Restricted Accounts</h3>
              </div>
              <div className="space-y-3">
                {(queues.suspendedUsers || []).map((user) => (
                  <div key={user._id} className="rounded-2xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{user.name || user.username}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{user.email}</p>
                      </div>
                      <StatusBadge tone="rose">{user.role}</StatusBadge>
                    </div>
                  </div>
                ))}
                {!(queues.suspendedUsers || []).length ? <p className="text-sm text-gray-500">No suspended users right now.</p> : null}
              </div>
            </SurfaceCard>

            <SurfaceCard>
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle size={18} className="text-pink-500" />
                <h3 className="text-lg font-extrabold text-gray-900">Financial Exceptions</h3>
              </div>
              <div className="space-y-3">
                {(queues.failedWithdrawals || []).map((item) => (
                  <div key={item._id} className="rounded-2xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.organizer?.name || item.organizer?.email || "Unknown organizer"}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{item.failureReason || "Transfer failed"}</p>
                      </div>
                      <div className="text-right">
                        <StatusBadge tone={getStatusTone(item.status)}>{item.status}</StatusBadge>
                        <p className="mt-1 text-xs text-gray-500">{formatCurrency(item.amount || 0)}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {!(queues.failedWithdrawals || []).length ? <p className="text-sm text-gray-500">No failed withdrawals in the moderation queue.</p> : null}
              </div>
            </SurfaceCard>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
