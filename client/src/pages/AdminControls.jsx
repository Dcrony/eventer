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
            <div className="space-y-5">
                {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
                {success && <SuccessMessage message={success} />}

                {/* Platform Announcements */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-pink-50 text-pink-500">
                            <Bell size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-gray-900">Platform Announcements</h3>
                            <p className="text-xs text-gray-500">Send notifications to users across the platform</p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Title</label>
                            <input
                                type="text"
                                value={announcement.title}
                                onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                                placeholder="Announcement title"
                                className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Type</label>
                            <select
                                value={announcement.type}
                                onChange={(e) => setAnnouncement({ ...announcement, type: e.target.value })}
                                className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                            >
                                <option value="info">Information</option>
                                <option value="warning">Warning</option>
                                <option value="success">Success</option>
                                <option value="maintenance">Maintenance</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Content</label>
                        <textarea
                            value={announcement.content}
                            onChange={(e) => setAnnouncement({ ...announcement, content: e.target.value })}
                            placeholder="Announcement message..."
                            rows={4}
                            className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 resize-none"
                        />
                    </div>

                    <div className="mt-4">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Target Audience</label>
                        <select
                            value={announcement.targetAudience}
                            onChange={(e) => setAnnouncement({ ...announcement, targetAudience: e.target.value })}
                            className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                        >
                            <option value="all">All Users</option>
                            <option value="organizers">Organizers Only</option>
                            <option value="buyers">Buyers Only</option>
                        </select>
                    </div>

                    <div className="mt-5">
                        <button
                            type="button"
                            onClick={sendAnnouncement}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-full bg-pink-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 disabled:opacity-50"
                        >
                            <Send size={16} />
                            Send Announcement
                        </button>
                    </div>
                </div>

                {/* Feature Toggles */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-pink-50 text-pink-500">
                            <Settings size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-gray-900">Feature Controls</h3>
                            <p className="text-xs text-gray-500">Toggle platform features on or off</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <div>
                                <h4 className="text-sm font-bold text-gray-900">Live Streaming</h4>
                                <p className="text-xs text-gray-500">Allow organizers to stream events live</p>
                            </div>
                            <button className="relative w-11 h-6 rounded-full bg-emerald-500 transition-all duration-200">
                                <span className="absolute right-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow-sm" />
                            </button>
                        </div>

                        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <div>
                                <h4 className="text-sm font-bold text-gray-900">AI Features</h4>
                                <p className="text-xs text-gray-500">Enable AI-powered event suggestions and chat</p>
                            </div>
                            <button className="relative w-11 h-6 rounded-full bg-emerald-500 transition-all duration-200">
                                <span className="absolute right-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow-sm" />
                            </button>
                        </div>

                        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <div>
                                <h4 className="text-sm font-bold text-gray-900">Event Analytics</h4>
                                <p className="text-xs text-gray-500">Provide detailed analytics to organizers</p>
                            </div>
                            <button className="relative w-11 h-6 rounded-full bg-emerald-500 transition-all duration-200">
                                <span className="absolute right-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow-sm" />
                            </button>
                        </div>

                        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <div>
                                <h4 className="text-sm font-bold text-gray-900">Public Registration</h4>
                                <p className="text-xs text-gray-500">Allow new users to register accounts</p>
                            </div>
                            <button className="relative w-11 h-6 rounded-full bg-emerald-500 transition-all duration-200">
                                <span className="absolute right-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow-sm" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Homepage Featured Events */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-pink-50 text-pink-500">
                            <Star size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-gray-900">Homepage Features</h3>
                            <p className="text-xs text-gray-500">Manage featured events on the homepage</p>
                        </div>
                    </div>

                    <div className="text-center py-10">
                        <Star className="mx-auto h-10 w-10 text-gray-300" />
                        <h4 className="mt-3 text-sm font-bold text-gray-900">Featured Events Management</h4>
                        <p className="mt-1 text-xs text-gray-500">Select events to feature on the homepage carousel.</p>
                        <button className="mt-4 inline-flex items-center gap-2 rounded-full bg-pink-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5">
                            Manage Featured Events
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}