import { useEffect, useState } from "react";
import { Bell, Search, Send, Shield } from "lucide-react";
import adminService from "../services/adminService";
import AdminLayout from "../components/AdminLayout";
import { EmptyState, ErrorMessage, LoadingSpinner, SuccessMessage, SurfaceCard } from "../components/AdminComponents";

export default function AdminControls() {
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [announcement, setAnnouncement] = useState({
    title: "",
    content: "",
    type: "info",
    targetAudience: "all",
  });

  const loadOperations = async () => {
    try {
      setBootLoading(true);
      const [announcementsRes, permissionsRes] = await Promise.all([
        adminService.getAnnouncements(1, 12),
        adminService.getAdminPermissions(),
      ]);
      setAnnouncements(announcementsRes.announcements || []);
      setPermissions(permissionsRes.permissions || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load admin operations data.");
    } finally {
      setBootLoading(false);
    }
  };

  useEffect(() => {
    loadOperations();
  }, []);

  const sendAnnouncement = async () => {
    if (!announcement.title.trim() || !announcement.content.trim()) {
      setError("Please fill in both title and content for the announcement.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const response = await adminService.sendAnnouncement(announcement);
      setSuccess(response?.message || "Announcement sent successfully.");
      setAnnouncement({ title: "", content: "", type: "info", targetAudience: "all" });
      loadOperations();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send announcement.");
    } finally {
      setLoading(false);
    }
  };

  const runSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      setLoading(true);
      const response = await adminService.search(searchTerm.trim());
      setSearchResults(response.results || {});
    } catch (err) {
      setError(err.response?.data?.message || "Failed to run global admin search.");
    } finally {
      setLoading(false);
    }
  };

  if (bootLoading) {
    return (
      <AdminLayout title="Operations Center" description="Manage communication, audit readiness, and platform-wide admin utilities.">
        <LoadingSpinner label="Loading operations center..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Operations Center" description="Manage communication, audit readiness, and platform-wide admin utilities.">
      <div className="space-y-5">
        {error ? <ErrorMessage message={error} onDismiss={() => setError(null)} /> : null}
        {success ? <SuccessMessage message={success} /> : null}

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <SurfaceCard className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-50 text-pink-500">
                <Bell size={18} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">Platform Announcements</h3>
                <p className="text-sm text-gray-500">Send in-app notices to the whole platform or a specific audience.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                value={announcement.title}
                onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                placeholder="Announcement title"
                className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-pink-400"
              />
              <select
                value={announcement.type}
                onChange={(e) => setAnnouncement({ ...announcement, type: e.target.value })}
                className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-pink-400"
              >
                <option value="info">Information</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <textarea
              value={announcement.content}
              onChange={(e) => setAnnouncement({ ...announcement, content: e.target.value })}
              placeholder="Announcement message..."
              rows={5}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-pink-400"
            />

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <select
                value={announcement.targetAudience}
                onChange={(e) => setAnnouncement({ ...announcement, targetAudience: e.target.value })}
                className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-pink-400"
              >
                <option value="all">All Users</option>
                <option value="organizers">Organizers</option>
                <option value="buyers">Buyers</option>
                <option value="admins">Admins</option>
              </select>

              <button
                type="button"
                onClick={sendAnnouncement}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-pink-500/25 hover:bg-pink-600 disabled:opacity-60"
              >
                <Send size={16} />
                Send announcement
              </button>
            </div>
          </SurfaceCard>

          <SurfaceCard className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-50 text-pink-500">
                <Search size={18} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">Global Search</h3>
                <p className="text-sm text-gray-500">Search across users, events, tickets, payouts, and subscriptions.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") runSearch();
                }}
                placeholder="Search records"
                className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-pink-400"
              />
              <button type="button" onClick={runSearch} className="rounded-full border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:border-pink-300 hover:text-pink-600">
                Search
              </button>
            </div>

            <div className="space-y-3">
              {searchResults ? Object.entries(searchResults).map(([key, items]) => (
                <div key={key} className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{key}</p>
                  <p className="mt-2 text-sm text-gray-600">{items?.length || 0} result(s)</p>
                </div>
              )) : <EmptyState icon={Search} title="Search ready" description="Run a cross-platform search to inspect users, events, finance records, and streams." />}
            </div>
          </SurfaceCard>
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <SurfaceCard>
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-50 text-pink-500">
                <Shield size={18} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">Permission Footprint</h3>
                <p className="text-sm text-gray-500">Current admin permissions available in this session.</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {permissions.map((permission) => (
                <span key={permission} className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
                  {permission}
                </span>
              ))}
              {!permissions.length ? <p className="text-sm text-gray-500">No permission data available.</p> : null}
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <h3 className="text-lg font-extrabold text-gray-900">Recent Announcements</h3>
            <div className="mt-4 space-y-3">
              {announcements.map((item) => (
                <div key={item._id} className="rounded-2xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{item.type} • {item.targetAudience}</p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                      {item.sentTo || 0} recipients
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">{item.content}</p>
                </div>
              ))}
              {!announcements.length ? <p className="text-sm text-gray-500">No announcements have been sent yet.</p> : null}
            </div>
          </SurfaceCard>
        </div>
      </div>
    </AdminLayout>
  );
}
