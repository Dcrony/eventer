import { useEffect, useState } from "react";
import { getCreators } from "../services/api/creators";
import { getProfileImageUrl } from "../utils/eventHelpers";
import "./CSS/DiscoverCreators.css";

// ── helpers ────────────────────────────────────────────────────────────────
const fmtPts = (n) =>
  n >= 1_000 ? `${(n / 1_000).toFixed(1)}k` : String(n || 0);

const getInitials = (creator) =>
  (creator.name || creator.username || "?")
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const CATEGORIES = [
  { id: "all",       label: "All"       },
  { id: "developer", label: "Developer" },
  { id: "designer",  label: "Designer"  },
  { id: "music",     label: "Music"     },
  { id: "tech",      label: "Tech"      },
  { id: "business",  label: "Business"  },
];

const SORTS = [
  { id: "trending", label: "Trending"    },
  { id: "events",   label: "Most events" },
  { id: "newest",   label: "Newest"      },
];

// ── Lightning bolt icon (matching leaderboard screenshot) ─────────────────
function BoltIcon({ size = 14 }) {
  return (
    <svg
      className="ts-pts-icon"
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M13 2L4.09 12.96A1 1 0 005 14.5h6.5L11 22l8.91-10.96A1 1 0 0019 10H12.5L13 2z" />
    </svg>
  );
}

// ── Search icon ───────────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg className="ts-search-icon" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

// ── Arrow icon for search submit ──────────────────────────────────────────
function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

// ── Single organizer row ──────────────────────────────────────────────────
function OrganizerRow({ creator, rank }) {
  const [following, setFollowing] = useState(false);
  const [imgErr,    setImgErr]    = useState(false);
  const src = getProfileImageUrl(creator);

  // Derive a "points" value from available data
  const pts = creator.points
    ?? Math.round((creator.eventsCount || 0) * 10 + (creator.followersCount || 0) * 0.1);

  const isTop3  = rank <= 3;
  const isFeatured = creator.followersCount > 50;

  return (
    <div className="ts-row" style={{ animationDelay: `${rank * 0.04}s` }}>

      {/* Rank badge */}
      <div
        className={`ts-rank ${isTop3 ? "" : "plain"}`}
        data-rank={isTop3 ? rank : undefined}
      >
        {rank}
      </div>

      {/* Avatar */}
      <div className="ts-avatar">
        {src && !imgErr ? (
          <img
            src={src}
            alt={creator.name || creator.username}
            onError={() => setImgErr(true)}
          />
        ) : (
          getInitials(creator)
        )}
      </div>

      {/* Name + handle */}
      <div className="ts-info">
        <div className="ts-name-row">
          <span className="ts-name">{creator.name || creator.username}</span>
          {isFeatured && (
            <span className="ts-badge featured">Featured</span>
          )}
          {creator.verified && (
            <span className="ts-badge verified">✓ Pro</span>
          )}
        </div>
        <div className="ts-handle">@{creator.username}</div>
      </div>

      {/* Points */}
      <div className="ts-pts-col">
        <div className="ts-pts-top">
          <BoltIcon size={13} />
          <span className="ts-pts-val">{fmtPts(pts)}</span>
        </div>
        <span className="ts-pts-label">pts</span>
      </div>

      {/* Follow */}
      <button
        className={`ts-follow ${following ? "following" : ""}`}
        onClick={() => setFollowing((f) => !f)}
        aria-pressed={following}
      >
        {following ? "✓ Following" : "Follow"}
      </button>
    </div>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────
function SkelRow() {
  return (
    <div className="ts-skel-row">
      <div className="ts-skel" style={{ width: 30, height: 30, borderRadius: "50%" }} />
      <div className="ts-skel" style={{ width: 44, height: 44, borderRadius: 10 }} />
      <div style={{ flex: 1 }}>
        <div className="ts-skel" style={{ width: "55%", height: 13, marginBottom: 6 }} />
        <div className="ts-skel" style={{ width: "35%", height: 10 }} />
      </div>
      <div className="ts-skel" style={{ width: 36, height: 18 }} />
      <div className="ts-skel" style={{ width: 64, height: 30, borderRadius: 999 }} />
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function DiscoverCreators() {
  const [creators, setCreators] = useState([]);
  const [category, setCategory] = useState("all");
  const [sort,     setSort]     = useState("trending");
  const [search,   setSearch]   = useState("");
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        setLoading(true);
        const { data } = await getCreators({ category, sort });
        setCreators(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [category, sort]);

  const filtered = search.trim()
    ? creators.filter(
        (c) =>
          (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
          (c.username || "").toLowerCase().includes(search.toLowerCase())
      )
    : creators;

  return (
    <div className="ts-page">

      {/* ── Header ── */}
      <header className="ts-header">
        <span className="ts-eyebrow">Organizer Rankings</span>
        <h1 className="ts-title">Discover Creators<br />&amp; Organizers</h1>
        <p className="ts-subtitle">
          The top event creators ranked by community impact, events, and followers.
        </p>
      </header>

      {/* ── Controls ── */}
      <div className="ts-controls">

        {/* Search — TickiSpot style pill with pink arrow button */}
        <div className="ts-search-wrap">
          <SearchIcon />
          <input
            className="ts-search"
            type="search"
            placeholder="Search events by title, location, or category"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="ts-search-submit" aria-label="Search">
            <ArrowIcon />
          </button>
        </div>

        {/* Category pills */}
        <div className="ts-cats">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`ts-cat ${category === cat.id ? "active" : ""}`}
              onClick={() => setCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="ts-sort-row">
          <span className="ts-sort-label">Sort by</span>
          <div className="ts-sort-pills">
            {SORTS.map((s) => (
              <button
                key={s.id}
                className={`ts-sort-btn ${sort === s.id ? "active" : ""}`}
                onClick={() => setSort(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Leaderboard list ── */}
      <div className="ts-list-wrap">

        {/* List header row */}
        <div className="ts-list-head">
          <span className="ts-list-head-label">
            {category === "all" ? "All Organizers" : `${CATEGORIES.find(c => c.id === category)?.label} Organizers`}
          </span>
          {!loading && (
            <span className="ts-list-count">{filtered.length} organizers</span>
          )}
        </div>

        {/* Loading skeletons */}
        {loading && Array.from({ length: 8 }).map((_, i) => (
          <SkelRow key={i} />
        ))}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="ts-empty">
            <div className="ts-empty-icon">🔍</div>
            <h3>No organizers found</h3>
            <p>Try a different category or search term.</p>
          </div>
        )}

        {/* Rows */}
        {!loading && filtered.map((creator, i) => (
          <OrganizerRow
            key={creator._id}
            creator={creator}
            rank={i + 1}
          />
        ))}
      </div>

    </div>
  );
}