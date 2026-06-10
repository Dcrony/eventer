import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight, Copy, MessageCircle, RefreshCw,
  Link2, TrendingUp, Users, Zap, ChevronDown,
  BarChart3, Check, Sparkles, X,
} from "lucide-react";
import WhatsAppShareModal from "./WhatsAppShareModal";
import {
  buildReferralUrl,
  generateWhatsAppCaption,
  CAPTION_TYPES,
  buildWhatsAppLink,
} from "../utils/whatsappEngine";
import { getEventReferralStats, getReferralLeaderboard } from "../services/api/referrals";

/* ─── Stat tile ──────────────────────────────────────────────────────────── */
function StatTile({ label, value, accent = false }) {
  return (
    <div
      className={`rounded-2xl p-3 flex flex-col gap-1 min-w-0 ${
        accent
          ? "bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-md shadow-pink-500/20"
          : "bg-white border border-gray-100"
      }`}
    >
      <p className={`text-[0.58rem] font-bold uppercase tracking-[0.18em] truncate ${accent ? "text-pink-100" : "text-gray-400"}`}>
        {label}
      </p>
      <p className={`text-xl sm:text-2xl font-black tabular-nums tracking-tight ${accent ? "text-white" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}

/* ─── Section label ──────────────────────────────────────────────────────── */
function SectionLabel({ icon: Icon, children }) {
  return (
    <p className="flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-gray-400 mb-2">
      {Icon && <Icon size={10} className="text-pink-400 flex-shrink-0" />}
      {children}
    </p>
  );
}

/* ─── Leaderboard row ────────────────────────────────────────────────────── */
function LeaderRow({ item, index }) {
  const badgeClass =
    index === 0 ? "bg-amber-400 text-white"
    : index === 1 ? "bg-gray-300 text-gray-700"
    : index === 2 ? "bg-orange-300 text-white"
    : "bg-gray-100 text-gray-500";

  return (
    <div className="flex items-center gap-2 sm:gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 px-3 py-2.5 min-w-0">
      <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-[0.6rem] font-black ${badgeClass}`}>
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-900 truncate">
          {item.user?.name || item.user?.username || "Anonymous"}
        </p>
        <p className="text-[0.6rem] text-gray-400 truncate">
          {item.user?.username ? `@${item.user.username}` : "Referral partner"}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-bold text-gray-900 tabular-nums">
          {item.conversions}
          <span className="text-[0.6rem] font-normal text-gray-400 ml-0.5">conv</span>
        </p>
        <p className="text-[0.6rem] font-semibold text-emerald-600 tabular-nums">
          ₦{Number(item.revenue || 0).toLocaleString("en-NG")}
        </p>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function WhatsAppSharingCenter({ events = [], currentUserId }) {
  const publishedEvents = useMemo(
    () => events.filter((e) => !e.isDraft),
    [events]
  );

  const [selectedEventId, setSelectedEventId] = useState(null);
  const [captionType, setCaptionType]         = useState(Object.values(CAPTION_TYPES)[0]);
  const [captionSeed, setCaptionSeed]         = useState(0);
  const [copiedLink, setCopiedLink]           = useState(false);
  const [copiedCaption, setCopiedCaption]     = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [stats, setStats]                     = useState(null);
  const [leaderboard, setLeaderboard]         = useState([]);
  const [modalOpen, setModalOpen]             = useState(false);
  const [analyticsOpen, setAnalyticsOpen]     = useState(false);

  const selectedEvent = useMemo(
    () =>
      publishedEvents.find((e) => e._id === selectedEventId) ||
      publishedEvents[0] ||
      null,
    [publishedEvents, selectedEventId]
  );

  useEffect(() => {
    if (!selectedEventId && publishedEvents.length > 0) {
      setSelectedEventId(publishedEvents[0]._id);
    }
  }, [publishedEvents, selectedEventId]);

  useEffect(() => {
    if (!selectedEvent) return;
    const load = async () => {
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
    load();
  }, [selectedEvent]);

  /* ── Empty state ── */
  if (!selectedEvent) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-6 sm:p-8 mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
          <MessageCircle size={22} className="text-emerald-500" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 mb-1">WhatsApp Sharing Center</h3>
        <p className="text-xs text-gray-400 max-w-xs mx-auto">
          Publish an event first to start generating referral links, captions, and sharing analytics.
        </p>
      </div>
    );
  }

  const referralUrl = buildReferralUrl(selectedEvent._id, currentUserId);
  const caption = generateWhatsAppCaption(
    selectedEvent,
    captionType,
    currentUserId
      ? btoa(`${selectedEvent._id}:${currentUserId}`).replace(/=/g, "")
      : null,
    captionSeed,
    referralUrl
  );
  const waLink = buildWhatsAppLink(caption);
  const conversionRate = stats?.conversionRate ?? 0;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2000);
    } catch { /* noop */ }
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopiedCaption(true);
      window.setTimeout(() => setCopiedCaption(false), 2000);
    } catch { /* noop */ }
  };

  const handleShareDirect = () =>
    window.open(waLink, "_blank", "noopener,noreferrer");

  /* ── Analytics panel (shown inline on lg+, as expandable drawer on mobile) ── */
  const AnalyticsPanel = () => (
    <div className="space-y-4">
      {/* Stats grid */}
      <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
        <SectionLabel icon={BarChart3}>Referral analytics</SectionLabel>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <StatTile label="Clicks"      value={loading ? "—" : (stats?.totalClicks ?? 0)} accent />
          <StatTile label="Conversions" value={loading ? "—" : (stats?.conversions ?? 0)} />
          <StatTile label="Tickets"     value={loading ? "—" : (stats?.ticketsSold ?? 0)} />
          <StatTile
            label="Revenue"
            value={loading ? "—" : `₦${Number(stats?.totalRevenue || 0).toLocaleString("en-NG")}`}
          />
        </div>

        {/* Conversion bar */}
        <div className="rounded-2xl bg-white border border-gray-100 p-3.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-gray-400">
              Conversion rate
            </p>
            <p className="text-sm font-black text-gray-900 tabular-nums">
              {loading ? "—" : `${conversionRate}%`}
            </p>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, loading ? 0 : conversionRate)}%`,
                background: "linear-gradient(90deg, #ec4899, #10b981)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel icon={Users}>Top promoters</SectionLabel>
          <span className="rounded-full bg-pink-50 px-2.5 py-1 text-[0.6rem] font-bold text-pink-600">
            Top 5
          </span>
        </div>

        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-2xl bg-gray-100 animate-pulse"
                style={{ opacity: 1 - i * 0.25 }}
              />
            ))
          ) : leaderboard.length === 0 ? (
            <div className="py-6 text-center">
              <TrendingUp size={24} className="text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No promoter activity yet.</p>
              <p className="text-[0.65rem] text-gray-300 mt-0.5">Share your link to get started.</p>
            </div>
          ) : (
            leaderboard
              .slice(0, 5)
              .map((item, index) => (
                <LeaderRow key={item._id || index} item={item} index={index} />
              ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="rounded-3xl border border-gray-100 bg-white mb-8 overflow-hidden"
      style={{ boxShadow: "0 4px 24px -6px rgba(0,0,0,0.07)" }}
    >
      {/* ── Header ── */}
      <div
        className="px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        style={{ background: "linear-gradient(135deg, #fdf2f8 0%, #f0fdf4 100%)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-2xl text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #ec4899 0%, #10b981 100%)" }}
          >
            <MessageCircle size={17} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">WhatsApp Sharing Center</h2>
            <p className="text-[0.68rem] text-gray-500 mt-0.5 hidden xs:block">
              Referral links · AI captions · Analytics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Analytics toggle (mobile only) */}
          <button
            onClick={() => setAnalyticsOpen((o) => !o)}
            className="lg:hidden inline-flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white py-2 pl-3 pr-3 text-xs font-semibold text-gray-700 shadow-sm focus:outline-none"
          >
            <BarChart3 size={13} className="text-pink-400" />
            {analyticsOpen ? "Hide" : "Analytics"}
          </button>

          {/* Event selector */}
          <div className="relative">
            <select
              value={selectedEvent._id}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="appearance-none rounded-2xl border border-gray-200 bg-white py-2.5 pl-4 pr-9 text-xs font-semibold text-gray-800 shadow-sm focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100 cursor-pointer max-w-[180px] sm:max-w-[240px] truncate"
            >
              {publishedEvents.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.title?.length > 36 ? e.title.slice(0, 36) + "…" : e.title}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">

        {/* ── Mobile analytics drawer ── */}
        {analyticsOpen && (
          <div className="lg:hidden mb-4 rounded-2xl border border-pink-100 bg-pink-50/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-700">Analytics</p>
              <button
                onClick={() => setAnalyticsOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            </div>
            <AnalyticsPanel />
          </div>
        )}

        {/* ── Two-column layout (lg+) ── */}
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">

          {/* ── Left: Link + Caption ── */}
          <div className="space-y-4">

            {/* Referral link */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
              <SectionLabel icon={Link2}>Your referral link</SectionLabel>
              <div className="flex items-center gap-2 rounded-xl border border-pink-100 bg-white px-3 py-2.5 shadow-sm min-w-0">
                <p className="flex-1 min-w-0 truncate text-[0.7rem] sm:text-xs font-medium text-gray-700">
                  {referralUrl}
                </p>
                <button
                  onClick={handleCopyLink}
                  className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[0.7rem] font-bold transition-all ${
                    copiedLink
                      ? "bg-emerald-500 text-white"
                      : "bg-pink-500 text-white hover:bg-pink-600 shadow-sm shadow-pink-500/20"
                  }`}
                >
                  {copiedLink ? <Check size={11} /> : <Copy size={11} />}
                  {copiedLink ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="mt-2 text-[0.6rem] text-gray-400 flex items-center gap-1">
                <Zap size={9} className="text-pink-400 flex-shrink-0" />
                Earn credit when friends buy tickets via your link
              </p>
            </div>

            {/* Caption generator */}
            <div className="rounded-2xl border border-gray-100 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <SectionLabel icon={Sparkles}>Generated caption</SectionLabel>
                <button
                  onClick={() => setCaptionSeed((s) => s + 1)}
                  className="flex items-center gap-1 text-[0.65rem] font-semibold text-gray-400 hover:text-pink-500 transition-colors flex-shrink-0"
                >
                  <RefreshCw size={10} /> Regenerate
                </button>
              </div>

              {/* Caption type pills — scroll on tiny screens */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {Object.entries(CAPTION_TYPES).map(([key, value]) => (
                  <button
                    key={value}
                    onClick={() => { setCaptionType(value); setCaptionSeed(0); }}
                    className={`flex-shrink-0 rounded-xl px-2.5 py-1.5 text-[0.68rem] font-semibold transition-all border ${
                      captionType === value
                        ? "bg-pink-500 text-white border-pink-500 shadow-sm shadow-pink-500/20"
                        : "bg-white text-gray-600 border-gray-200 hover:border-pink-300 hover:text-pink-500"
                    }`}
                  >
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </button>
                ))}
              </div>

              {/* Caption bubble */}
              <div className="relative rounded-2xl border border-gray-100 bg-gray-50/80 p-4 min-h-[100px]">
                <div className="absolute top-4 left-0 w-0.5 h-8 rounded-r-full bg-emerald-400" />
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap pl-2.5">
                  {caption}
                </p>
              </div>

              {/* Action buttons — stack/wrap gracefully */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleCopyCaption}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all border ${
                    copiedCaption
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "bg-white text-gray-700 border-gray-200 hover:border-pink-300 hover:text-pink-500"
                  }`}
                >
                  {copiedCaption ? <Check size={12} /> : <Copy size={12} />}
                  {copiedCaption ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white transition-all shadow-sm shadow-emerald-500/20"
                  style={{ background: "linear-gradient(135deg, #25D366, #10b981)" }}
                >
                  <MessageCircle size={12} />
                  <span className="hidden xs:inline">Share on </span>WhatsApp
                </button>
                <button
                  onClick={handleShareDirect}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:border-pink-300 hover:text-pink-500 transition-all"
                >
                  <ArrowRight size={12} />
                  <span className="hidden sm:inline">Direct </span>Share
                </button>
              </div>
            </div>
          </div>

          {/* ── Right: Analytics (hidden on mobile, visible lg+) ── */}
          <div className="hidden lg:block">
            <AnalyticsPanel />
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