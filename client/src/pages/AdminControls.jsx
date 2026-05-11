import { useEffect, useState } from "react";
import { Settings, Send, Bell, Star, ToggleLeft, ToggleRight } from "lucide-react";
import adminService from "../services/adminService";
import AdminLayout from "../components/AdminLayout";
import { LoadingSpinner, ErrorMessage, SuccessMessage } from "../components/AdminComponents";

export default function AdminControls() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [announcement, setAnnouncement] = useState({
        title: "",
        content: "",
        type: "info",
        targetAudience: "all",
    });

    const sendAnnouncement = async () => {
        if (!announcement.title.trim() || !announcement.content.trim()) {
            setError("Please fill in both title and content for the announcement.");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await adminService.sendAnnouncement(announcement);
            setSuccess(response?.message || "Announcement sent successfully.");
            setAnnouncement({ title: "", content: "", type: "info", targetAudience: "all" });
        } catch (err) {
            console.error("Failed to send announcement", err);
            setError(err.response?.data?.message || "Failed to send announcement.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout title="Platform Controls" description="Manage platform settings, send announcements, and control features.">
            <div className="space-y-6">
                {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
                {success && <SuccessMessage message={success} />}

                {/* Platform Announcements */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-50 text-pink-600">
                            <Bell size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-950">Platform Announcements</h3>
                            <p className="text-sm text-slate-600">Send notifications to users across the platform</p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
                            <input
                                type="text"
                                value={announcement.title}
                                onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                                placeholder="Announcement title"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
                            <select
                                value={announcement.type}
                                onChange={(e) => setAnnouncement({ ...announcement, type: e.target.value })}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                            >
                                <option value="info">Information</option>
                                <option value="warning">Warning</option>
                                <option value="success">Success</option>
                                <option value="maintenance">Maintenance</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Content</label>
                        <textarea
                            value={announcement.content}
                            onChange={(e) => setAnnouncement({ ...announcement, content: e.target.value })}
                            placeholder="Announcement message..."
                            rows={4}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                        />
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Target Audience</label>
                        <select
                            value={announcement.targetAudience}
                            onChange={(e) => setAnnouncement({ ...announcement, targetAudience: e.target.value })}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-200 px-4 py-3 text-sm text-slate-900 outline-none"
                        >
                            <option value="all">All Users</option>
                            <option value="organizers">Organizers Only</option>
                            <option value="buyers">Buyers Only</option>
                        </select>
                    </div>

                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={sendAnnouncement}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-2xl bg-pink-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-700 disabled:opacity-50"
                        >
                            <Send size={18} />
                            Send Announcement
                        </button>
                    </div>
                </div>

                {/* Feature Toggles */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-50 text-pink-600">
                            <Settings size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-950">Feature Controls</h3>
                            <p className="text-sm text-slate-600">Toggle platform features on or off</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-950">Live Streaming</h4>
                                <p className="text-xs text-slate-600">Allow organizers to stream events live</p>
                            </div>
                            <button className="inline-flex h-6 w-11 items-center rounded-full bg-emerald-600 transition">
                                <ToggleRight className="h-5 w-5 text-white" />
                            </button>
                        </div>

                        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-950">AI Features</h4>
                                <p className="text-xs text-slate-600">Enable AI-powered event suggestions and chat</p>
                            </div>
                            <button className="inline-flex h-6 w-11 items-center rounded-full bg-emerald-600 transition">
                                <ToggleRight className="h-5 w-5 text-white" />
                            </button>
                        </div>

                        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-950">Event Analytics</h4>
                                <p className="text-xs text-slate-600">Provide detailed analytics to organizers</p>
                            </div>
                            <button className="inline-flex h-6 w-11 items-center rounded-full bg-emerald-600 transition">
                                <ToggleRight className="h-5 w-5 text-white" />
                            </button>
                        </div>

                        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-950">Public Registration</h4>
                                <p className="text-xs text-slate-600">Allow new users to register accounts</p>
                            </div>
                            <button className="inline-flex h-6 w-11 items-center rounded-full bg-emerald-600 transition">
                                <ToggleRight className="h-5 w-5 text-white" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Homepage Featured Events */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-50 text-pink-600">
                            <Star size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-950">Homepage Features</h3>
                            <p className="text-sm text-slate-600">Manage featured events on the homepage</p>
                        </div>
                    </div>

                    <div className="text-center py-12">
                        <Star className="mx-auto h-12 w-12 text-slate-400" />
                        <h4 className="mt-4 text-sm font-semibold text-slate-900">Featured Events Management</h4>
                        <p className="mt-2 text-sm text-slate-500">Select events to feature on the homepage carousel.</p>
                        <button className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-pink-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-700">
                            Manage Featured Events
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}