import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { ErrorMessage, LoadingSpinner, SuccessMessage, SurfaceCard } from "../components/AdminComponents";
import adminService from "../services/adminService";

const defaultSettings = {
  commissionPercent: 10,
  withdrawalFeePercent: 2,
  maintenanceMode: false,
  eventApprovalRequired: true,
  tickiAiEnabled: true,
  livestreamEnabled: true,
  registrationEnabled: true,
  homepage: { heroTitle: "", heroSubtitle: "" },
  platformLimits: { freePlanEventLimit: 3, maxTeamMembersPerEvent: 10, maxFeaturedEvents: 12 },
  email: { supportEmail: "", operationsEmail: "" },
  referrals: { enabled: false, rewardAmount: 0 },
};

export default function AdminSettings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const response = await adminService.getSettings();
        setSettings({ ...defaultSettings, ...response.settings });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load admin settings.");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateField = (path, value) => {
    setSettings((current) => {
      const next = { ...current };
      const segments = path.split(".");
      let node = next;
      while (segments.length > 1) {
        const segment = segments.shift();
        node[segment] = { ...(node[segment] || {}) };
        node = node[segment];
      }
      node[segments[0]] = value;
      return next;
    });
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const response = await adminService.updateSettings(settings);
      setSettings({ ...defaultSettings, ...response.settings });
      setSuccess("Platform settings updated.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="System Settings" description="Control global platform behavior, policies, fees, and growth settings.">
        <LoadingSpinner label="Loading settings..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="System Settings" description="Control global platform behavior, policies, fees, and growth settings.">
      <div className="space-y-5">
        {error ? <ErrorMessage message={error} onDismiss={() => setError("")} /> : null}
        {success ? <SuccessMessage message={success} /> : null}

        <div className="grid gap-5 xl:grid-cols-2">
          <SurfaceCard className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Commercial Settings</p>
              <h3 className="mt-1 text-lg font-extrabold text-gray-900">Revenue & Access</h3>
            </div>
            <label className="block text-sm font-semibold text-gray-700">
              Platform commission %
              <input type="number" value={settings.commissionPercent ?? 0} onChange={(e) => updateField("commissionPercent", Number(e.target.value))} className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none" />
            </label>
            <label className="block text-sm font-semibold text-gray-700">
              Withdrawal fee %
              <input type="number" value={settings.withdrawalFeePercent ?? 0} onChange={(e) => updateField("withdrawalFeePercent", Number(e.target.value))} className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none" />
            </label>
            <label className="block text-sm font-semibold text-gray-700">
              Free plan event limit
              <input type="number" value={settings.platformLimits?.freePlanEventLimit ?? 0} onChange={(e) => updateField("platformLimits.freePlanEventLimit", Number(e.target.value))} className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none" />
            </label>
            <label className="block text-sm font-semibold text-gray-700">
              Max team members per event
              <input type="number" value={settings.platformLimits?.maxTeamMembersPerEvent ?? 0} onChange={(e) => updateField("platformLimits.maxTeamMembersPerEvent", Number(e.target.value))} className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none" />
            </label>
          </SurfaceCard>

          <SurfaceCard className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Experience Controls</p>
              <h3 className="mt-1 text-lg font-extrabold text-gray-900">Platform Modes</h3>
            </div>
            {[
              ["maintenanceMode", "Maintenance mode"],
              ["eventApprovalRequired", "Require event approval"],
              ["tickiAiEnabled", "Enable TickiAI"],
              ["livestreamEnabled", "Enable livestreaming"],
              ["registrationEnabled", "Allow new registrations"],
              ["referrals.enabled", "Enable referrals"],
            ].map(([path, label]) => (
              <label key={path} className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(path === "referrals.enabled" ? settings.referrals?.enabled : settings[path])}
                  onChange={(e) => updateField(path, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-pink-500"
                />
              </label>
            ))}
            <label className="block text-sm font-semibold text-gray-700">
              Referral reward amount
              <input type="number" value={settings.referrals?.rewardAmount ?? 0} onChange={(e) => updateField("referrals.rewardAmount", Number(e.target.value))} className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none" />
            </label>
          </SurfaceCard>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <SurfaceCard className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Homepage Messaging</p>
              <h3 className="mt-1 text-lg font-extrabold text-gray-900">Branding</h3>
            </div>
            <label className="block text-sm font-semibold text-gray-700">
              Hero title
              <input type="text" value={settings.homepage?.heroTitle || ""} onChange={(e) => updateField("homepage.heroTitle", e.target.value)} className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none" />
            </label>
            <label className="block text-sm font-semibold text-gray-700">
              Hero subtitle
              <textarea value={settings.homepage?.heroSubtitle || ""} onChange={(e) => updateField("homepage.heroSubtitle", e.target.value)} rows={4} className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none" />
            </label>
          </SurfaceCard>

          <SurfaceCard className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Support & Ops</p>
              <h3 className="mt-1 text-lg font-extrabold text-gray-900">Contact Channels</h3>
            </div>
            <label className="block text-sm font-semibold text-gray-700">
              Support email
              <input type="email" value={settings.email?.supportEmail || ""} onChange={(e) => updateField("email.supportEmail", e.target.value)} className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none" />
            </label>
            <label className="block text-sm font-semibold text-gray-700">
              Operations email
              <input type="email" value={settings.email?.operationsEmail || ""} onChange={(e) => updateField("email.operationsEmail", e.target.value)} className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none" />
            </label>
          </SurfaceCard>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-pink-500/25 hover:bg-pink-600 disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save settings"}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
