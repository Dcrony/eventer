import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Users,
    Play,
    MapPin,
    Search,
    Video,
    Radio,
    Sparkles,
    X,
    ChevronDown,
    RotateCw,
    Settings,
    Eye,
} from "lucide-react";
import useProfileNavigation from "../hooks/useProfileNavigation";
import API from "../api/axios";
import GoLiveModal from "./GoLiveModal";
import { getEventImageUrl, getProfileImageUrl } from "../utils/eventHelpers";
import Avatar from "./ui/avatar";
import useFeatureAccess from "../hooks/useFeatureAccess";
import { promptUpgrade } from "../utils/planAccess";

const SORT_OPTIONS = [
    { value: "recent", label: "Recently live" },
    { value: "viewers", label: "Most viewers" },
    { value: "title", label: "Title A–Z" },
];

function getViewerCount(event) {
    return typeof event.liveStream?.viewerCount === "number"
        ? event.liveStream.viewerCount
        : 0;
}

export default function LiveEvent() {
    const { hasAccess: canAccessLiveStreaming, promptUpgrade: promptUpgradeLive } = useFeatureAccess("live_stream");
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("recent");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [locationFilter, setLocationFilter] = useState("");
    const [isGoLiveOpen, setIsGoLiveOpen] = useState(false);
    const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
    const goLiveBtnRef = useRef(null);
    const sortWrapRef = useRef(null);
    const navigate = useNavigate();
    const { toProfile } = useProfileNavigation();

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (sortWrapRef.current && !sortWrapRef.current.contains(e.target)) {
                setSortDropdownOpen(false);
            }
        };
        if (sortDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [sortDropdownOpen]);

    const isLoggedIn = typeof window !== "undefined" && !!localStorage.getItem("user");
    const user = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "null");
        } catch {
            return null;
        }
    }, []);
    const currentUserId = user?.id || user?._id;

    const fetchEvents = useCallback(() => {
        setError(null);
        setLoading(true);
        API.get("/events?liveOnly=true")
            .then((res) => {
                setEvents(res.data || []);
                setLoading(false);
            })
            .catch(() => {
                setError("Failed to load live streams. Please try again.");
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState === "visible") {
                API.get("/events?liveOnly=true")
                    .then((res) => setEvents(res.data || []))
                    .catch(() => { });
            }
        }, 50000);
        return () => clearInterval(interval);
    }, []);

    const myLiveEvent = useMemo(() => {
        if (!currentUserId || !events?.length) return null;
        return events.find((e) => {
            const ownerId = typeof e.createdBy === "string"
                ? e.createdBy
                : e.createdBy?._id || e.createdBy?.id;
            return e.liveStream?.isLive && ownerId === currentUserId;
        }) || null;
    }, [currentUserId, events]);

    const liveEventsBase = useMemo(() => {
        return (events || []).filter(
            (e) =>
                e.liveStream?.isLive &&
                (e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    e.createdBy?.username?.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [events, searchQuery]);

    const categories = useMemo(() => {
        const set = new Set();
        liveEventsBase.forEach((e) => e.category && set.add(e.category));
        return Array.from(set).sort();
    }, [liveEventsBase]);

    const locations = useMemo(() => {
        const set = new Set();
        liveEventsBase.forEach((e) => e.location && set.add(e.location));
        return Array.from(set).sort();
    }, [liveEventsBase]);

    const liveEvents = useMemo(() => {
        let list = liveEventsBase.filter((e) => {
            if (categoryFilter && e.category !== categoryFilter) return false;
            if (locationFilter && e.location !== locationFilter) return false;
            return true;
        });
        if (sortBy === "viewers") {
            list = [...list].sort((a, b) => getViewerCount(b) - getViewerCount(a));
        } else if (sortBy === "title") {
            list = [...list].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        } else {
            list = [...list].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }
        return list;
    }, [liveEventsBase, categoryFilter, locationFilter, sortBy]);

    const isSearchEmpty = searchQuery.trim() !== "" && liveEvents.length === 0 && !loading && !error;
    const isGenericEmpty = !loading && !error && liveEvents.length === 0 && searchQuery.trim() === "" && !categoryFilter && !locationFilter;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/20 font-geist pt-8 sm:px-6 lg:px-8 py-2 sm:py-12 pb-20 ">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div>
                            <h1 className="flex items-center gap-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500" />
                                </span>
                                Live Now
                            </h1>
                            <p className="text-sm text-gray-500 mt-2">
                                {!loading && !error && liveEvents.length > 0
                                    ? `${liveEvents.length} stream${liveEvents.length === 1 ? "" : "s"} live now`
                                    : "Watch streams in real time and connect with organizers"}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {/* Search */}
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="search"
                                    placeholder="Search live streams..."
                                    className="w-64 pl-9 pr-4 py-2 rounded-full border-2 border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    aria-label="Search live streams"
                                />
                            </div>

                            {/* Sort Dropdown */}
                            <div className="relative" ref={sortWrapRef}>
                                <button
                                    type="button"
                                    onClick={() => setSortDropdownOpen((o) => !o)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-gray-200 bg-white text-sm font-semibold text-gray-700 transition-all duration-200 hover:border-pink-300 hover:text-pink-500"
                                    aria-expanded={sortDropdownOpen}
                                >
                                    {SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Sort"}
                                    <ChevronDown size={14} className={`transition-transform duration-200 ${sortDropdownOpen ? "rotate-180" : ""}`} />
                                </button>
                                {sortDropdownOpen && (
                                    <ul className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-10 animate-fade-in">
                                        {SORT_OPTIONS.map((opt) => (
                                            <li
                                                key={opt.value}
                                                onClick={() => {
                                                    setSortBy(opt.value);
                                                    setSortDropdownOpen(false);
                                                }}
                                                className={`px-4 py-2 text-sm cursor-pointer transition-colors duration-200 ${
                                                    sortBy === opt.value
                                                        ? "bg-pink-50 text-pink-600 font-semibold"
                                                        : "text-gray-700 hover:bg-gray-50"
                                                }`}
                                            >
                                                {opt.label}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Go Live Button */}
                            {isLoggedIn && (
                                <button
                                    ref={goLiveBtnRef}
                                    type="button"
                                    onClick={() => {
                                        if (!canAccessLiveStreaming) {
                                            promptUpgradeLive();
                                            return;
                                        }
                                        setIsGoLiveOpen(true);
                                    }}
                                    className="flex items-center gap-2 px-5 py-2 rounded-full bg-pink-500 text-white text-sm font-semibold transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 shadow-md shadow-pink-500/25"
                                >
                                    <Video size={16} />
                                    Go Live
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                {/* Filters */}
                {(categories.length > 0 || locations.length > 0) && !loading && !error && (
                    <div className="flex flex-wrap gap-2 mb-6 pb-2 overflow-x-auto scrollbar-hide">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setCategoryFilter((c) => (c === cat ? "" : cat))}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                                    categoryFilter === cat
                                        ? "bg-pink-500 text-white shadow-sm"
                                        : "bg-gray-100 text-gray-600 hover:bg-pink-100 hover:text-pink-600"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                        {locations.map((loc) => (
                            <button
                                key={loc}
                                type="button"
                                onClick={() => setLocationFilter((l) => (l === loc ? "" : loc))}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                                    locationFilter === loc
                                        ? "bg-pink-500 text-white shadow-sm"
                                        : "bg-gray-100 text-gray-600 hover:bg-pink-100 hover:text-pink-600"
                                }`}
                            >
                                <MapPin size={10} />
                                {loc}
                            </button>
                        ))}
                    </div>
                )}

                {/* Your Live Event Banner */}
                {myLiveEvent && (
                    <div className="mb-6  rounded-xl bg-gradient-to-r from-pink-400 via-pink-400 to-pink-400 text-white p-4 shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/20 text-xs font-bold">
                                    <Radio size={12} />
                                    You're live
                                </div>
                                <h2 className="text-sm font-bold truncate">{myLiveEvent.title}</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate(`/live/${myLiveEvent._id}`)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 text-sm font-semibold hover:bg-white/30 transition-all"
                            >
                                <Settings size={14} />
                                Manage stream
                            </button>
                        </div>
                    </div>
                )}

                {/* Content */}
                <section className="min-h-[400px]">
                    {/* Error State */}
                    {error && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                                <RotateCw size={32} className="text-red-400" />
                            </div>
                            <p className="text-sm text-gray-600 mb-4">{error}</p>
                            <button
                                type="button"
                                onClick={fetchEvents}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500 text-white text-sm font-semibold transition-all hover:bg-pink-600"
                            >
                                <RotateCw size={14} />
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Loading Skeletons */}
                    {loading && !error && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                                    <div className="aspect-video bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer" />
                                    <div className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 w-3/4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer rounded" />
                                                <div className="h-2 w-1/2 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer rounded" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Search Empty State */}
                    {!loading && !error && isSearchEmpty && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                <Search size={40} className="text-gray-400" strokeWidth={1.5} />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 mb-2">No streams match "{searchQuery}"</h2>
                            <p className="text-sm text-gray-500 mb-4">Try a different search or clear filters.</p>
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery("");
                                    setCategoryFilter("");
                                    setLocationFilter("");
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-gray-200 bg-white text-gray-600 text-sm font-semibold hover:border-pink-300 hover:text-pink-500 transition-all"
                            >
                                <X size={16} />
                                Clear search
                            </button>
                        </div>
                    )}

                    {/* Generic Empty State */}
                    {!loading && !error && isGenericEmpty && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                <Radio size={40} className="text-gray-400" strokeWidth={1.5} />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 mb-2">No live streams right now</h2>
                            <p className="text-sm text-gray-500 mb-4">Be the first to go live or check back soon.</p>
                            {isLoggedIn && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!canAccessLiveStreaming) {
                                            promptUpgradeLive();
                                            return;
                                        }
                                        setIsGoLiveOpen(true);
                                    }}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-pink-500 text-white text-sm font-semibold transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 shadow-md shadow-pink-500/25"
                                >
                                    <Sparkles size={16} />
                                    Go Live
                                </button>
                            )}
                        </div>
                    )}

                    {/* Live Events Grid */}
                    {!loading && !error && liveEvents.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {liveEvents.map((event) => (
                                <article
                                    key={event._id}
                                    onClick={() => navigate(`/live/${event._id}`)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            navigate(`/live/${event._id}`);
                                        }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:border-pink-200/40"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                                        {getEventImageUrl(event) ? (
                                            <img
                                                src={getEventImageUrl(event)}
                                                alt={event.title || "Event thumbnail"}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Play size={36} className="text-white/30" strokeWidth={1.5} />
                                            </div>
                                        )}
                                        {/* LIVE Badge */}
                                        <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-md bg-red-500 text-white text-[0.6rem] font-extrabold uppercase tracking-wide shadow-lg shadow-red-500/30">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                            LIVE
                                        </span>
                                        {/* Viewers Count */}
                                        <span className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-xs font-semibold">
                                            <Users size={10} />
                                            {typeof event.liveStream?.viewerCount === "number"
                                                ? event.liveStream.viewerCount
                                                : "—"}
                                        </span>
                                    </div>

                                    {/* Body */}
                                    <div className="p-4">
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toProfile(event.createdBy);
                                            }}
                                            className="flex items-start gap-3 cursor-pointer"
                                        >
                                            <Avatar
                                                src={getProfileImageUrl(event.createdBy)}
                                                name={event.createdBy?.username || event.createdBy?.name || "Organizer"}
                                                className="w-10 h-10 rounded-lg flex-shrink-0"
                                                alt=""
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-bold text-gray-900 line-clamp-1">
                                                    {event.title}
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {event.createdBy?.username || "Organizer"}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                    {event.category && (
                                                        <span className="text-[0.6rem] font-semibold text-pink-500 bg-pink-50 px-1.5 py-0.5 rounded">
                                                            {event.category}
                                                        </span>
                                                    )}
                                                    {event.location && (
                                                        <span className="inline-flex items-center gap-0.5 text-[0.6rem] text-gray-500">
                                                            <MapPin size={9} />
                                                            {event.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Go Live Modal */}
            <GoLiveModal
                isOpen={isGoLiveOpen}
                onClose={() => {
                    setIsGoLiveOpen(false);
                    goLiveBtnRef.current?.focus();
                }}
                onStreamStarted={(eventId) => navigate(`/live/${eventId}`)}
                focusReturnRef={goLiveBtnRef}
            />

            <style jsx>{`
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(1.05); }
                }
                .animate-shimmer {
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .line-clamp-1 {
                    display: -webkit-box;
                    -webkit-line-clamp: 1;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
}