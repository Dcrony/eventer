import { useEffect, useState } from "react";
import { Activity, Shield, User, Calendar, AlertTriangle, Wallet, StarOff } from "lucide-react";
import adminService from "../services/adminService";
import AdminLayout from "../components/AdminLayout";
import { LoadingSpinner, ErrorMessage, EmptyState, PaginationControls } from "../components/AdminComponents";
import { formatDateTime } from "../utils/adminUtils";

const actionIcons = {
    USER_SUSPENDED: Shield,
    USER_ACTIVATED: User,
    EVENT_APPROVED: Calendar,
    EVENT_REJECTED: AlertTriangle,
    EVENT_FEATURED: Activity,
    EVENT_UNFEATURED: StarOff,
    ANNOUNCEMENT_SENT: Activity,
    WITHDRAWAL_APPROVED: Wallet,
    WITHDRAWAL_REJECTED: AlertTriangle,
};

export default function AdminLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [action, setAction] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ pages: 1 });

    useEffect(() => {
        fetchLogs();
    }, [action, page]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            setError(null);
            const filters = {};
            if (action) filters.action = action;
            const data = await adminService.getActivityLogs(page, 50, filters);
            setLogs(data.logs || []);
            setPagination(data.pagination || { pages: 1 });
        } catch (err) {
            console.error("Failed to load activity logs", err);
            setError(err.response?.data?.message || "Unable to load activity logs.");
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action) => {
        if (action.includes("USER_SUSPENDED")) return "text-rose-600 bg-rose-50";
        if (action.includes("USER_ACTIVATED")) return "text-emerald-600 bg-emerald-50";
        if (action.includes("EVENT_APPROVED")) return "text-emerald-600 bg-emerald-50";
        if (action.includes("EVENT_REJECTED")) return "text-rose-600 bg-rose-50";
        if (action.includes("EVENT_FEATURED")) return "text-pink-600 bg-pink-50";
        return "text-slate-600 bg-slate-50";
    };

    return (
        <AdminLayout title="Activity Logs" description="Audit trail of all admin actions and platform events.">
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold text-slate-400 uppercase tracking-[0.2em]">Filter by action</p>
                        <select
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                            className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                        >
                            <option value="">All actions</option>
                            <option value="USER_SUSPENDED">User Suspended</option>
                            <option value="USER_ACTIVATED">User Activated</option>
                            <option value="EVENT_APPROVED">Event Approved</option>
                            <option value="EVENT_REJECTED">Event Rejected</option>
                            <option value="EVENT_FEATURED">Event Featured</option>
                            <option value="ANNOUNCEMENT_SENT">Announcement Sent</option>
                        </select>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold text-slate-400 uppercase tracking-[0.2em]">Total logs</p>
                        <p className="mt-4 text-3xl font-bold text-slate-950">{logs.length}</p>
                        <p className="mt-2 text-sm text-slate-500">Page {page} of {pagination.pages}</p>
                    </div>
                </div>

                {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

                {loading ? (
                    <LoadingSpinner />
                ) : logs.length === 0 ? (
                    <EmptyState title="No activity logs found" description="Adjust filters to see admin history." />
                ) : (
                    <div className="space-y-4">
                        {logs.map((log) => {
                            const Icon = actionIcons[log.action] || Activity;
                            return (
                                <div key={log._id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <div className="flex items-start gap-4">
                                        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${getActionColor(log.action)}`}>
                                            <Icon size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-slate-950">
                                                    {log.action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())}
                                                </h3>
                                                <p className="text-xs text-slate-500">{formatDateTime(log.createdAt)}</p>
                                            </div>
                                            <p className="mt-2 text-sm text-slate-600">{log.details || "No additional details"}</p>
                                            <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                                                <span>Admin: {log.adminId?.name || "Unknown"}</span>
                                                <span>Target: {log.targetType} ({log.targetId || "N/A"})</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <PaginationControls
                    page={page}
                    pages={pagination.pages || 1}
                    total={pagination.total}
                    label="logs"
                    onPrevious={() => setPage(Math.max(1, page - 1))}
                    onNext={() => setPage(Math.min(pagination.pages || 1, page + 1))}
                />
            </div>
        </AdminLayout>
    );
}
