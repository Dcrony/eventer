import { useEffect, useState } from "react";
import { AlertTriangle, Radio, ShieldAlert, UserX } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { EmptyState, ErrorMessage, LoadingSpinner, StatusBadge, SurfaceCard } from "../components/AdminComponents";
import adminService from "../services/adminService";
import { formatCurrency, formatDateTime, getStatusTone } from "../utils/adminUtils";
import { useToast } from "../components/ui/toast";

function SummaryCard({ label, value }) {
    return (
        <div className="relative rounded-2xl border border-gray-100 bg-white p-4 overflow-hidden hover:border-pink-100 hover:shadow-md transition-all duration-200">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-pink-500" />
            <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">{label}</p>
            <p className="mt-2 text-2xl font-black text-gray-900 tabular-nums">{value}</p>
        </div>
    );
}

function QueueCard({ icon: Icon, title, children }) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2.5 border-b border-gray-100 pb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-50 text-pink-500">
                    <Icon size={15} />
                </div>
                <h3 className="text-sm font-black text-gray-900">{title}</h3>
            </div>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

export default function AdminModeration() {
    const toast = useToast();
    const [data, setData] = useState(null);
    const [livestreams, setLivestreams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = async () => {
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

    useEffect(() => { load(); }, []);

    const handleStopLivestream = async (eventId) => {
        try {
            await adminService.forceStopLivestream(eventId);
            toast.success("Livestream stopped.");
            load();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to stop livestream.");
        }
    };

    const summary = data?.summary || {};
    const queues  = data?.queues  || {};

    return (
        <AdminLayout title="Moderation & Risk" description="Review event approvals, account restrictions, refund anomalies, and live-stream safety.">
            {error && <ErrorMessage message={error} onDismiss={() => setError("")} className="mb-5" />}

            {loading ? (
                <LoadingSpinner label="Loading moderation queues..." />
            ) : (
                <div className="space-y-5">
                    {/* Summary row */}
                    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
                        <SummaryCard label="Pending Events"   value={summary.pendingEvents    || 0} />
                        <SummaryCard label="Suspended Events" value={summary.suspendedEvents  || 0} />
                        <SummaryCard label="Suspended Users"  value={summary.suspendedUsers   || 0} />
                        <SummaryCard label="Refunded Tickets" value={summary.refundedTickets  || 0} />
                        <SummaryCard label="Failed Payouts"   value={summary.failedWithdrawals|| 0} />
                        <SummaryCard label="Live Events"      value={summary.liveEvents       || 0} />
                    </div>

                    <div className="grid gap-5 xl:grid-cols-2">
                        {/* Event Review Queue */}
                        <QueueCard icon={ShieldAlert} title="Event Review Queue">
                            {(queues.pendingEvents || []).length === 0 ? (
                                <div className="flex min-h-[120px] items-center justify-center rounded-xl bg-gray-50/60 text-center">
                                    <div>
                                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50">
                                            <ShieldAlert size={16} className="text-pink-300" />
                                        </div>
                                        <p className="text-xs font-bold text-gray-500">Queue clear</p>
                                        <p className="text-[0.58rem] text-gray-400 mt-0.5">No pending events</p>
                                    </div>
                                </div>
                            ) : (queues.pendingEvents || []).map((event) => (
                                <div key={event._id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 hover:border-pink-100 transition-colors">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-gray-900 truncate">{event.title}</p>
                                            <p className="mt-0.5 text-[0.58rem] text-gray-400">{event.createdBy?.name || event.createdBy?.email || "Unknown organizer"}</p>
                                        </div>
                                        <StatusBadge tone={getStatusTone(event.status)}>{event.status}</StatusBadge>
                                    </div>
                                    <p className="mt-2 text-[0.55rem] text-gray-300">{formatDateTime(event.createdAt)}</p>
                                </div>
                            ))}
                        </QueueCard>

                        {/* Livestream Oversight */}
                        <QueueCard icon={Radio} title="Livestream Oversight">
                            {livestreams.length === 0 ? (
                                <p className="text-xs text-gray-400">No livestream records found.</p>
                            ) : livestreams.map((event) => (
                                <div key={event._id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 hover:border-pink-100 transition-colors">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-gray-900 truncate">{event.title}</p>
                                            <p className="mt-0.5 text-[0.58rem] text-gray-400">{event.createdBy?.name || event.createdBy?.email || "Unknown organizer"}</p>
                                        </div>
                                        <StatusBadge tone={event.liveStream?.isLive ? "green" : "gray"}>
                                            {event.liveStream?.isLive ? "Live" : "Offline"}
                                        </StatusBadge>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between">
                                        <p className="text-[0.58rem] text-gray-400">{event.liveStream?.streamType || "No stream type"}</p>
                                        {event.liveStream?.isLive && (
                                            <button
                                                type="button"
                                                onClick={() => handleStopLivestream(event._id)}
                                                className="rounded-xl bg-red-500 px-3 py-1.5 text-[0.63rem] font-bold text-white hover:bg-red-600 transition-colors"
                                            >
                                                Force stop
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </QueueCard>
                    </div>

                    <div className="grid gap-5 xl:grid-cols-2">
                        {/* Restricted Accounts */}
                        <QueueCard icon={UserX} title="Restricted Accounts">
                            {(queues.suspendedUsers || []).length === 0 ? (
                                <p className="text-xs text-gray-400">No suspended users right now.</p>
                            ) : (queues.suspendedUsers || []).map((user) => (
                                <div key={user._id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 hover:border-pink-100 transition-colors">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-gray-900 truncate">{user.name || user.username}</p>
                                            <p className="mt-0.5 text-[0.58rem] text-gray-400">{user.email}</p>
                                        </div>
                                        <StatusBadge tone="red">{user.role}</StatusBadge>
                                    </div>
                                </div>
                            ))}
                        </QueueCard>

                        {/* Financial Exceptions */}
                        <QueueCard icon={AlertTriangle} title="Financial Exceptions">
                            {(queues.failedWithdrawals || []).length === 0 ? (
                                <p className="text-xs text-gray-400">No failed withdrawals in the queue.</p>
                            ) : (queues.failedWithdrawals || []).map((item) => (
                                <div key={item._id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 hover:border-pink-100 transition-colors">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-gray-900 truncate">{item.organizer?.name || item.organizer?.email || "Unknown"}</p>
                                            <p className="mt-0.5 text-[0.58rem] text-gray-400">{item.failureReason || "Transfer failed"}</p>
                                        </div>
                                        <div className="flex-shrink-0 text-right">
                                            <StatusBadge tone={getStatusTone(item.status)}>{item.status}</StatusBadge>
                                            <p className="mt-1 text-[0.58rem] font-bold text-gray-700 tabular-nums">{formatCurrency(item.amount || 0)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </QueueCard>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}