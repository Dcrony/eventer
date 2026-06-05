import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Copy, MessageCircle, BarChart3, RefreshCw, Users, Zap } from "lucide-react";
import WhatsAppShareModal from "./WhatsAppShareModal";
import { buildReferralUrl, generateWhatsAppCaption, CAPTION_TYPES, buildWhatsAppLink } from "../utils/whatsappEngine";
import { getEventReferralStats, getReferralLeaderboard } from "../services/api/referrals";

export default function WhatsAppSharingCenter({ events = [], currentUserId }) {
    const publishedEvents = useMemo(() => events.filter((event) => !event.isDraft), [events]);
    const [selectedEventId, setSelectedEventId] = useState(null);

    const [captionType, setCaptionType] = useState(Object.values(CAPTION_TYPES)[0]);
    const [captionSeed, setCaptionSeed] = useState(0);
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedCaption, setCopiedCaption] = useState(false);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);

    const selectedEvent = useMemo(
        () => publishedEvents.find((event) => event._id === selectedEventId) || publishedEvents[0] || null,
        [publishedEvents, selectedEventId],
    );

    useEffect(() => {
        if (!selectedEventId && publishedEvents.length > 0) {
            setSelectedEventId(publishedEvents[0]._id);
        }
    }, [publishedEvents, selectedEventId]);

    useEffect(() => {
         if (!selectedEvent) return;
        const loadAnalytics = async () => {
            setLoading(true);
            try {
                const [statsRes, leaderboardRes] = await Promise.all([
                    getEventReferralStats(selectedEvent._id),
                    getReferralLeaderboard(selectedEvent._id),
                ]);
                setStats(statsRes);
                setLeaderboard(leaderboardRes);
            } catch (err) {
                console.error("WhatsAppSharingCenter analytics error", err);
            } finally {
                setLoading(false);
            }
        };

        loadAnalytics();
    }, [selectedEvent]);

    if (!selectedEvent) {
        return (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">WhatsApp Sharing Center</h2>
                <p className="text-sm text-gray-500">Publish an event first to start generating referral links, captions, and sharing analytics.</p>
            </div>
        );
    }

    const referralUrl = buildReferralUrl(selectedEvent._id, currentUserId);
    const caption = generateWhatsAppCaption(selectedEvent, captionType, currentUserId ? btoa(`${selectedEvent._id}:${currentUserId}`).replace(/=/g, "") : null, captionSeed, referralUrl);
    const waLink = buildWhatsAppLink(caption);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(referralUrl);
            setCopiedLink(true);
            window.setTimeout(() => setCopiedLink(false), 2000);
        } catch {
            /* noop */
        }
    };

    const handleCopyCaption = async () => {
        try {
            await navigator.clipboard.writeText(caption);
            setCopiedCaption(true);
            window.setTimeout(() => setCopiedCaption(false), 2000);
        } catch {
            /* noop */
        }
    };

    const handleShareDirect = () => {
        window.open(waLink, "_blank", "noopener,noreferrer");
    };

    return (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 mb-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">WhatsApp Sharing Center</h2>
                    <p className="text-sm text-gray-500">Generate share captions, referral links, reminder messages, and track performance for your event.</p>
                </div>

                <select
                    value={selectedEvent._id}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="max-w-xs rounded-2xl border border-gray-200 bg-white py-3 px-4 text-sm font-medium text-gray-800 shadow-sm focus:border-pink-500 focus:outline-none"
                >
                    {publishedEvents.map((event) => (
                        <option key={event._id} value={event._id}>{event.title}</option>
                    ))}
                </select>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr] mb-6">
                <div className="space-y-4">
                    <div className="rounded-3xl border border-gray-100 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Shareable referral link</p>
                                <p className="mt-2 text-sm font-semibold text-gray-900 break-words">{referralUrl}</p>
                            </div>
                            <button
                                onClick={handleCopyLink}
                                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${copiedLink ? "bg-emerald-500 text-white" : "bg-pink-500 text-white hover:bg-pink-600"}`}
                            >
                                <Copy size={14} /> {copiedLink ? "Copied" : "Copy Link"}
                            </button>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-gray-100 p-4">
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <div>
                                <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Generated caption</p>
                                <p className="mt-1 text-sm text-gray-700">Use this WhatsApp-ready message to share directly or copy for later.</p>
                            </div>
                            <button
                                onClick={() => setCaptionSeed((seed) => seed + 1)}
                                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:border-pink-300 hover:text-pink-500"
                            >
                                <RefreshCw size={14} /> Regenerate
                            </button>
                        </div>
                        <div className="rounded-3xl bg-gray-50 p-4 text-sm leading-6 text-gray-700 whitespace-pre-wrap min-h-[120px]">{caption}</div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {Object.entries(CAPTION_TYPES).map(([key, value]) => (
                                <button
                                    key={value}
                                    onClick={() => { setCaptionType(value); setCaptionSeed(0); }}
                                    className={`rounded-full px-3 py-2 text-xs font-semibold transition ${captionType === value ? "bg-pink-500 text-white" : "bg-white text-gray-700 border border-gray-200 hover:border-pink-300 hover:text-pink-500"}`}
                                >
                                    {value.charAt(0).toUpperCase() + value.slice(1)}
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3">
                            <button
                                onClick={handleCopyCaption}
                                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${copiedCaption ? "bg-emerald-500 text-white" : "bg-white text-gray-700 border border-gray-200 hover:border-pink-300 hover:text-pink-500"}`}
                            >
                                <Copy size={16} /> {copiedCaption ? "Caption Copied" : "Copy Caption"}
                            </button>
                            <button
                                onClick={() => setModalOpen(true)}
                                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                            >
                                <MessageCircle size={16} /> Share on WhatsApp
                            </button>
                            <button
                                onClick={handleShareDirect}
                                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-pink-300 hover:text-pink-500"
                            >
                                <ArrowRight size={16} /> Direct Share
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-3xl border border-gray-100 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-gray-400 mb-4">Referral analytics</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-3xl bg-white p-3 shadow-sm">
                                <p className="text-[0.65rem] uppercase tracking-[0.24em] text-gray-400">Clicks</p>
                                <p className="mt-2 text-2xl font-semibold text-gray-900">{loading ? "..." : stats?.totalClicks ?? 0}</p>
                            </div>
                            <div className="rounded-3xl bg-white p-3 shadow-sm">
                                <p className="text-[0.65rem] uppercase tracking-[0.24em] text-gray-400">Conversions</p>
                                <p className="mt-2 text-2xl font-semibold text-gray-900">{loading ? "..." : stats?.conversions ?? 0}</p>
                            </div>
                            <div className="rounded-3xl bg-white p-3 shadow-sm">
                                <p className="text-[0.65rem] uppercase tracking-[0.24em] text-gray-400">Tickets</p>
                                <p className="mt-2 text-2xl font-semibold text-gray-900">{loading ? "..." : stats?.ticketsSold ?? 0}</p>
                            </div>
                            <div className="rounded-3xl bg-white p-3 shadow-sm">
                                <p className="text-[0.65rem] uppercase tracking-[0.24em] text-gray-400">Revenue</p>
                                <p className="mt-2 text-2xl font-semibold text-gray-900">₦{loading ? "..." : Number(stats?.totalRevenue || 0).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="mt-4 rounded-3xl bg-white p-4 border border-gray-100">
                            <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Conversion rate</p>
                            <p className="mt-2 text-lg font-semibold text-gray-900">{loading ? "..." : stats?.conversionRate ?? 0}%</p>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-gray-100 p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Top promoters</p>
                                <p className="text-sm text-gray-500">Who is driving the most referrals.</p>
                            </div>
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-[0.65rem] font-semibold text-gray-600">Top 5</span>
                        </div>
                        <div className="space-y-3">
                            {loading ? (
                                <p className="text-sm text-gray-500">Loading leaderboard...</p>
                            ) : leaderboard.length === 0 ? (
                                <p className="text-sm text-gray-500">No promoter activity yet.</p>
                            ) : (
                                leaderboard.slice(0, 5).map((item, index) => (
                                    <div key={item._id || index} className="grid grid-cols-[1fr_80px_80px] gap-3 items-center rounded-2xl bg-gray-50 p-3">
                                        <div>
                                            <p className="font-semibold text-gray-900">{item.user?.name || item.user?.username || "Anonymous"}</p>
                                            <p className="text-xs text-gray-500">{item.user?.username ? `@${item.user.username}` : "Referral partner"}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-gray-900">{item.conversions}</p>
                                            <p className="text-[0.65rem] text-gray-500">Conv.</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-gray-900">₦{Number(item.revenue || 0).toLocaleString()}</p>
                                            <p className="text-[0.65rem] text-gray-500">Revenue</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <WhatsAppShareModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                event={selectedEvent}
                currentUserId={currentUserId}
            />
        </div>
    );
}
