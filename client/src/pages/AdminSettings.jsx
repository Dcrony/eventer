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

function SettingsInput({ label, type = "text", value, onChange, ...props }) {
    return (
        <label className="block">
            <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400 mb-2">{label}</p>
            <input
                type={type}
                value={value}
                onChange={onChange}
                className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-50"
                {...props}
            />
        </label>
    );
}

function SettingsTextarea({ label, value, onChange, rows = 4 }) {
    return (
        <label className="block">
            <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400 mb-2">{label}</p>
            <textarea
                value={value}
                onChange={onChange}
                rows={rows}
                className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none resize-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-50"
            />
        </label>
    );
}

function SettingsToggle({ label, checked, onChange }) {
    return (
        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 transition hover:border-pink-100 hover:bg-pink-50/20">
            <span className="text-xs font-semibold text-gray-700">{label}</span>
            <div
                onClick={onChange}
                className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${checked ? "bg-pink-500" : "bg-gray-200"}`}
            >
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
        </label>
    );
}

function SectionHeader({ label, title }) {
    return (
        <div className="mb-1">
            <p className="text-[0.6rem] font-bold uppercase tracking-widest text-pink-400">{label}</p>
            <h3 className="mt-1 text-base font-black text-gray-900">{title}</h3>
        </div>
    );
}

export default function AdminSettings() {
    const [settings, setSettings] = useState(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const res = await adminService.getSettings();
                setSettings({ ...defaultSettings, ...res.settings });
            } catch (err) {
                setError(err.response?.data?.message || "Failed to load admin settings.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const updateField = (path, value) => {
        setSettings((cur) => {
            const next = { ...cur };
            const segs = path.split(".");
            let node = next;
            while (segs.length > 1) {
                const s = segs.shift();
                node[s] = { ...(node[s] || {}) };
                node = node[s];
            }
            node[segs[0]] = value;
            return next;
        });
    };

    const saveSettings = async () => {
        try {
            setSaving(true);
            setError("");
            setSuccess("");
            const res = await adminService.updateSettings(settings);
            setSettings({ ...defaultSettings, ...res.settings });
            setSuccess("Platform settings saved.");
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

    const toggles = [
        ["maintenanceMode", "Maintenance mode"],
        ["eventApprovalRequired", "Require event approval"],
        ["tickiAiEnabled", "Enable TickiAI"],
        ["livestreamEnabled", "Enable livestreaming"],
        ["registrationEnabled", "Allow new registrations"],
        ["referrals.enabled", "Enable referrals"],
    ];

    return (
        <AdminLayout title="System Settings" description="Control global platform behavior, policies, fees, and growth settings.">
            <div className="space-y-5">
                {error   && <ErrorMessage   message={error}   onDismiss={() => setError("")} />}
                {success && <SuccessMessage message={success} />}

                <div className="grid gap-5 xl:grid-cols-2">
                    <SurfaceCard className="space-y-4">
                        <SectionHeader label="Commercial Settings" title="Revenue & Access" />
                        <SettingsInput label="Platform commission %" type="number" value={settings.commissionPercent ?? 0} onChange={(e) => updateField("commissionPercent", Number(e.target.value))} />
                        <SettingsInput label="Withdrawal fee %" type="number" value={settings.withdrawalFeePercent ?? 0} onChange={(e) => updateField("withdrawalFeePercent", Number(e.target.value))} />
                        <SettingsInput label="Free plan event limit" type="number" value={settings.platformLimits?.freePlanEventLimit ?? 0} onChange={(e) => updateField("platformLimits.freePlanEventLimit", Number(e.target.value))} />
                        <SettingsInput label="Max team members per event" type="number" value={settings.platformLimits?.maxTeamMembersPerEvent ?? 0} onChange={(e) => updateField("platformLimits.maxTeamMembersPerEvent", Number(e.target.value))} />
                    </SurfaceCard>

                    <SurfaceCard className="space-y-4">
                        <SectionHeader label="Experience Controls" title="Platform Modes" />
                        {toggles.map(([path, label]) => (
                            <SettingsToggle
                                key={path}
                                label={label}
                                checked={Boolean(path === "referrals.enabled" ? settings.referrals?.enabled : settings[path])}
                                onChange={() => updateField(path, !(path === "referrals.enabled" ? settings.referrals?.enabled : settings[path]))}
                            />
                        ))}
                        <SettingsInput label="Referral reward amount" type="number" value={settings.referrals?.rewardAmount ?? 0} onChange={(e) => updateField("referrals.rewardAmount", Number(e.target.value))} />
                    </SurfaceCard>
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
                    <SurfaceCard className="space-y-4">
                        <SectionHeader label="Homepage Messaging" title="Branding" />
                        <SettingsInput label="Hero title" value={settings.homepage?.heroTitle || ""} onChange={(e) => updateField("homepage.heroTitle", e.target.value)} />
                        <SettingsTextarea label="Hero subtitle" value={settings.homepage?.heroSubtitle || ""} onChange={(e) => updateField("homepage.heroSubtitle", e.target.value)} />
                    </SurfaceCard>

                    <SurfaceCard className="space-y-4">
                        <SectionHeader label="Support & Ops" title="Contact Channels" />
                        <SettingsInput label="Support email" type="email" value={settings.email?.supportEmail || ""} onChange={(e) => updateField("email.supportEmail", e.target.value)} />
                        <SettingsInput label="Operations email" type="email" value={settings.email?.operationsEmail || ""} onChange={(e) => updateField("email.operationsEmail", e.target.value)} />
                    </SurfaceCard>
                </div>

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={saveSettings}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-2xl bg-pink-500 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-pink-600 disabled:opacity-60 transition-colors"
                    >
                        <Save size={15} />
                        {saving ? "Saving..." : "Save Settings"}
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
}