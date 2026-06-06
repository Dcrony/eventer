import { useEffect, useMemo, useState } from "react";
import { Bell, Menu, Search, Settings2, Shield, Sparkles, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import AppPage from "./layout/AppPage";
import adminService from "../services/adminService";
import { formatDateTime } from "../utils/adminUtils";

const adminNav = [
  { to: "/admin/dashboard", label: "Overview" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/verification", label: "Verification" },
  { to: "/admin/events", label: "Events" },
  { to: "/admin/transactions", label: "Transactions" },
  { to: "/admin/withdrawals", label: "Withdrawals" },
  { to: "/admin/finance", label: "Finance" },
  { to: "/admin/moderation", label: "Moderation" },
  { to: "/admin/logs", label: "Audit" },
  { to: "/admin/controls", label: "Operations" },
  { to: "/admin/settings", label: "Settings" },
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
    <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-30 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Global admin search</p>
        <button type="button" onClick={onClose} className="text-xs font-semibold text-gray-500 hover:text-gray-700">
          Close
        </button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map(([key, label]) => (
          <div key={key} className="rounded-xl border border-gray-200 bg-gray-50/70 p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
            <div className="mt-2 space-y-2">
              {(results?.[key] || []).slice(0, 3).map((item) => (
                <div key={item._id || item.reference || `${key}-${item.title || item.email}`} className="rounded-lg bg-white p-2.5 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900">
                    {item.name || item.title || item.reference || item.userId?.name || item.organizer?.name || "Result"}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {item.email || item.category || item.status || item.userId?.email || item.organizer?.email || "Matched record"}
                  </p>
                </div>
              ))}
              {!(results?.[key] || []).length ? <p className="text-xs text-gray-500">No matches.</p> : null}
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
      if (announcementsRes.status === "fulfilled") {
        setAnnouncements(announcementsRes.value.announcements || []);
      }
      if (permissionsRes.status === "fulfilled") {
        setPermissions(permissionsRes.value.permissions || []);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults(null);
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setSearching(true);
        const response = await adminService.search(searchTerm.trim());
        setSearchResults(response.results || {});
      } catch {
        setSearchResults(null);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  const currentLabel = useMemo(
    () => adminNav.find((item) => item.to === location.pathname)?.label || "Console",
    [location.pathname],
  );

  return (
    <AppPage
      background="bg-[radial-gradient(circle_at_top,#fff1f7_0%,#f8fafc_38%,#f8fafc_100%)]"
      contentClassName="py-5"
    >
      <div className="mb-5 flex items-center justify-between rounded-3xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen((current) => !current)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 text-gray-600 lg:hidden"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25">
            <Shield size={18} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-pink-500">TickiSpot Admin</p>
            <h1 className="text-lg font-extrabold tracking-tight text-gray-900">{currentLabel}</h1>
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link to="/admin/dashboard" className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:border-pink-300 hover:text-pink-600">
            Dashboard
          </Link>
          <Link to="/dashboard" className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
            Back to app
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[270px_1fr]">
        <aside className={`${mobileOpen ? "block" : "hidden"} lg:block`}>
          <div className="sticky top-4 space-y-4">
            <div className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Navigation</p>
              <nav className="space-y-1">
                {adminNav.map((item) => {
                  const active = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all ${active
                          ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/25"
                          : "text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                      <span>{item.label}</span>
                      {active ? <Sparkles size={14} /> : null}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur">
              <div className="flex items-center gap-2">
                <Settings2 size={16} className="text-pink-500" />
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Access</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {permissions.slice(0, 8).map((permission) => (
                  <span key={permission} className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                    {permission.replace(/\./g, " ")}
                  </span>
                ))}
                {!permissions.length ? <span className="text-xs text-gray-500">Loading permissions...</span> : null}
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 space-y-5">
          <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-pink-500">Command Center</p>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900">{title}</h2>
                <p className="mt-1 max-w-3xl text-sm text-gray-500">{description}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link to="/admin/finance" className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:border-pink-300 hover:text-pink-600">
                  Finance
                </Link>
                <Link to="/admin/moderation" className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:border-pink-300 hover:text-pink-600">
                  Moderation
                </Link>
                <Link to="/admin/settings" className="rounded-full bg-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-pink-500/25 hover:bg-pink-600">
                  Settings
                </Link>
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="relative">
                <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <Search size={18} className="text-pink-500" />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search users, events, tickets, payouts, billing, or livestreams"
                    className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                  />
                  {searching ? <span className="text-xs font-semibold text-gray-500">Searching...</span> : null}
                </div>
                {searchResults ? <SearchResults results={searchResults} onClose={() => setSearchResults(null)} /> : null}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-pink-500" />
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Activity Center</p>
                </div>
                <div className="mt-3 space-y-2">
                  {announcements.slice(0, 3).map((announcement) => (
                    <div key={announcement._id} className="rounded-xl bg-white p-3">
                      <p className="text-sm font-semibold text-gray-900">{announcement.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{formatDateTime(announcement.createdAt)}</p>
                    </div>
                  ))}
                  {!announcements.length ? <p className="text-xs text-gray-500">No recent announcements.</p> : null}
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
