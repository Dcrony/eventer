import { useEffect, useState } from "react";
import { Activity, Shield, User, Calendar, AlertTriangle, Wallet, StarOff } from "lucide-react";
import adminService from "../services/adminService";
import AdminLayout from "../components/AdminLayout";
import { LoadingSpinner, ErrorMessage, EmptyState, PaginationControls } from "../components/AdminComponents";
import { formatDateTime } from "../utils/adminUtils";

const ACTION_ICONS = {
    USER_SUSPENDED:      Shield,
    USER_ACTIVATED:      User,
    EVENT_APPROVED:      Calendar,
    EVENT_REJECTED:      AlertTriangle,
    EVENT_FEATURED:      Activity,
    EVENT_UNFEATURED:    StarOff,
    ANNOUNCEMENT_SENT:   Activity,
    WITHDRAWAL_APPROVED: Wallet,
    WITHDRAWAL_REJECTED: AlertTriangle,
};

const ACTION_COLORS = {
    USER_SUSPENDED:   "bg-red-50 text-red-500 border-red-100",
    USER_ACTIVATED:   "bg-green-50 text-green-500 border-green-100",
    EVENT_APPROVED:   "bg-green-50 text-green-500 border-green-100",
    EVENT_REJECTED:   "bg-red-50 text-red-500 border-red-100",
    EVENT_FEATURED:   "bg-pink-50 text-pink-500 border-pink-100",
    EVENT_UNFEATURED: "bg-gray-50 text-gray-500 border-gray-100",
};

function getActionColor(action) {
    for (const [key, cls] of Object.entries(ACTION_COLORS)) {
        if (action.includes(key)) return cls;
    }
    return "bg-gray-50 text-gray-500 border-gray-100";
}

export default function AdminLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [action, setAction] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ pages: 1, total: 0 });

    useEffect(() => { fetchLogs(); }, [action, page]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            setError(null);
            const filters = {};
            if (action) filters.action = action;
            const data = await adminService.getActivityLogs(page, 50, filters);
            setLogs(data.logs || []);
            setPagination(data.pagination || { pages: 1, total: 0 });
        } catch (err) {
            setError(err.response?.data?.message || "Unable to load activity logs.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout title="Activity Logs" description="Audit trail of all admin actions and platform events.">
            <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-[1fr_auto] items-stretch">
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">Filter by action</p>
                        <select
                            value={action}
                            onChange={(e) => { setAction(e.target.value); setPage(1); }}
                            className="mt-3 w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs font-medium text-gray-700 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-50"
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
                    <div className="relative rounded-2xl border border-gray-100 bg-white p-5 shadow-sm overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-pink-500" />
                        <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">Total Logs</p>
                        <p className="mt-2 text-2xl font-black text-gray-900 tabular-nums">{logs.length}</p>
                        <p className="mt-1 text-xs text-gray-400">Page {page} of {pagination.pages}</p>
                    </div>
                </div>

                {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

                {loading ? (
                    <LoadingSpinner />
                ) : logs.length === 0 ? (
                    <EmptyState title="No activity logs found" description="Adjust filters to see admin history." />
                ) : (
                    <div className="space-y-2">
                        {logs.map((log) => {
                            const Icon = ACTION_ICONS[log.action] || Activity;
                            const colorCls = getActionColor(log.action);
                            return (
                                <div key={log._id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-pink-100 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className={`inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border ${colorCls}`}>
                                            <Icon size={15} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <h3 className="text-xs font-black text-gray-900">
                                                    {log.action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                                                </h3>
                                                <p className="text-[0.58rem] text-gray-400">{formatDateTime(log.createdAt)}</p>
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500 leading-relaxed">{log.details || "No additional details"}</p>
                                            <div className="mt-2 flex flex-wrap items-center gap-3 text-[0.58rem] text-gray-400">
                                                <span>Admin: <span className="font-bold text-gray-600">{log.adminId?.name || "Unknown"}</span></span>
                                                <span>·</span>
                                                <span>Target: <span className="font-bold text-gray-600">{log.targetType} ({log.targetId || "N/A"})</span></span>
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