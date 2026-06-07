import { useEffect, useMemo, useState } from "react";
import { Bell, Menu, Search, Settings2, Shield, Sparkles, X, ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import AppPage from "./layout/AppPage";
import adminService from "../services/adminService";
import { formatDateTime } from "../utils/adminUtils";

const adminNav = [
  { to: "/admin/dashboard", label: "Overview", icon: "chart" },
  { to: "/admin/users", label: "Users", icon: "users" },
  { to: "/admin/verification", label: "Verification", icon: "shield" },
  { to: "/admin/events", label: "Events", icon: "calendar" },
  { to: "/admin/transactions", label: "Transactions", icon: "receipt" },
  { to: "/admin/withdrawals", label: "Withdrawals", icon: "wallet" },
  { to: "/admin/payouts", label: "Payouts", icon: "coins" },
  { to: "/admin/finance", label: "Finance", icon: "dollar" },
  { to: "/admin/moderation", label: "Moderation", icon: "alert" },
  { to: "/admin/logs", label: "Audit", icon: "file" },
  { to: "/admin/controls", label: "Operations", icon: "tool" },
  { to: "/admin/settings", label: "Settings", icon: "settings" },
];

function SearchResults({ results, onClose }) {
  const groups = [
    ["users", "Users"],
    ["events", "Events"],
    ["transactions", "Transactions"],
    ["withdrawals", "Withdrawals"],
    ["subscriptions", "Subscriptions"],
    ["livestreams", "Livestreams"],
  ];

  return (
    <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl shadow-black/5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[0.65rem] font-bold uppercase tracking-widest text-gray-400">Search results</p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <X size={13} />
        </button>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {groups.map(([key, label]) => (
          <div key={key} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400 mb-2">{label}</p>
            <div className="space-y-1.5">
              {(results?.[key] || []).slice(0, 3).map((item) => (
                <div
                  key={item._id || item.reference || `${key}-${item.title || item.email}`}
                  className="rounded-lg bg-white border border-gray-100 p-2.5"
                >
                  <p className="text-xs font-semibold text-gray-900 truncate">
                    {item.name || item.title || item.reference || item.userId?.name || item.organizer?.name || "Result"}
                  </p>
                  <p className="mt-0.5 text-[0.6rem] text-gray-400 truncate">
                    {item.email || item.category || item.status || item.userId?.email || item.organizer?.email || "Matched record"}
                  </p>
                </div>
              ))}
              {!(results?.[key] || []).length && (
                <p className="text-xs text-gray-400">No matches.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
  title = "Admin Control Center",
  description = "Monitor and manage TickiSpot platform operations.",
}) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([adminService.getAnnouncements(1, 5), adminService.getAdminPermissions()]).then((responses) => {
      if (!mounted) return;
      const [announcementsRes, permissionsRes] = responses;
      if (announcementsRes.status === "fulfilled") setAnnouncements(announcementsRes.value.announcements || []);
      if (permissionsRes.status === "fulfilled") setPermissions(permissionsRes.value.permissions || []);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) { setSearchResults(null); return undefined; }
    const timeoutId = window.setTimeout(async () => {
      try {
        setSearching(true);
        const response = await adminService.search(searchTerm.trim());
        setSearchResults(response.results || {});
      } catch { setSearchResults(null); }
      finally { setSearching(false); }
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  const currentLabel = useMemo(
    () => adminNav.find((item) => item.to === location.pathname)?.label || "Console",
    [location.pathname],
  );

  return (
    <AppPage
      background="bg-gray-50"
      contentClassName="py-5"
    >
      {/* Top bar */}
      <div className="mb-5 flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen((c) => !c)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-100 text-gray-500 transition-colors hover:bg-gray-50 lg:hidden"
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500 text-white">
            <Shield size={16} />
          </div>
          <div>
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.22em] text-pink-500">TickiSpot Admin</p>
            <h1 className="text-base font-black text-gray-900 leading-tight">{currentLabel}</h1>
          </div>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Link
            to="/admin/dashboard"
            className="rounded-xl border border-gray-100 px-3.5 py-2 text-xs font-semibold text-gray-600 transition-colors hover:border-pink-100 hover:text-pink-600"
          >
            Dashboard
          </Link>
          <Link
            to="/dashboard"
            className="rounded-xl bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-gray-800"
          >
            Back to app
          </Link>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className={`${mobileOpen ? "block" : "hidden"} lg:block`}>
          <div className="sticky top-4 space-y-3">
            {/* Nav */}
            <div className="rounded-2xl border border-gray-100 bg-white p-3">
              <p className="mb-2 px-2 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-gray-400">Navigation</p>
              <nav className="space-y-0.5">
                {adminNav.map((item) => {
                  const active = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                        active
                          ? "bg-pink-500 text-white"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <span>{item.label}</span>
                      {active && <ChevronRight size={12} />}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Permissions */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4">
              <div className="flex items-center gap-2 mb-3">
                <Settings2 size={14} className="text-pink-500" />
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-gray-400">Access</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {permissions.slice(0, 8).map((permission) => (
                  <span key={permission} className="rounded-lg bg-gray-50 border border-gray-100 px-2 py-1 text-[0.6rem] font-semibold text-gray-500">
                    {permission.replace(/\./g, " ")}
                  </span>
                ))}
                {!permissions.length && <span className="text-xs text-gray-400">Loading...</span>}
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <section className="min-w-0 space-y-4">
          {/* Page header */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.22em] text-pink-500">Command Center</p>
                <h2 className="mt-1 text-xl font-black text-gray-900">{title}</h2>
                <p className="mt-0.5 max-w-2xl text-xs text-gray-400 leading-relaxed">{description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/admin/finance"
                  className="rounded-xl border border-gray-100 px-3.5 py-2 text-xs font-semibold text-gray-600 transition-colors hover:border-pink-100 hover:text-pink-600"
                >
                  Finance
                </Link>
                <Link
                  to="/admin/moderation"
                  className="rounded-xl border border-gray-100 px-3.5 py-2 text-xs font-semibold text-gray-600 transition-colors hover:border-pink-100 hover:text-pink-600"
                >
                  Moderation
                </Link>
                <Link
                  to="/admin/settings"
                  className="rounded-xl bg-pink-500 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-pink-600"
                >
                  Settings
                </Link>
              </div>
            </div>

            {/* Search + Announcements */}
            <div className="mt-4 grid gap-3 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="relative">
                <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
                  <Search size={15} className="text-pink-500 flex-shrink-0" />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search users, events, tickets, payouts, billing..."
                    className="min-w-0 flex-1 bg-transparent text-xs text-gray-800 outline-none placeholder:text-gray-400"
                  />
                  {searching && <span className="text-[0.6rem] font-semibold text-gray-400">Searching...</span>}
                </div>
                {searchResults && <SearchResults results={searchResults} onClose={() => setSearchResults(null)} />}
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Bell size={13} className="text-pink-500" />
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-gray-400">Recent Activity</p>
                </div>
                <div className="space-y-1.5">
                  {announcements.slice(0, 2).map((a) => (
                    <div key={a._id} className="rounded-lg bg-white border border-gray-100 p-2">
                      <p className="text-xs font-semibold text-gray-800 truncate">{a.title}</p>
                      <p className="mt-0.5 text-[0.6rem] text-gray-400">{formatDateTime(a.createdAt)}</p>
                    </div>
                  ))}
                  {!announcements.length && <p className="text-xs text-gray-400">No recent announcements.</p>}
                </div>
              </div>
            </div>
          </div>

          {children}
        </section>
      </div>
    </AppPage>
  );
}