import { useEffect, useState } from "react";
import { getCreators } from "../services/api/creators";
import { getProfileImageUrl } from "../utils/eventHelpers";
import "./discovercreators.css";

// ── helpers ────────────────────────────────────────────────────────────────
const fmt = (n) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `${(n / 1_000).toFixed(1)}k`
  : String(n || 0);

const initials = (creator) =>
  (creator.name || creator.username || "?")
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const CATEGORIES = [
  { id: "all",       label: "All",    emoji: "🌐" },
  { id: "developer", label: "Dev",    emoji: "💻" },
  { id: "designer",  label: "Design", emoji: "🎨" },
  { id: "music",     label: "Music",  emoji: "🎵" },
  { id: "tech",      label: "Tech",   emoji: "🚀" },
  { id: "business",  label: "Biz",    emoji: "📊" },
];

const SORTS = [
  { id: "trending", label: "🔥 Trending" },
  { id: "events",   label: "📅 Events"   },
  { id: "newest",   label: "✨ Newest"   },
];

const CROWN = ["👑", "🥈", "🥉"];

// ── Podium card (top 3) ───────────────────────────────────────────────────
function PodiumSlot({ creator, rank }) {
  const [following, setFollowing] = useState(false);
  const [imgErr,    setImgErr]    = useState(false);
  const src = getProfileImageUrl(creator);
  const pct = Math.min(100, Math.round(((creator.followersCount || 0) / 10_000) * 100));

  return (
    <div className="lb-podium-slot" data-rank={rank}>
      <div className="lb-podium-crown">{CROWN[rank - 1]}</div>

      <div className="lb-podium-avatar">
        {src && !imgErr
          ? <img src={src} alt="" onError={() => setImgErr(true)} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : <span>{initials(creator)}</span>
        }
        <span className="lb-podium-rank-badge">#{rank}</span>
      </div>

      <p className="lb-podium-name">{creator.name || creator.username}</p>
      <p className="lb-podium-handle">@{creator.username}</p>

      <div className="lb-podium-stats">
        <div>
          <span className="lb-podium-stat-val">{fmt(creator.eventsCount)}</span>
          <span className="lb-podium-stat-lbl">Events</span>
        </div>
        <div>
          <span className="lb-podium-stat-val">{fmt(creator.followersCount)}</span>
          <span className="lb-podium-stat-lbl">Followers</span>
        </div>
      </div>

      <div className="lb-bar-track" style={{ marginBottom: "0.9rem" }}>
        <div className="lb-bar-fill" style={{ width: `${pct}%` }} />
      </div>

      <button
        className={`lb-podium-follow-btn ${following ? "following" : ""}`}
        onClick={() => setFollowing((f) => !f)}
      >
        {following ? "✓ Following" : "Follow"}
      </button>
    </div>
  );
}

// ── Leaderboard row (#4 onward) ──────────────────────────────────────────
function LeaderRow({ creator, rank, maxFollowers }) {
  const [following, setFollowing] = useState(false);
  const [imgErr,    setImgErr]    = useState(false);
  const src = getProfileImageUrl(creator);
  const pct = Math.min(100, Math.round(((creator.followersCount || 0) / maxFollowers) * 100));

  const trendArr = rank <= 5 ? "▲" : rank <= 8 ? "–" : "▼";
  const trendCls = rank <= 5 ? "up" : rank <= 8 ? "same" : "down";
  const delay    = `${Math.min(rank * 0.035, 0.5)}s`;

  return (
    <div className="lb-row" style={{ animationDelay: delay }}>
      {/* Rank */}
      <div className={`lb-rank-num ${rank === 4 ? "rank-4" : rank === 5 ? "rank-5" : ""}`}>
        <span>#{rank}</span>
        <span className={`lb-trend ${trendCls}`}>{trendArr}</span>
      </div>

      {/* Creator */}
      <div className="lb-creator-info">
        <div
          className="lb-row-avatar"
          style={creator.followersCount > 50 ? { borderColor:"rgba(245,158,11,0.35)" } : {}}
        >
          {src && !imgErr
            ? <img src={src} alt="" onError={() => setImgErr(true)} />
            : <span>{initials(creator)}</span>
          }
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
            <p className="lb-row-name">{creator.name || creator.username}</p>
            {creator.followersCount > 50 && <span className="lb-featured-dot" title="Featured" />}
          </div>
          <p className="lb-row-handle">@{creator.username}</p>
        </div>
      </div>

      {/* Events */}
      <div className="lb-cell">
        {fmt(creator.eventsCount)}
        <span className="lb-cell-sub">events</span>
      </div>

      {/* Followers + bar */}
      <div className="lb-cell">
        <div className="lb-bar-wrap">
          {fmt(creator.followersCount)}
          <span className="lb-cell-sub">followers</span>
          <div className="lb-bar-track">
            <div className="lb-bar-fill" style={{ width:`${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Rating */}
      <div className="lb-cell">
        {creator.rating ? `${creator.rating}★` : "—"}
        <span className="lb-cell-sub">rating</span>
      </div>

      {/* Follow */}
      <div>
        <button
          className={`lb-row-follow ${following ? "following" : ""}`}
          onClick={() => setFollowing((f) => !f)}
        >
          {following ? "✓ Following" : "+ Follow"}
        </button>
      </div>
    </div>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────
function SkelRow() {
  return (
    <div className="lb-skel-row">
      <div className="lb-skel" style={{ width:28, height:18 }} />
      <div style={{ display:"flex", gap:"0.8rem", alignItems:"center" }}>
        <div className="lb-skel" style={{ width:40, height:40, borderRadius:10 }} />
        <div>
          <div className="lb-skel" style={{ width:100, height:13, marginBottom:5 }} />
          <div className="lb-skel" style={{ width:65,  height:10 }} />
        </div>
      </div>
      <div className="lb-skel" style={{ width:40, height:14 }} />
      <div className="lb-skel" style={{ width:55, height:14 }} />
      <div className="lb-skel" style={{ width:30, height:14 }} />
      <div className="lb-skel" style={{ width:70, height:30, borderRadius:8 }} />
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function DiscoverCreators() {
  const [creators, setCreators] = useState([]);
  const [category, setCategory] = useState("all");
  const [sort,     setSort]     = useState("trending");
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

  const podium = creators.slice(0, 3);
  const ranked = creators.slice(3);
  const maxF   = Math.max(...creators.map((c) => c.followersCount || 0), 1);

  return (
    <div className="lb-page">

      {/* Hero */}
      <header className="lb-hero">
        <div className="lb-hero-eyebrow">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <polygon points="5,0 6.5,3.5 10,3.5 7.25,5.75 8.25,9.5 5,7.5 1.75,9.5 2.75,5.75 0,3.5 3.5,3.5" />
          </svg>
          Creator Leaderboard
        </div>
        <h1 className="lb-hero-title">
          Top <span>Creators</span>
          <br />& Organizers
        </h1>
        <p className="lb-hero-sub">
          Ranked by influence, events, and community impact. Follow the best in the game.
        </p>
      </header>

      {/* Controls */}
      <div className="lb-controls">
        <div className="lb-cats">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`lb-cat-btn ${category === cat.id ? "active" : ""}`}
              onClick={() => setCategory(cat.id)}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
        <div className="lb-sort">
          {SORTS.map((s) => (
            <button
              key={s.id}
              className={`lb-sort-btn ${sort === s.id ? "active" : ""}`}
              onClick={() => setSort(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Podium skeleton */}
      {loading && (
        <div className="lb-podium">
          {[1,2,3].map((r) => (
            <div key={r} className="lb-podium-slot" data-rank={r} style={{ padding:"1.5rem", minHeight:220 }}>
              <div className="lb-skel" style={{ width:48, height:48, borderRadius:12, margin:"0 auto 0.75rem" }} />
              <div className="lb-skel" style={{ width:"70%", height:14, margin:"0 auto 0.5rem" }} />
              <div className="lb-skel" style={{ width:"45%", height:10, margin:"0 auto 1rem" }} />
              <div className="lb-skel" style={{ width:"100%", height:34, borderRadius:8 }} />
            </div>
          ))}
        </div>
      )}

      {/* Podium */}
      {!loading && podium.length > 0 && (
        <div className="lb-podium">
          {podium.map((creator, i) => (
            <PodiumSlot key={creator._id} creator={creator} rank={i + 1} />
          ))}
        </div>
      )}

      {/* Ranked list skeleton */}
      {loading && (
        <div className="lb-table-wrap lb-skeleton-list">
          {Array.from({ length: 7 }).map((_, i) => <SkelRow key={i} />)}
        </div>
      )}

      {/* Empty */}
      {!loading && creators.length === 0 && (
        <div className="lb-table-wrap">
          <div className="lb-empty">
            <div className="lb-empty-icon">🏆</div>
            <h3>No Creators Found</h3>
            <p>Try a different category or sort.</p>
          </div>
        </div>
      )}

      {/* Ranked list */}
      {!loading && ranked.length > 0 && (
        <div className="lb-table-wrap">
          <div className="lb-table-head">
            <span className="lb-th">Rank</span>
            <span className="lb-th">Creator</span>
            <span className="lb-th">Events</span>
            <span className="lb-th">Followers</span>
            <span className="lb-th">Rating</span>
            <span className="lb-th"></span>
          </div>
          {ranked.map((creator, i) => (
            <LeaderRow
              key={creator._id}
              creator={creator}
              rank={i + 4}
              maxFollowers={maxF}
            />
          ))}
        </div>
      )}
    </div>
  );
}