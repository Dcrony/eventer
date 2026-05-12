import { Link } from "react-router-dom";
import { useCreateEvent } from "../context/CreateEventContext";
import { Ticket, Radio, BarChart2, Globe, ArrowRight } from "lucide-react";

const FEATURES = [
  { icon: Ticket,   title: "Smart Ticketing",     desc: "Easy ticket creation, secure payments, and instant payouts." },
  { icon: Radio,    title: "Live Streaming",       desc: "High-quality virtual events with real-time audience engagement." },
  { icon: BarChart2,title: "Powerful Analytics",  desc: "Track sales, attendance, and audience insights in real-time." },
  { icon: Globe,    title: "Built for Africa",     desc: "Local payment options, multilingual support, and regional focus." },
];

const VALUES = [
  ["Simplicity",       "Beautiful tools that are easy to use."],
  ["Reliability",      "Events that never fail."],
  ["Transparency",     "Fair fees and clear reporting."],
  ["Community First",  "Built by Africans, for Africans."],
];

const inputCls =
  "block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1";

export default function AboutUs() {
  const { openCreateEvent } = useCreateEvent();

  return (
    <div className="min-h-screen bg-white pl-[var(--sidebar-width,0px)] transition-[padding-left] duration-300">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-14">

        {/* ── Header ── */}
        <header className="text-center space-y-3 pb-10 border-b border-slate-100">
          <p className="text-xs font-bold uppercase tracking-widest text-pink-500">About us</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            About TickiSpot
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
            Empowering African creators to host unforgettable events
          </p>
        </header>

        {/* ── Mission ── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-pink-500">
            <span className="block w-1 h-5 rounded-full bg-pink-500" />
            <h2 className="text-sm font-extrabold uppercase tracking-widest">Our Mission</h2>
          </div>
          <p className="text-slate-600 leading-relaxed text-[15px]">
            At <strong className="text-slate-900">TickiSpot</strong>, we believe everyone should have the power to
            create meaningful experiences. We built a simple, reliable, and powerful platform that helps
            organizers focus on what matters most — delivering amazing events — while we handle the rest.
          </p>
        </section>

        {/* ── Story ── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-pink-500">
            <span className="block w-1 h-5 rounded-full bg-pink-500" />
            <h2 className="text-sm font-extrabold uppercase tracking-widest">Our Story</h2>
          </div>
          <p className="text-slate-600 leading-relaxed text-[15px]">
            Born in Nigeria, TickiSpot was founded by event lovers who were frustrated with the complexity
            and high costs of existing ticketing tools. We started with one goal: to make event management
            seamless for African organizers — from small community gatherings to large festivals and conferences.
          </p>
        </section>

        {/* ── Features grid ── */}
        <section className="space-y-5">
          <div className="flex items-center gap-2 text-pink-500">
            <span className="block w-1 h-5 rounded-full bg-pink-500" />
            <h2 className="text-sm font-extrabold uppercase tracking-widest">What We Offer</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group p-5 bg-white border border-slate-200 rounded-2xl hover:border-pink-300 hover:shadow-md hover:shadow-pink-50 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500 mb-3 group-hover:bg-pink-100 transition-colors">
                  <Icon size={18} />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 mb-1">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Values ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-pink-500">
            <span className="block w-1 h-5 rounded-full bg-pink-500" />
            <h2 className="text-sm font-extrabold uppercase tracking-widest">Our Values</h2>
          </div>
          <ul className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
            {VALUES.map(([title, desc]) => (
              <li key={title} className="flex items-start gap-3 px-5 py-4 bg-white hover:bg-slate-50 transition-colors">
                <span className="mt-0.5 text-pink-500 font-bold text-sm shrink-0">—</span>
                <p className="text-[15px] text-slate-600">
                  <strong className="text-slate-900">{title}</strong> {desc}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* ── CTA ── */}
        <section className="relative overflow-hidden bg-slate-900 rounded-2xl px-8 py-10 text-center">
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 80% 0%, rgba(244,63,142,0.18) 0%, transparent 60%)" }}
          />
          <h3 className="relative text-xl font-extrabold text-white tracking-tight mb-4">
            Ready to host your next event?
          </h3>
          <button
            onClick={openCreateEvent}
            className="relative inline-flex items-center gap-2 h-11 px-7 rounded-full bg-pink-500 text-white text-sm font-bold shadow-lg shadow-pink-500/30 hover:bg-pink-600 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-pink-500/40 transition-all"
          >
            Create Your First Event
            <ArrowRight size={15} />
          </button>
        </section>

        {/* ── Footer link ── */}
        <footer className="text-center pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-pink-500 font-medium transition-colors"
          >
            ← Back to Homepage
          </Link>
        </footer>
      </div>
    </div>
  );
}