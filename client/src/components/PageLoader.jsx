// src/components/PageLoader.jsx
export default function PageLoader({ message = "Getting your experience ready…" }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-geist">
      <style>{`
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(28px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(28px) rotate(-360deg); }
        }
        @keyframes orbit2 {
          from { transform: rotate(120deg) translateX(28px) rotate(-120deg); }
          to   { transform: rotate(480deg) translateX(28px) rotate(-480deg); }
        }
        @keyframes orbit3 {
          from { transform: rotate(240deg) translateX(28px) rotate(-240deg); }
          to   { transform: rotate(600deg) translateX(28px) rotate(-600deg); }
        }
        @keyframes pulseRing {
          0%,100% { transform: scale(1); opacity: .18; }
          50%      { transform: scale(1.18); opacity: .07; }
        }
        @keyframes shimmerText {
          0%,100% { opacity: .45; }
          50%      { opacity: 1; }
        }
        @keyframes ticketFloat {
          0%,100% { transform: translateY(0px) rotate(-8deg); }
          50%      { transform: translateY(-6px) rotate(-8deg); }
        }
        @keyframes ticketFloat2 {
          0%,100% { transform: translateY(0px) rotate(6deg); }
          50%      { transform: translateY(-5px) rotate(6deg); }
        }
        @keyframes dotPulse {
          0%,80%,100% { transform: scale(0.6); opacity: .3; }
          40%          { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Orbit stage */}
      <div className="relative w-24 h-24 flex items-center justify-center mb-6">
        {/* Pulse ring */}
        <div className="absolute w-24 h-24 rounded-full bg-pink-500"
          style={{ animation: "pulseRing 2s ease-in-out infinite" }} />

        {/* Orbiting dots */}
        {[
          { color: "#f9a8d4", anim: "orbit 1.4s linear infinite" },
          { color: "#fbcfe8", anim: "orbit2 1.4s linear infinite" },
          { color: "#fce7f3", anim: "orbit3 1.4s linear infinite" },
        ].map((dot, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full"
            style={{
              background: dot.color,
              top: "50%", left: "50%",
              margin: "-6px 0 0 -6px",
              animation: dot.anim,
            }}
          />
        ))}

        {/* Core */}
        <div className="absolute w-11 h-11 rounded-full bg-pink-500 flex items-center justify-center z-10">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="6" y="6" width="12" height="12" rx="2" fill="white" opacity="0.95"/>
            <rect x="8.5" y="9" width="7" height="1.5" rx="0.75" fill="#ec4899"/>
            <rect x="8.5" y="11.5" width="5" height="1.5" rx="0.75" fill="#ec4899" opacity="0.6"/>
            <path d="M6 8.5C6 7.12 4.88 6 3.5 6S1 7.12 1 8.5v7C1 16.88 2.12 18 3.5 18S6 16.88 6 15.5" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M18 8.5C18 7.12 19.12 6 20.5 6S23 7.12 23 8.5v7c0 1.38-1.12 2.5-2.5 2.5S18 16.88 18 15.5" stroke="white" strokeWidth="1.5" fill="none"/>
          </svg>
        </div>
      </div>

      {/* Floating tickets */}
      <div className="flex gap-4 items-end mb-7" aria-hidden="true">
        {[
          { bg: "#ec4899", w: 48, h: 28, rot: "-8deg", anim: "ticketFloat 1.8s ease-in-out infinite", lw: 22 },
          { bg: "#db2777", w: 40, h: 24, rot: "6deg",  anim: "ticketFloat2 1.8s ease-in-out infinite 0.3s", lw: 16 },
          { bg: "#be185d", w: 48, h: 28, rot: "-8deg", anim: "ticketFloat 1.8s ease-in-out infinite 0.6s", lw: 22 },
        ].map((t, i) => (
          <div
            key={i}
            className="relative flex items-center justify-center rounded-md overflow-visible"
            style={{
              width: t.w, height: t.h,
              background: t.bg,
              transform: `rotate(${t.rot})`,
              animation: t.anim,
            }}
          >
            {/* Notches */}
            <div className="absolute w-2 h-2 rounded-full bg-gray-50" style={{ left: -4, top: "50%", transform: "translateY(-50%)" }} />
            <div className="absolute w-2 h-2 rounded-full bg-gray-50" style={{ right: -4, top: "50%", transform: "translateY(-50%)" }} />
            <div className="h-0.5 rounded-full bg-white/50" style={{ width: t.lw }} />
          </div>
        ))}
      </div>

      {/* Wordmark */}
      <p className="text-2xl font-extrabold tracking-tight text-gray-900 mb-1">
        Ticki<span className="text-pink-500">Spot</span>
      </p>

      {/* Tagline */}
      <p className="text-sm text-gray-400 mb-5"
        style={{ animation: "shimmerText 2s ease-in-out infinite" }}>
        {message}
      </p>

      {/* Dot pulse */}
      <div className="flex gap-1.5 items-center" aria-hidden="true">
        {[0, 0.2, 0.4].map((delay, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-pink-500"
            style={{ animation: `dotPulse 1.2s ease-in-out infinite ${delay}s` }}
          />
        ))}
      </div>
    </div>
  );
}