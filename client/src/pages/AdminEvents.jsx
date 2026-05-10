import { useEffect, useState } from "react";
import { Search, Sparkles, CheckCircle2, Slash, Star, FileSearch } from "lucide-react";
import adminService from "../services/adminService";
import AdminLayout from "../components/AdminLayout";
import { LoadingSpinner, ErrorMessage, WarningMessage, PaginationControls, StatusBadge } from "../components/AdminComponents";
import { formatDate, formatNumber, getStatusTone } from "../utils/adminUtils";
import { useToast } from "../components/ui/toast";

export default function AdminEvents() {
    const toast = useToast();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [featuredFilter, setFeaturedFilter] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ pages: 1 });

    useEffect(() => {
        fetchEvents();
    }, [search, status, featuredFilter, page]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            setError(null);
            const filters = {};
            if (search) filters.search = search;
            if (status) filters.status = status;
            if (featuredFilter) filters.featured = featuredFilter;
            const data = await adminService.getAllEvents(page, 20, filters);
            setEvents(data.events || []);
            setPagination(data.pagination || { pages: 1 });
        } catch (err) {
            console.error("Failed to load events", err);
            setError(err.response?.data?.message || "Unable to load event queue.");
        } finally {
            setLoading(false);
        }
    };

    const refresh = () => fetchEvents();

    const updateEventStatus = async (eventId, nextStatus) => {
        try {
            setLoading(true);
            await adminService[nextStatus === "approved" ? "approveEvent" : "rejectEvent"](eventId, "Review updated by admin");
            toast.success(`Event ${nextStatus} successfully.`);
            refresh();
        } catch (err) {
            setError(err.response?.data?.message || "Unable to update event status.");
        } finally {
            setLoading(false);
        }
    };

    const toggleFeatured = async (eventId) => {
        try {
            setLoading(true);
            await adminService.toggleEventFeatured(eventId);
            toast.success("Featured state updated.");
            refresh();
        } catch (err) {
            setError(err.response?.data?.message || "Unable to toggle featured status.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout title="Event Management" description="Approve, feature, and moderate events across TickiSpot.">
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-center gap-3">
                            <Search className="text-pink-500" />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search events, organizers, or categories"
                                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={refresh}
                        className="inline-flex items-center gap-2 rounded-2xl bg-pink-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-700"
                    >
                        <Sparkles size={18} />
                        Refresh
                    </button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold text-slate-400 uppercase tracking-[0.2em]">Status</p>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                        >
                            <option value="">All statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold text-slate-400 uppercase tracking-[0.2em]">Featured</p>
                        <select
                            value={featuredFilter}
                            onChange={(e) => setFeaturedFilter(e.target.value)}
                            className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                        >
                            <option value="">All events</option>
                            <option value="true">Featured only</option>
                            <option value="false">Not featured</option>
                        </select>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold text-slate-400 uppercase tracking-[0.2em]">Total events</p>
                        <p className="mt-4 text-3xl font-bold text-slate-950">{formatNumber(events.length)}</p>
                        <p className="mt-2 text-sm text-slate-500">Showing page {page} of {pagination.pages}</p>
                    </div>
                </div>

                {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

                {loading ? (
                    <LoadingSpinner />
                ) : events.length === 0 ? (
                    <WarningMessage message="No events match the current filters. Adjust status or search terms to continue." />
                ) : (
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 text-left font-semibold">Event</th>
                                    <th className="px-6 py-4 text-left font-semibold">Organizer</th>
                                    <th className="px-6 py-4 text-left font-semibold">Tickets</th>
                                    <th className="px-6 py-4 text-left font-semibold">Status</th>
                                    <th className="px-6 py-4 text-left font-semibold">Featured</th>
                                    <th className="px-6 py-4 text-left font-semibold">Created</th>
                                    <th className="px-6 py-4 text-left font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {events.map((event) => (
                                    <tr key={event._id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-slate-950">{event.title}</div>
                                            <div className="mt-1 text-xs text-slate-500">{event.category || "No category"}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-900">{event.createdBy?.name || "Unknown"}</div>
                                            <div className="mt-1 text-xs text-slate-500">{event.createdBy?.email || "No email"}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-900">{event.ticketsSold || 0}</td>
                                        <td className="px-6 py-4">
                                            <StatusBadge tone={getStatusTone(event.status)}>{event.status || "unknown"}</StatusBadge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                type="button"
                                                onClick={() => toggleFeatured(event._id)}
                                                className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition ${event.isFeatured
                                                        ? "bg-pink-50 text-pink-700 border border-pink-200"
                                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                                    }`}
                                            >
                                                <Star size={14} />
                                                {event.isFeatured ? "Featured" : "Feature"}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{formatDate(event.createdAt)}</td>
                                        <td className="px-6 py-4 space-x-2">
                                            {event.status !== "approved" && (
                                                <button
                                                    type="button"
                                                    onClick={() => updateEventStatus(event._id, "approved")}
                                                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                                                >
                                                    <CheckCircle2 size={14} />
                                                    Approve
                                                </button>
                                            )}
                                            {event.status !== "rejected" && (
                                                <button
                                                    type="button"
                                                    onClick={() => updateEventStatus(event._id, "rejected")}
                                                    className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
                                                >
                                                    <Slash size={14} />
                                                    Reject
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <PaginationControls
                    page={page}
                    pages={pagination.pages || 1}
                    total={pagination.total}
                    label="events"
                    onPrevious={() => setPage(Math.max(1, page - 1))}
                    onNext={() => setPage(Math.min(pagination.pages || 1, page + 1))}
                />
            </div>
        </AdminLayout>
    );
}
