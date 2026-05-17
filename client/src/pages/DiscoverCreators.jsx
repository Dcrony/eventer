import { useEffect, useState } from "react";
import { getCreators } from "../services/api/creators";
import { getProfileImageUrl } from "../utils/eventHelpers";

// ── Design tokens ─────────────────────────────────────────────────────────
const T = {
  bg:          "#f7f7f9",
  surface:     "#ffffff",
  border:      "#e8e8ed",
  borderSoft:  "#f0f0f5",
  pink:        "#f43f8e",
  pinkDeep:    "#e11d74",
  pinkSoft:    "rgba(244,63,142,0.08)",
  pinkMid:     "rgba(244,63,142,0.15)",
  gold:        "#d97706",
  goldBg:      "#fffbeb",
  goldRing:    "#fde68a",
  silver:      "#6b7280",
  silverBg:    "#f3f4f6",
  silverRing:  "#d1d5db",
  bronze:      "#b45309",
  bronzeBg:    "#fff7ed",
  bronzeRing:  "#fed7aa",
  pts:         "#7c3aed",
  ptsSoft:     "rgba(124,58,237,0.08)",
  ink:         "#111118",
  body:        "#374151",
  muted:       "#9ca3af",
  faint:       "#d1d5db",
  radiusSm:    "0.5rem",
  radius:      "0.875rem",
  radiusLg:    "1.25rem",
  pill:        "999px",
  font:        "'Geist', -apple-system, BlinkMacSystemFont, sans-serif",
};

// ── Helpers ───────────────────────────────────────────────────────────────
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

// ── Keyframe injection (once) ─────────────────────────────────────────────
const styleTag = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&display=swap');
  @keyframes rowIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  .ts-row-anim { animation: rowIn 0.35s ease both; }
  .ts-skel-anim {
    background: linear-gradient(90deg, #f0f0f5 25%, #e8e8f0 50%, #f0f0f5 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
  }
  .ts-row-wrap:hover { background: #fafafa !important; }
  .ts-cat-btn:hover  { border-color: ${T.pink} !important; color: ${T.pink} !important; background: ${T.pinkSoft} !important; }
  .ts-sort-btn-el:hover { color: ${T.ink} !important; }
  .ts-follow-btn:hover  { border-color: ${T.pink} !important; background: ${T.pink} !important; color: #fff !important; }
  .ts-search-el:focus   { border-color: ${T.pink} !important; box-shadow: 0 0 0 3px ${T.pinkSoft} !important; }
  .ts-submit-btn:hover  { background: ${T.pinkDeep} !important; }
  .ts-fact:hover        { border-color: ${T.pinkMid} !important; background: ${T.pinkSoft} !important; }
`;
if (typeof document !== "undefined" && !document.getElementById("ts-styles")) {
  const el = document.createElement("style");
  el.id = "ts-styles";
  el.textContent = styleTag;
  document.head.appendChild(el);
}

// ── Icons ─────────────────────────────────────────────────────────────────
function BoltIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"
      style={{ color: T.pts, flexShrink: 0 }}>
      <path d="M13 2L4.09 12.96A1 1 0 005 14.5h6.5L11 22l8.91-10.96A1 1 0 0019 10H12.5L13 2z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round"
      style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)",
               color: T.muted, width: 18, height: 18, pointerEvents: "none" }}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

// ── Rank badge ────────────────────────────────────────────────────────────
function rankStyle(rank) {
  if (rank === 1) return { background: T.goldBg,   color: T.gold,   border: `1.5px solid ${T.goldRing}`   };
  if (rank === 2) return { background: T.silverBg, color: T.silver, border: `1.5px solid ${T.silverRing}` };
  if (rank === 3) return { background: T.bronzeBg, color: T.bronze, border: `1.5px solid ${T.bronzeRing}` };
  return { background: "transparent", color: T.muted, border: "none", fontSize: "0.88rem", fontWeight: 500 };
}

// ── OrganizerRow ──────────────────────────────────────────────────────────
function OrganizerRow({ creator, rank }) {
  const [following, setFollowing] = useState(false);
  const [imgErr,    setImgErr]    = useState(false);
  const src = getProfileImageUrl(creator);

  const pts = creator.points
    ?? Math.round((creator.eventsCount || 0) * 10 + (creator.followersCount || 0) * 0.1);

  const isTop3     = rank <= 3;
  const isFeatured = creator.followersCount > 50;

  return (
    <div className="ts-row-wrap" style={{
      display: "flex", alignItems: "center", gap: "0.9rem",
      padding: "0.9rem 1.25rem",
      borderBottom: `1px solid ${T.borderSoft}`,
      transition: "background 0.15s ease",
      cursor: "default",
      animationDelay: `${rank * 0.04}s`,
    }} >

      {/* Rank */}
      <div style={{
        width: 30, height: 30, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.82rem", fontWeight: 700, flexShrink: 0,
        ...rankStyle(rank),
      }}>
        {rank}
      </div>

      {/* Avatar */}
      <div style={{
        width: 44, height: 44, borderRadius: 10, flexShrink: 0,
        overflow: "hidden",
        background: `linear-gradient(135deg, ${T.pinkSoft}, #ede9fe)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1rem", fontWeight: 700, color: T.pink,
        border: `1px solid ${T.border}`,
      }}>
        {src && !imgErr ? (
          <img src={src} alt={creator.name || creator.username}
            onError={() => setImgErr(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : getInitials(creator)}
      </div>

      {/* Name + handle */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
          <span style={{
            fontSize: "0.93rem", fontWeight: 700, color: T.ink,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220,
          }}>
            {creator.name || creator.username}
          </span>
          {isFeatured && (
            <span style={{
              display: "inline-flex", alignItems: "center",
              height: "1.1rem", padding: "0 0.4rem", borderRadius: T.pill,
              fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.04em",
              whiteSpace: "nowrap", flexShrink: 0,
              background: "#fef9c3", color: "#92400e", border: "1px solid #fde68a",
            }}>Featured</span>
          )}
          {creator.verified && (
            <span style={{
              display: "inline-flex", alignItems: "center",
              height: "1.1rem", padding: "0 0.4rem", borderRadius: T.pill,
              fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.04em",
              whiteSpace: "nowrap", flexShrink: 0,
              background: T.pinkSoft, color: T.pinkDeep, border: `1px solid ${T.pinkMid}`,
            }}>✓ Pro</span>
          )}
        </div>
        <div style={{
          fontSize: "0.78rem", fontWeight: 400, color: T.muted,
          marginTop: "0.05rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          @{creator.username}
        </div>
      </div>

      {/* Points */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0, minWidth: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.2rem", lineHeight: 1 }}>
          <BoltIcon size={13} />
          <span style={{ fontSize: "1.05rem", fontWeight: 800, color: T.ink, letterSpacing: "-0.02em", lineHeight: 1 }}>
            {fmtPts(pts)}
          </span>
        </div>
        <span style={{ fontSize: "0.65rem", fontWeight: 500, color: T.pts, textAlign: "right", marginTop: "0.1rem", letterSpacing: "0.04em" }}>
          pts
        </span>
      </div>

      {/* Follow */}
      <button className="ts-follow-btn"
        onClick={() => setFollowing((f) => !f)}
        aria-pressed={following}
        style={{
          height: "2rem", padding: "0 1rem", borderRadius: T.pill,
          border: `1.5px solid ${following ? T.pink : T.border}`,
          background: following ? T.pink : T.surface,
          fontFamily: T.font, fontSize: "0.78rem", fontWeight: 600,
          color: following ? "#fff" : T.body,
          cursor: "pointer", transition: "all 0.18s ease",
          whiteSpace: "nowrap", flexShrink: 0,
        }}>
        {following ? "✓ Following" : "Follow"}
      </button>
    </div>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────
function SkelRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.9rem", padding: "0.9rem 1.25rem", borderBottom: `1px solid ${T.borderSoft}` }}>
      <div className="ts-skel-anim" style={{ width: 30, height: 30, borderRadius: "50%" }} />
      <div className="ts-skel-anim" style={{ width: 44, height: 44, borderRadius: 10 }} />
      <div style={{ flex: 1 }}>
        <div className="ts-skel-anim" style={{ width: "55%", height: 13, marginBottom: 6 }} />
        <div className="ts-skel-anim" style={{ width: "35%", height: 10 }} />
      </div>
      <div className="ts-skel-anim" style={{ width: 36, height: 18 }} />
      <div className="ts-skel-anim" style={{ width: 64, height: 30, borderRadius: T.pill }} />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
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

        <div className="min-h-screen w-full bg-[#f7f7f9] ">

    <div style={{
      fontFamily: T.font,
      background: T.bg,
      minHeight: "100vh",
      padding: "2rem 1rem 4rem",
      color: T.ink,
    }}>

      {/* Header */}
      <header style={{ maxWidth: 1300, margin: "0 auto 1.75rem" }}>
        <span style={{
          display: "inline-block", fontSize: "0.65rem", fontWeight: 700,
          letterSpacing: "0.14em", textTransform: "uppercase",
          color: T.pink, marginBottom: "0.5rem",
        }}>
          Organizer Rankings
        </span>
        <h1 style={{
          fontSize: "clamp(1.6rem, 4vw, 2.2rem)", fontWeight: 800, color: T.ink,
          lineHeight: 1.15, letterSpacing: "-0.02em", margin: "0 0 0.4rem",
        }}>
          Discover Creators<br />&amp; Organizers
        </h1>
        <p style={{ fontSize: "0.92rem", fontWeight: 400, color: T.muted, margin: 0, lineHeight: 1.6 }}>
          The top event creators ranked by community impact, events, and followers.
        </p>
      </header>

      {/* Controls */}
      <div style={{ maxWidth: 1300, margin: "0 auto 1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <SearchIcon />
          <input className="ts-search-el"
            type="search"
            placeholder="Search events by title, location, or category"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", height: "3rem",
              padding: "0 3.5rem 0 2.9rem",
              borderRadius: T.pill,
              border: `1.5px solid ${T.border}`,
              background: T.surface,
              fontFamily: T.font, fontSize: "0.92rem", color: T.ink,
              outline: "none", transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              boxSizing: "border-box",
            }} />
          <button className="ts-submit-btn"
            aria-label="Search"
            style={{
              position: "absolute", right: "0.35rem", top: "50%", transform: "translateY(-50%)",
              width: "2.2rem", height: "2.2rem", borderRadius: "50%",
              border: "none", background: T.pink, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "background 0.2s ease",
            }}>
            <ArrowIcon />
          </button>
        </div>

        {/* Category pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
          {CATEGORIES.map((cat) => (
            <button key={cat.id} className="ts-cat-btn"
              onClick={() => setCategory(cat.id)}
              style={{
                height: "2rem", padding: "0 1rem", borderRadius: T.pill,
                border: `1.5px solid ${category === cat.id ? T.pink : T.border}`,
                background: category === cat.id ? T.pink : T.surface,
                fontFamily: T.font, fontSize: "0.8rem",
                fontWeight: category === cat.id ? 600 : 500,
                color: category === cat.id ? "#fff" : T.body,
                cursor: "pointer", transition: "all 0.18s ease", whiteSpace: "nowrap",
              }}>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sort row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.78rem", color: T.muted, whiteSpace: "nowrap" }}>Sort by</span>
          <div style={{
            display: "flex", gap: "0.3rem",
            background: T.surface, border: `1.5px solid ${T.border}`,
            borderRadius: T.pill, padding: "0.2rem",
          }}>
            {SORTS.map((s) => (
              <button key={s.id} className="ts-sort-btn-el"
                onClick={() => setSort(s.id)}
                style={{
                  height: "1.7rem", padding: "0 0.85rem", borderRadius: T.pill,
                  border: "none",
                  background: sort === s.id ? T.pink : "transparent",
                  fontFamily: T.font, fontSize: "0.78rem",
                  fontWeight: sort === s.id ? 600 : 500,
                  color: sort === s.id ? "#fff" : T.muted,
                  cursor: "pointer", transition: "all 0.18s ease", whiteSpace: "nowrap",
                }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div style={{
        maxWidth: 1300, margin: "0 auto",
        background: T.surface, border: `1.5px solid ${T.border}`,
        borderRadius: T.radiusLg, overflow: "hidden",
      }}>
        {/* List header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0.85rem 1.25rem",
          borderBottom: `1.5px solid ${T.borderSoft}`,
          background: "#fafafa",
        }}>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted }}>
            {category === "all" ? "All Organizers" : `${CATEGORIES.find(c => c.id === category)?.label} Organizers`}
          </span>
          {!loading && (
            <span style={{ fontSize: "0.75rem", fontWeight: 500, color: T.muted }}>
              {filtered.length} organizers
            </span>
          )}
        </div>

        {loading && Array.from({ length: 8 }).map((_, i) => <SkelRow key={i} />)}

        {!loading && filtered.length === 0 && (
          <div style={{ padding: "4rem 2rem", textAlign: "center", color: T.muted }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", opacity: 0.35 }}>🔍</div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: T.body, margin: "0 0 0.3rem" }}>No organizers found</h3>
            <p style={{ fontSize: "0.85rem", margin: 0 }}>Try a different category or search term.</p>
          </div>
        )}

        {!loading && filtered.map((creator, i) => (
          <OrganizerRow key={creator._id} creator={creator} rank={i + 1} />
        ))}
      </div>
    </div>
    </div>
  );
}