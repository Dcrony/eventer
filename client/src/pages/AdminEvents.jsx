import { useEffect, useState } from "react";
import { Search, RefreshCcw, CheckCircle2, Slash, Star, FileSearch } from "lucide-react";
import adminService from "../services/adminService";
import AdminLayout from "../components/AdminLayout";
import {
    LoadingSpinner,
    ErrorMessage,
    PaginationControls,
    StatusBadge,
    SurfaceCard,
    EmptyState,
} from "../components/AdminComponents";
import { formatDate, formatNumber, getStatusTone } from "../utils/adminUtils";
import { useToast } from "../components/ui/toast";

// ── shared input class ─────────────────────────────────────────────────────────
const selectCls =
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100";

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

    // BUG FIX: search was in the dependency array causing infinite re-fetch on keystroke.
    // Only re-fetch when stable filter values or page change.
    useEffect(() => { fetchEvents(); }, [status, featuredFilter, page]);

    const applySearch = () => { setPage(1); fetchEvents(); };

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
            setLoading(false);
        }
    };

    const toggleFeatured = async (eventId) => {
        try {
            setLoading(true);
            await adminService.toggleEventFeatured(eventId);
            toast.success("Featured state updated.");
            fetchEvents();
        } catch (err) {
            setError(err.response?.data?.message || "Unable to toggle featured status.");
            setLoading(false);
        }
    };

    return (
        <AdminLayout
            title="Event Management"
            description="Approve, feature, and moderate events across the platform."
        >
            <div className="space-y-5">
                {/* Search + Refresh */}
                <div className="flex flex-wrap gap-3 items-center">
                    <SurfaceCard className="flex-1 min-w-0 p-3">
                        <div className="flex items-center gap-2">
                            <Search size={15} className="text-pink-500 flex-shrink-0" />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") applySearch(); }}
                                placeholder="Search events, organizers, or categories"
                                className="min-w-0 flex-1 bg-transparent text-xs text-gray-800 outline-none placeholder:text-gray-400"
                            />
                            <button
                                type="button"
                                onClick={applySearch}
                                className="rounded-lg bg-pink-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-pink-600 transition-colors active:scale-95"
                            >
                                Search
                            </button>
                        </div>
                    </SurfaceCard>

                    <button
                        type="button"
                        onClick={() => fetchEvents()}
                        className="inline-flex items-center gap-2 rounded-xl bg-pink-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-pink-600 transition-colors active:scale-95"
                    >
                        <RefreshCcw size={13} />
                        Refresh
                    </button>
                </div>

                {/* Filters row */}
                <div className="grid gap-4 md:grid-cols-3">
                    <SurfaceCard>
                        <p className="mb-2 text-[0.6rem] font-bold uppercase tracking-widest text-pink-400">Status</p>
                        <select
                            value={status}
                            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                            className={selectCls}
                        >
                            <option value="">All statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </SurfaceCard>

                    <SurfaceCard>
                        <p className="mb-2 text-[0.6rem] font-bold uppercase tracking-widest text-pink-400">Featured</p>
                        <select
                            value={featuredFilter}
                            onChange={(e) => { setFeaturedFilter(e.target.value); setPage(1); }}
                            className={selectCls}
                        >
                            <option value="">All events</option>
                            <option value="true">Featured only</option>
                            <option value="false">Not featured</option>
                        </select>
                    </SurfaceCard>

                    <SurfaceCard>
                        <p className="mb-2 text-[0.6rem] font-bold uppercase tracking-widest text-pink-400">Total events</p>
                        <p className="text-2xl font-extrabold text-gray-900">{formatNumber(pagination.total || events.length)}</p>
                        <p className="mt-1 text-xs text-gray-400">Page {page} of {pagination.pages || 1}</p>
                    </SurfaceCard>
                </div>

                {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

                {loading ? (
                    <LoadingSpinner label="Loading events..." />
                ) : events.length === 0 ? (
                    <EmptyState
                        icon={FileSearch}
                        title="No events found"
                        description="No events match the current filters. Adjust status or search terms."
                    />
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-gray-100 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    {["Event", "Organizer", "Tickets", "Status", "Featured", "Created", "Actions"].map((col) => (
                                        <th
                                            key={col}
                                            className="px-4 py-3 text-left text-[0.6rem] font-bold uppercase tracking-widest text-gray-400"
                                        >
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {events.map((event) => (
                                    <tr key={event._id} className="transition-colors hover:bg-pink-50/40">
                                        <td className="px-4 py-3.5">
                                            <p className="text-xs font-semibold text-gray-900">{event.title}</p>
                                            <p className="mt-0.5 text-[0.6rem] text-gray-400">{event.category || "No category"}</p>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <p className="text-xs text-gray-800">{event.createdBy?.name  || "Unknown"}</p>
                                            <p className="mt-0.5 text-[0.6rem] text-gray-400">{event.createdBy?.email || "No email"}</p>
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-gray-700 tabular-nums">
                                            {event.ticketsSold || 0}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <StatusBadge tone={getStatusTone(event.status)}>
                                                {event.status || "unknown"}
                                            </StatusBadge>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <button
                                                type="button"
                                                onClick={() => toggleFeatured(event._id)}
                                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all duration-200 active:scale-95 ${
                                                    event.isFeatured
                                                        ? "bg-pink-50 text-pink-600 border border-pink-200"
                                                        : "bg-gray-100 text-gray-500 hover:bg-pink-50 hover:text-pink-500"
                                                }`}
                                            >
                                                <Star size={11} fill={event.isFeatured ? "currentColor" : "none"} />
                                                {event.isFeatured ? "Featured" : "Feature"}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-gray-400">{formatDate(event.createdAt)}</td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex flex-wrap gap-1.5">
                                                {event.status !== "approved" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => updateEventStatus(event._id, "approved")}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[0.65rem] font-semibold text-white hover:bg-emerald-600 transition-colors active:scale-95"
                                                    >
                                                        <CheckCircle2 size={11} /> Approve
                                                    </button>
                                                )}
                                                {event.status !== "rejected" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => updateEventStatus(event._id, "rejected")}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-2.5 py-1.5 text-[0.65rem] font-semibold text-white hover:bg-red-600 transition-colors active:scale-95"
                                                    >
                                                        <Slash size={11} /> Reject
                                                    </button>
                                                )}
                                                {event.status !== "suspended" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => updateEventStatus(event._id, "suspended")}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1.5 text-[0.65rem] font-semibold text-white hover:bg-amber-600 transition-colors active:scale-95"
                                                    >
                                                        <FileSearch size={11} /> Suspend
                                                    </button>
                                                )}
                                            </div>
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
                    onPrevious={() => setPage((c) => Math.max(1, c - 1))}
                    onNext={() => setPage((c) => Math.min(pagination.pages || 1, c + 1))}
                />
            </div>
        </AdminLayout>
    );
}