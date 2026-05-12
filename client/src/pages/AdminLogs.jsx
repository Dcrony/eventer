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
        if (action.includes("USER_SUSPENDED")) return "text-red-600 bg-red-50";
        if (action.includes("USER_ACTIVATED")) return "text-green-600 bg-green-50";
        if (action.includes("EVENT_APPROVED")) return "text-green-600 bg-green-50";
        if (action.includes("EVENT_REJECTED")) return "text-red-600 bg-red-50";
        if (action.includes("EVENT_FEATURED")) return "text-pink-600 bg-pink-50";
        return "text-gray-600 bg-gray-50";
    };

    return (
        <AdminLayout title="Activity Logs" description="Audit trail of all admin actions and platform events.">
            <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Filter by action</p>
                        <select
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                            className="mt-3 w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
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
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total logs</p>
                        <p className="mt-3 text-2xl font-extrabold text-gray-900">{logs.length}</p>
                        <p className="mt-1 text-xs text-gray-500">Page {page} of {pagination.pages}</p>
                    </div>
                </div>

                {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

                {loading ? (
                    <LoadingSpinner />
                ) : logs.length === 0 ? (
                    <EmptyState title="No activity logs found" description="Adjust filters to see admin history." />
                ) : (
                    <div className="space-y-3">
                        {logs.map((log) => {
                            const Icon = actionIcons[log.action] || Activity;
                            return (
                                <div key={log._id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${getActionColor(log.action)}`}>
                                            <Icon size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <h3 className="text-sm font-bold text-gray-900">
                                                    {log.action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())}
                                                </h3>
                                                <p className="text-xs text-gray-500">{formatDateTime(log.createdAt)}</p>
                                            </div>
                                            <p className="mt-2 text-sm text-gray-600">{log.details || "No additional details"}</p>
                                            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
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