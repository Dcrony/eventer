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
    const [pagination, setPagination] = useState({ pages: 1, total: 0 });

    useEffect(() => { fetchEvents(); }, [search, status, featuredFilter, page]);

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
            setPagination(data.pagination || { pages: 1, total: 0 });
        } catch (err) {
            setError(err.response?.data?.message || "Unable to load event queue.");
        } finally {
            setLoading(false);
        }
    };

    const updateEventStatus = async (eventId, nextStatus) => {
        try {
            setLoading(true);
            if (nextStatus === "approved") {
                await adminService.approveEvent(eventId, "Review updated by admin");
            } else if (nextStatus === "rejected") {
                await adminService.rejectEvent(eventId, "Review updated by admin");
            } else {
                await adminService.updateEventStatus(eventId, nextStatus, "Review updated by admin");
            }
            toast.success(`Event ${nextStatus} successfully.`);
            fetchEvents();
        } catch (err) {
            setError(err.response?.data?.message || "Unable to update event status.");
        } finally {
            setLoading(false);
        }
    };

    const toggleFeatured = async (eventId) => {
        try {
            await adminService.toggleEventFeatured(eventId);
            toast.success("Featured state updated.");
            fetchEvents();
        } catch (err) {
            setError(err.response?.data?.message || "Unable to toggle featured status.");
        }
    };

    return (
        <AdminLayout title="Event Management" description="Approve, feature, and moderate events across TickiSpot.">
            <div className="space-y-5">
                {/* Search + controls */}
                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="flex flex-1 items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm focus-within:border-pink-300 focus-within:ring-2 focus-within:ring-pink-50 transition-all">
                        <Search size={15} className="text-pink-400 flex-shrink-0" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search events, organizers, or categories"
                            className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-300"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={fetchEvents}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-pink-500 px-5 py-3 text-xs font-bold text-white shadow-sm hover:bg-pink-600 transition-colors"
                    >
                        <Sparkles size={14} />
                        Refresh
                    </button>
                </div>

                {/* Filters */}
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                        <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">Status</p>
                        <select
                            value={status}
                            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                            className="mt-3 w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs font-medium text-gray-700 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-50"
                        >
                            <option value="">All statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                        <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">Featured</p>
                        <select
                            value={featuredFilter}
                            onChange={(e) => { setFeaturedFilter(e.target.value); setPage(1); }}
                            className="mt-3 w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs font-medium text-gray-700 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-50"
                        >
                            <option value="">All events</option>
                            <option value="true">Featured only</option>
                            <option value="false">Not featured</option>
                        </select>
                    </div>
                    <div className="relative rounded-2xl border border-gray-100 bg-white p-4 shadow-sm overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-pink-500" />
                        <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">Total events</p>
                        <p className="mt-2 text-2xl font-black text-gray-900 tabular-nums">{formatNumber(events.length)}</p>
                        <p className="mt-1 text-xs text-gray-400">Page {page} of {pagination.pages}</p>
                    </div>
                </div>

                {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

                {loading ? (
                    <LoadingSpinner />
                ) : events.length === 0 ? (
                    <WarningMessage message="No events match the current filters. Adjust status or search terms to continue." />
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-50 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {["Event", "Organizer", "Tickets", "Status", "Featured", "Created", "Actions"].map((col) => (
                                            <th key={col} className="px-4 py-3.5 text-left text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">{col}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 bg-white">
                                    {events.map((event) => (
                                        <tr key={event._id} className="hover:bg-pink-50/20 transition-colors">
                                            <td className="px-4 py-4">
                                                <div className="text-xs font-bold text-gray-900 truncate max-w-[160px]">{event.title}</div>
                                                <div className="mt-0.5 text-[0.58rem] text-gray-400">{event.category || "No category"}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="text-xs font-semibold text-gray-800">{event.createdBy?.name || "Unknown"}</div>
                                                <div className="mt-0.5 text-[0.58rem] text-gray-400">{event.createdBy?.email || "No email"}</div>
                                            </td>
                                            <td className="px-4 py-4 text-xs font-semibold text-gray-700 tabular-nums">{event.ticketsSold || 0}</td>
                                            <td className="px-4 py-4">
                                                <StatusBadge tone={getStatusTone(event.status)}>{event.status || "unknown"}</StatusBadge>
                                            </td>
                                            <td className="px-4 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleFeatured(event._id)}
                                                    className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[0.63rem] font-bold transition-all ${
                                                        event.isFeatured
                                                            ? "bg-pink-50 text-pink-600 border border-pink-200 hover:bg-pink-100"
                                                            : "bg-gray-50 text-gray-500 border border-gray-100 hover:bg-pink-50 hover:text-pink-500 hover:border-pink-200"
                                                    }`}
                                                >
                                                    <Star size={11} className={event.isFeatured ? "fill-pink-500 text-pink-500" : ""} />
                                                    {event.isFeatured ? "Featured" : "Feature"}
                                                </button>
                                            </td>
                                            <td className="px-4 py-4 text-xs text-gray-400">{formatDate(event.createdAt)}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {event.status !== "approved" && (
                                                        <button
                                                            type="button"
                                                            onClick={() => updateEventStatus(event._id, "approved")}
                                                            className="inline-flex items-center gap-1 rounded-xl bg-green-500 px-2.5 py-1.5 text-[0.63rem] font-bold text-white hover:bg-green-600 transition-colors"
                                                        >
                                                            <CheckCircle2 size={11} />
                                                            Approve
                                                        </button>
                                                    )}
                                                    {event.status !== "rejected" && (
                                                        <button
                                                            type="button"
                                                            onClick={() => updateEventStatus(event._id, "rejected")}
                                                            className="inline-flex items-center gap-1 rounded-xl bg-red-500 px-2.5 py-1.5 text-[0.63rem] font-bold text-white hover:bg-red-600 transition-colors"
                                                        >
                                                            <Slash size={11} />
                                                            Reject
                                                        </button>
                                                    )}
                                                    {event.status !== "suspended" && (
                                                        <button
                                                            type="button"
                                                            onClick={() => updateEventStatus(event._id, "suspended")}
                                                            className="inline-flex items-center gap-1 rounded-xl bg-amber-500 px-2.5 py-1.5 text-[0.63rem] font-bold text-white hover:bg-amber-600 transition-colors"
                                                        >
                                                            <FileSearch size={11} />
                                                            Suspend
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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