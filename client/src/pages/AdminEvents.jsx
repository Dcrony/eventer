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
            <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap items-center gap-2">
                            <Search className="text-pink-500" size={18} />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search events, organizers, or categories"
                                className="min-w-0 flex-1 rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={refresh}
                        className="inline-flex items-center gap-2 rounded-full bg-pink-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5"
                    >
                        <Sparkles size={16} />
                        Refresh
                    </button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Status</p>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="mt-3 w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                        >
                            <option value="">All statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Featured</p>
                        <select
                            value={featuredFilter}
                            onChange={(e) => setFeaturedFilter(e.target.value)}
                            className="mt-3 w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                        >
                            <option value="">All events</option>
                            <option value="true">Featured only</option>
                            <option value="false">Not featured</option>
                        </select>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total events</p>
                        <p className="mt-3 text-2xl font-extrabold text-gray-900">{formatNumber(events.length)}</p>
                        <p className="mt-1 text-xs text-gray-500">Showing page {page} of {pagination.pages}</p>
                    </div>
                </div>

                {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

                {loading ? (
                    <LoadingSpinner />
                ) : events.length === 0 ? (
                    <WarningMessage message="No events match the current filters. Adjust status or search terms to continue." />
                ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Event</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Organizer</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Tickets</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Featured</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Created</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {events.map((event) => (
                                    <tr key={event._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-semibold text-gray-900">{event.title}</div>
                                            <div className="mt-0.5 text-xs text-gray-500">{event.category || "No category"}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-gray-800">{event.createdBy?.name || "Unknown"}</div>
                                            <div className="mt-0.5 text-xs text-gray-500">{event.createdBy?.email || "No email"}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{event.ticketsSold || 0}</td>
                                        <td className="px-4 py-3">
                                            <StatusBadge tone={getStatusTone(event.status)}>{event.status || "unknown"}</StatusBadge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={() => toggleFeatured(event._id)}
                                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all duration-200 ${
                                                    event.isFeatured
                                                        ? "bg-pink-50 text-pink-600 border border-pink-200"
                                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                }`}
                                            >
                                                <Star size={12} />
                                                {event.isFeatured ? "Featured" : "Feature"}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(event.createdAt)}</td>
                                        <td className="px-4 py-3 space-x-2">
                                            {event.status !== "approved" && (
                                                <button
                                                    type="button"
                                                    onClick={() => updateEventStatus(event._id, "approved")}
                                                    className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:bg-green-700"
                                                >
                                                    <CheckCircle2 size={12} />
                                                    Approve
                                                </button>
                                            )}
                                            {event.status !== "rejected" && (
                                                <button
                                                    type="button"
                                                    onClick={() => updateEventStatus(event._id, "rejected")}
                                                    className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:bg-red-600"
                                                >
                                                    <Slash size={12} />
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