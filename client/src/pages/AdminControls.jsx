import { useEffect, useState } from "react";
import { Bell, Search, Send, Shield } from "lucide-react";
import adminService from "../services/adminService";
import AdminLayout from "../components/AdminLayout";
import {
    EmptyState,
    ErrorMessage,
    LoadingSpinner,
    SuccessMessage,
    SurfaceCard,
} from "../components/AdminComponents";

// ── shared input / select / textarea class ───────────────────────────────────
const fieldCls =
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100 placeholder:text-gray-400";

export default function AdminControls() {
    const [loading, setLoading] = useState(false);
    const [bootLoading, setBootLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [announcement, setAnnouncement] = useState({
        title:          "",
        content:        "",
        type:           "info",
        targetAudience: "all",
    });

    const loadOperations = async () => {
        try {
            setBootLoading(true);
            const [announcementsRes, permissionsRes] = await Promise.all([
                adminService.getAnnouncements(1, 12),
                adminService.getAdminPermissions(),
            ]);
            setAnnouncements(announcementsRes.announcements || []);
            setPermissions(permissionsRes.permissions     || []);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load admin operations data.");
        } finally {
            setBootLoading(false);
        }
    };

    useEffect(() => { loadOperations(); }, []);

    const sendAnnouncement = async () => {
        if (!announcement.title.trim() || !announcement.content.trim()) {
            setError("Please fill in both title and content for the announcement.");
            return;
        }
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            const response = await adminService.sendAnnouncement(announcement);
            setSuccess(response?.message || "Announcement sent successfully.");
            setAnnouncement({ title: "", content: "", type: "info", targetAudience: "all" });
            loadOperations();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send announcement.");
        } finally {
            setLoading(false);
        }
    };

    const runSearch = async () => {
        if (!searchTerm.trim()) { setSearchResults(null); return; }
        try {
            setLoading(true);
            const response = await adminService.search(searchTerm.trim());
            setSearchResults(response.results || {});
        } catch (err) {
            setError(err.response?.data?.message || "Failed to run global admin search.");
        } finally {
            setLoading(false);
        }
    };

    // Announcement type badge colours
    const typeTone = { info: "blue", warning: "amber", success: "green", maintenance: "red" };

    if (bootLoading) {
        return (
            <AdminLayout
                title="Operations Center"
                description="Manage communication, audit readiness, and platform-wide admin utilities."
            >
                <LoadingSpinner label="Loading operations center…" />
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            title="Operations Center"
            description="Manage communication, audit readiness, and platform-wide admin utilities."
        >
            <div className="space-y-5">
                {error   && <ErrorMessage   message={error}   onDismiss={() => setError(null)} />}
                {success && <SuccessMessage message={success} />}

                <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                    {/* ── Announcements ── */}
                    <SurfaceCard className="space-y-4">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-500 flex-shrink-0">
                                <Bell size={18} />
                            </div>
                            <div>
                                <p className="text-[0.6rem] font-bold uppercase tracking-widest text-pink-400">Communication</p>
                                <h3 className="text-sm font-extrabold text-gray-900">Platform Announcements</h3>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <input
                                type="text"
                                value={announcement.title}
                                onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                                placeholder="Announcement title"
                                className={fieldCls}
                            />
                            <select
                                value={announcement.type}
                                onChange={(e) => setAnnouncement({ ...announcement, type: e.target.value })}
                                className={fieldCls}
                            >
                                <option value="info">Information</option>
                                <option value="warning">Warning</option>
                                <option value="success">Success</option>
                                <option value="maintenance">Maintenance</option>
                            </select>
                        </div>

                        <textarea
                            value={announcement.content}
                            onChange={(e) => setAnnouncement({ ...announcement, content: e.target.value })}
                            placeholder="Announcement message…"
                            rows={5}
                            className={fieldCls}
                        />

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <select
                                value={announcement.targetAudience}
                                onChange={(e) => setAnnouncement({ ...announcement, targetAudience: e.target.value })}
                                className={`${fieldCls} sm:max-w-[200px]`}
                            >
                                <option value="all">All Users</option>
                                <option value="organizers">Organizers</option>
                                <option value="buyers">Buyers</option>
                                <option value="admins">Admins</option>
                            </select>

                            <button
                                type="button"
                                onClick={sendAnnouncement}
                                disabled={loading}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-pink-500 px-5 py-3 text-sm font-semibold text-white hover:bg-pink-600 disabled:opacity-60 transition-colors active:scale-95"
                            >
                                <Send size={15} />
                                Send announcement
                            </button>
                        </div>
                    </SurfaceCard>

                    {/* ── Global Search ── */}
                    <SurfaceCard className="space-y-4">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-500 flex-shrink-0">
                                <Search size={18} />
                            </div>
                            <div>
                                <p className="text-[0.6rem] font-bold uppercase tracking-widest text-pink-400">Utilities</p>
                                <h3 className="text-sm font-extrabold text-gray-900">Global Search</h3>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
                                placeholder="Search records…"
                                className={`${fieldCls} flex-1`}
                            />
                            <button
                                type="button"
                                onClick={runSearch}
                                disabled={loading}
                                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:border-pink-300 hover:text-pink-600 disabled:opacity-60 transition-colors active:scale-95"
                            >
                                Go
                            </button>
                        </div>

                        <div className="space-y-2">
                            {searchResults ? (
                                Object.entries(searchResults).map(([key, items]) => (
                                    <div
                                        key={key}
                                        className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3"
                                    >
                                        <p className="text-xs font-semibold capitalize text-gray-700">{key}</p>
                                        <span className="rounded-full bg-pink-50 px-2.5 py-1 text-[0.65rem] font-bold text-pink-600">
                                            {items?.length || 0}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <EmptyState
                                    icon={Search}
                                    title="Search ready"
                                    description="Run a cross-platform search to inspect users, events, finance records, and streams."
                                />
                            )}
                        </div>
                    </SurfaceCard>
                </div>

                <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                    {/* ── Permission Footprint ── */}
                    <SurfaceCard>
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-4">
                            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-500 flex-shrink-0">
                                <Shield size={18} />
                            </div>
                            <div>
                                <p className="text-[0.6rem] font-bold uppercase tracking-widest text-pink-400">Access</p>
                                <h3 className="text-sm font-extrabold text-gray-900">Permission Footprint</h3>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {permissions.map((permission) => (
                                <span
                                    key={permission}
                                    className="rounded-full border border-pink-100 bg-pink-50 px-3 py-1.5 text-xs font-semibold text-pink-700"
                                >
                                    {permission}
                                </span>
                            ))}
                            {!permissions.length && (
                                <p className="text-sm text-gray-400">No permission data available.</p>
                            )}
                        </div>
                    </SurfaceCard>

                    {/* ── Recent Announcements ── */}
                    <SurfaceCard>
                        <div className="pb-4 border-b border-gray-100 mb-4">
                            <p className="text-[0.6rem] font-bold uppercase tracking-widest text-pink-400">History</p>
                            <h3 className="mt-1 text-sm font-extrabold text-gray-900">Recent Announcements</h3>
                        </div>
                        <div className="space-y-3">
                            {announcements.map((item) => (
                                <div key={item._id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 hover:border-pink-100 transition-colors">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-gray-900 truncate">{item.title}</p>
                                            <p className="mt-0.5 text-[0.6rem] text-gray-400 capitalize">
                                                {item.type} · {item.targetAudience}
                                            </p>
                                        </div>
                                        <span className="flex-shrink-0 rounded-full bg-pink-50 px-2.5 py-1 text-[0.65rem] font-bold text-pink-600">
                                            {item.sentTo || 0} recipients
                                        </span>
                                    </div>
                                    <p className="mt-2 text-xs text-gray-600 line-clamp-2">{item.content}</p>
                                </div>
                            ))}
                            {!announcements.length && (
                                <p className="text-sm text-gray-400">No announcements have been sent yet.</p>
                            )}
                        </div>
                    </SurfaceCard>
                </div>
            </div>
        </AdminLayout>
    );
}