import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import { useToast } from "./ui/toast";
import {
  AlertTriangle,
  Bell,
  Calendar,
  ChevronRight,
  CreditCard,
  Globe,
  Link as LinkIcon,
  Lock,
  LogOut,
  Mail,
  MailCheck,
  MapPin,
  Save,
  Search,
  Shield,
  Smartphone,
  Ticket,
  Trash2,
  User2,
  Menu,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

const SETTINGS_TABS = [
  { id: "account", label: "Account", icon: <User2 size={18} /> },
  { id: "privacy", label: "Privacy", icon: <Lock size={18} /> },
  { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
  { id: "security", label: "Security", icon: <Shield size={18} /> },
  { id: "events", label: "Event Preferences", icon: <Ticket size={18} /> },
  { id: "billing", label: "Billing", icon: <CreditCard size={18} /> },
  { id: "apps", label: "Connected Apps", icon: <LinkIcon size={18} /> },
  { id: "support", label: "Support", icon: <MailCheck size={18} /> },
  { id: "danger", label: "Danger Zone", icon: <AlertTriangle size={18} /> },
];

const DEFAULT_STATE = {
  account: { name: "", username: "", email: "", phone: "", bio: "", currentPassword: "" },
  privacy: { showProfile: true, showActivity: false, searchable: true },
  notifications: {
    likes: true,
    comments: true,
    follows: true,
    eventReminders: true,
    emailAlerts: true,
    appPush: true,
    smsAlerts: false,
  },
  security: {
    twoFactorEnabled: false,
    currentPassword: "",
    newPassword: "",
  },
  eventPreferences: {
    defaultTicketPrice: 0,
    eventVisibility: "public",
    autoPublishEvents: false,
  },
  billing: {
    plan: "free",
    cycle: "monthly",
  },
};

const buildFormStateFromUser = (userData) => ({
  account: {
    name: userData?.name || "",
    username: userData?.username || "",
    email: userData?.email || "",
    phone: userData?.phone || "",
    bio: userData?.bio || "",
    currentPassword: "",
  },
  privacy: { ...DEFAULT_STATE.privacy, ...userData?.privacy },
  notifications: { ...DEFAULT_STATE.notifications, ...userData?.notifications },
  security: {
    ...DEFAULT_STATE.security,
    twoFactorEnabled: Boolean(userData?.security?.twoFactorEnabled),
  },
  eventPreferences: {
    ...DEFAULT_STATE.eventPreferences,
    ...userData?.eventPreferences,
  },
  billing: {
    ...DEFAULT_STATE.billing,
    plan: userData?.plan || "free",
    cycle: userData?.billing?.cycle || "monthly",
  },
});

function SettingsToggle({ checked, onChange, label, description, icon: Icon }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:border-pink-200">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-pink-50 flex items-center justify-center text-pink-500 flex-shrink-0">
          {Icon && <Icon size={16} />}
        </div>
        <div>
          <strong className="block text-sm font-bold text-gray-900">{label}</strong>
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0 ${checked ? "bg-pink-500" : "bg-gray-200"}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${checked ? "left-6" : "left-0.5"}`} />
      </button>
    </div>
  );
}

function SettingsSection({ title, description, children }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-0.5">{title}</h3>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function SettingsCard({ title, description, icon, action, children, tone }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${tone === "danger" ? "border-red-200" : ""}`}>
      <div className="p-5 pb-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center text-pink-500 flex-shrink-0">
              {icon}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900 mb-0.5">{title}</h2>
              <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
            </div>
          </div>
          {action && action}
        </div>
      </div>
      <div className="p-5 space-y-5">
        {children}
      </div>
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("account");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingState, setSavingState] = useState({});
  const [user, setUser] = useState(null);
  const [formState, setFormState] = useState(DEFAULT_STATE);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;

    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await API.get("/settings/me");
        if (cancelled) return;

        const userData = res.data?.user || res.data;
        setUser(userData);
        setFormState(buildFormStateFromUser(userData));
      } catch (error) {
        toast.error("Could not load your settings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSettings();

    return () => {
      cancelled = true;
    };
  }, [toast]);

  const integrations = useMemo(
    () => [
      {
        key: "googleCalendar",
        name: "Google Calendar",
        description: "Push event schedules into your calendar workflow.",
        status: user?.integrations?.googleCalendar?.label || "Not connected",
      },
      {
        key: "zoom",
        name: "Zoom",
        description: "Attach a live meeting room to virtual events.",
        status: user?.integrations?.zoom?.label || "Not connected",
      },
    ],
    [user?.integrations],
  );

  const updateSection = (section, field, value) => {
    setFormState((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  };

  const withSaving = async (key, callback, successMessage) => {
    try {
      setSavingState((current) => ({ ...current, [key]: true }));
      const nextUser = await callback();
      if (nextUser) {
        setUser(nextUser);
        localStorage.setItem("user", JSON.stringify(nextUser));
        setFormState(buildFormStateFromUser(nextUser));
      }
      toast.success(successMessage);
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setSavingState((current) => ({ ...current, [key]: false }));
    }
  };

  const saveAccount = () =>
    withSaving(
      "account",
      async () => {
        const { data } = await API.put("/settings/account", formState.account);
        return data.user;
      },
      "Account settings saved",
    );

  const savePrivacy = () =>
    withSaving(
      "privacy",
      async () => {
        const { data } = await API.put("/settings/privacy", formState.privacy);
        return data.user;
      },
      "Privacy settings updated",
    );

  const saveNotifications = () =>
    withSaving(
      "notifications",
      async () => {
        const { data } = await API.put("/settings/notifications", formState.notifications);
        return data.user;
      },
      "Notification settings updated",
    );

  const saveSecurity = () =>
    withSaving(
      "security",
      async () => {
        const { data } = await API.put("/settings/security", formState.security);
        return data.user;
      },
      "Security settings updated",
    );

  const saveEventPreferences = () =>
    withSaving(
      "events",
      async () => {
        const { data } = await API.put("/settings/event-preferences", formState.eventPreferences);
        return data.user;
      },
      "Event preferences updated",
    );

  const saveBilling = () =>
    withSaving(
      "billing",
      async () => {
        const { data } = await API.post("/billing/initialize", {
          plan: formState.billing.plan,
          interval: formState.billing.cycle,
        });
        if (data?.authorization_url) {
          window.location.href = data.authorization_url;
          return null;
        }
        return data.user;
      },
      "Billing initialized",
    );

  const deactivateAccount = async () => {
    if (!user?._id && !user?.id) return;

    const confirmed = window.confirm(
      "Are you sure you want to deactivate your account? This will log you out immediately.",
    );
    if (!confirmed) return;

    const currentPassword = window.prompt("Enter your current password to deactivate your account.");
    if (currentPassword === null) return;

    try {
      await API.post("/settings/deactivate", { currentPassword: currentPassword || "" });
      toast.success("Account deactivated");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not deactivate your account");
    }
  };

  const logoutEverywhere = async () => {
    const currentPassword = window.prompt("Enter your current password to log out all devices.");
    if (currentPassword === null) return;

    try {
      await API.post("/settings/logout-all", { currentPassword });
      toast.success("All active sessions have been logged out");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not log out all devices");
    }
  };

  const exportData = async () => {
    try {
      const response = await API.get("/settings/export", { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tickispot-settings-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Your account data export is ready");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not export account data");
    }
  };

  const handleIntegrationAction = async (integrationKey) => {
    const currentlyConnected = Boolean(user?.integrations?.[integrationKey]?.connected);

    if (currentlyConnected) {
      return withSaving(
        `integration-${integrationKey}`,
        async () => {
          const { data } = await API.put(`/settings/integrations/${integrationKey}`, { connected: false });
          return data.user;
        },
        "Integration disconnected",
      );
    }

    try {
      setSavingState((current) => ({ ...current, [`integration-${integrationKey}`]: true }));
      const { data } = await API.get(`/settings/integrations/${integrationKey}/auth-url`);
      const popup = window.open(data.authUrl, "tickispot-oauth", "width=640,height=720");
      if (!popup) {
        toast.error("Please allow popups to connect this app.");
        return;
      }

      await new Promise((resolve) => {
        const handleMessage = async (event) => {
          if (event.data?.source !== "tickispot-integration") return;
          window.removeEventListener("message", handleMessage);
          if (event.data?.status === "success") {
            try {
              const refresh = await API.get("/settings/me");
              const nextUser = refresh.data?.user || refresh.data;
              setUser(nextUser);
              setFormState(buildFormStateFromUser(nextUser));
              localStorage.setItem("user", JSON.stringify(nextUser));
            } catch (error) {
              // Silently handle refresh failure
            }
            toast.success(event.data?.message || "Integration connected");
          } else {
            toast.error(event.data?.message || "Integration failed");
          }
          resolve();
        };

        window.addEventListener("message", handleMessage);
        const timer = window.setInterval(() => {
          if (popup.closed) {
            window.clearInterval(timer);
            window.removeEventListener("message", handleMessage);
            resolve();
          }
        }, 500);
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update integration");
    } finally {
      setSavingState((current) => ({ ...current, [`integration-${integrationKey}`]: false }));
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "account":
        return (
          <SettingsCard
            title="Account"
            description="Manage your identity, contact details, and core profile information."
            icon={<User2 size={18} />}
            action={
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-pink-500 text-white text-sm font-bold transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 disabled:opacity-50 shadow-md shadow-pink-500/25"
                onClick={saveAccount}
                disabled={savingState.account}
              >
                <Save size={16} />
                {savingState.account ? "Saving..." : "Save account"}
              </button>
            }
          >
            <SettingsSection title="Profile details" description="These details appear across TickiSpot wherever your account is shown.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Name</span>
                  <input value={formState.account.name} onChange={(e) => updateSection("account", "name", e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Username</span>
                  <input value={formState.account.username} onChange={(e) => updateSection("account", "username", e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Email</span>
                  <input type="email" value={formState.account.email} onChange={(e) => updateSection("account", "email", e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Phone</span>
                  <input value={formState.account.phone} onChange={(e) => updateSection("account", "phone", e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Current password</span>
                  <input type="password" placeholder="Required only for sensitive changes" value={formState.account.currentPassword} onChange={(e) => updateSection("account", "currentPassword", e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none" />
                </label>
                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Bio</span>
                  <textarea rows={4} value={formState.account.bio} onChange={(e) => updateSection("account", "bio", e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none resize-y" />
                </label>
              </div>
            </SettingsSection>
            <SettingsSection title="Password" description="Password controls live in Security so sensitive actions stay in one place.">
              <button type="button" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-gray-200 bg-white text-gray-600 text-sm font-bold transition-all duration-200 hover:border-pink-300 hover:text-pink-500" onClick={() => setActiveTab("security")}>
                Manage password in Security
              </button>
            </SettingsSection>
          </SettingsCard>
        );
      case "privacy":
        return (
          <SettingsCard
            title="Privacy"
            description="Choose how visible your identity and activity should be on the platform."
            icon={<Lock size={18} />}
            action={
              <button type="button" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-pink-500 text-white text-sm font-bold transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 disabled:opacity-50 shadow-md shadow-pink-500/25" onClick={savePrivacy} disabled={savingState.privacy}>
                <Save size={16} />
                {savingState.privacy ? "Saving..." : "Save privacy"}
              </button>
            }
          >
            <SettingsToggle checked={formState.privacy.showProfile} onChange={() => updateSection("privacy", "showProfile", !formState.privacy.showProfile)} label="Show profile publicly" description="Allow people outside your network to access your public profile." icon={Globe} />
            <SettingsToggle checked={formState.privacy.showActivity} onChange={() => updateSection("privacy", "showActivity", !formState.privacy.showActivity)} label="Show activity" description="Display your likes and attendance activity on your profile." icon={MapPin} />
            <SettingsToggle checked={formState.privacy.searchable} onChange={() => updateSection("privacy", "searchable", !formState.privacy.searchable)} label="Search visibility" description="Let other people discover your account through search." icon={Search} />
          </SettingsCard>
        );
      case "notifications":
        return (
          <SettingsCard
            title="Notifications"
            description="Decide which events trigger alerts and where those alerts should reach you."
            icon={<Bell size={18} />}
            action={
              <button type="button" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-pink-500 text-white text-sm font-bold transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 disabled:opacity-50 shadow-md shadow-pink-500/25" onClick={saveNotifications} disabled={savingState.notifications}>
                <Save size={16} />
                {savingState.notifications ? "Saving..." : "Save notifications"}
              </button>
            }
          >
            <SettingsSection title="Activity alerts" description="Choose the social activity you care about most.">
              <SettingsToggle checked={formState.notifications.likes} onChange={() => updateSection("notifications", "likes", !formState.notifications.likes)} label="Likes" description="Get notified when someone likes your event." icon={Bell} />
              <SettingsToggle checked={formState.notifications.comments} onChange={() => updateSection("notifications", "comments", !formState.notifications.comments)} label="Comments" description="Get notified when someone comments on your event." icon={Bell} />
              <SettingsToggle checked={formState.notifications.follows} onChange={() => updateSection("notifications", "follows", !formState.notifications.follows)} label="Follows" description="Get notified when another user follows you." icon={Bell} />
              <SettingsToggle checked={formState.notifications.eventReminders} onChange={() => updateSection("notifications", "eventReminders", !formState.notifications.eventReminders)} label="Event reminders" description="Remind me when my upcoming events are close." icon={Calendar} />
            </SettingsSection>
            <SettingsSection title="Delivery channels" description="Control where TickiSpot sends updates.">
              <SettingsToggle checked={formState.notifications.emailAlerts} onChange={() => updateSection("notifications", "emailAlerts", !formState.notifications.emailAlerts)} label="Email alerts" description="Receive important updates in your inbox." icon={Mail} />
              <SettingsToggle checked={formState.notifications.appPush} onChange={() => updateSection("notifications", "appPush", !formState.notifications.appPush)} label="Push alerts" description="Receive in-app alerts in real time." icon={Bell} />
              <SettingsToggle checked={formState.notifications.smsAlerts} onChange={() => updateSection("notifications", "smsAlerts", !formState.notifications.smsAlerts)} label="SMS alerts" description="Receive urgent reminders by text message." icon={Smartphone} />
            </SettingsSection>
          </SettingsCard>
        );
      case "security":
        return (
          <SettingsCard
            title="Security"
            description="Protect your account with stronger authentication and credential controls."
            icon={<Shield size={18} />}
            action={
              <button type="button" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-pink-500 text-white text-sm font-bold transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 disabled:opacity-50 shadow-md shadow-pink-500/25" onClick={saveSecurity} disabled={savingState.security}>
                <Save size={16} />
                {savingState.security ? "Saving..." : "Save security"}
              </button>
            }
          >
            <SettingsSection title="Authentication" description="Keep your account protected.">
              <SettingsToggle checked={formState.security.twoFactorEnabled} onChange={() => updateSection("security", "twoFactorEnabled", !formState.security.twoFactorEnabled)} label="Two-factor authentication" description="Require an extra verification step when signing in." icon={Shield} />
            </SettingsSection>
            <SettingsSection title="Change password" description="Update your password anytime.">
              <div className="grid grid-cols-1 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Current password</span>
                  <input type="password" value={formState.security.currentPassword} onChange={(e) => updateSection("security", "currentPassword", e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">New password</span>
                  <input type="password" value={formState.security.newPassword} onChange={(e) => updateSection("security", "newPassword", e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none" />
                </label>
              </div>
            </SettingsSection>
            <SettingsSection title="Login activity" description="A lightweight overview of your recent access.">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 bg-white">
                  <span className="text-sm text-gray-500">Last account update</span>
                  <strong className="text-sm font-bold text-gray-900">{user?.updatedAt ? new Date(user.updatedAt).toLocaleString() : "Unavailable"}</strong>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 bg-white">
                  <span className="text-sm text-gray-500">Password last changed</span>
                  <strong className="text-sm font-bold text-gray-900">{user?.security?.lastPasswordChange ? new Date(user.security.lastPasswordChange).toLocaleString() : "Not recorded yet"}</strong>
                </div>
              </div>
            </SettingsSection>
          </SettingsCard>
        );
      case "events":
        return (
          <SettingsCard
            title="Event Preferences"
            description="Set the defaults TickiSpot should use when you create new events."
            icon={<Ticket size={18} />}
            action={
              <button type="button" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-pink-500 text-white text-sm font-bold transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 disabled:opacity-50 shadow-md shadow-pink-500/25" onClick={saveEventPreferences} disabled={savingState.events}>
                <Save size={16} />
                {savingState.events ? "Saving..." : "Save preferences"}
              </button>
            }
          >
            <div className="grid grid-cols-1 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Default ticket price</span>
                <input type="number" min="0" value={formState.eventPreferences.defaultTicketPrice} onChange={(e) => updateSection("eventPreferences", "defaultTicketPrice", Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Default visibility</span>
                <select value={formState.eventPreferences.eventVisibility} onChange={(e) => updateSection("eventPreferences", "eventVisibility", e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none appearance-none bg-no-repeat" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundPosition: "right 0.75rem center" }}>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </label>
            </div>
            <SettingsToggle checked={formState.eventPreferences.autoPublishEvents} onChange={() => updateSection("eventPreferences", "autoPublishEvents", !formState.eventPreferences.autoPublishEvents)} label="Auto-publish events" description="Publish new events immediately after creation instead of saving as drafts." icon={Calendar} />
          </SettingsCard>
        );
      case "billing":
        return (
          <SettingsCard
            title="Billing"
            description="View your current plan and manage the billing tier attached to your account."
            icon={<CreditCard size={18} />}
            action={
              <button type="button" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-pink-500 text-white text-sm font-bold transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 disabled:opacity-50 shadow-md shadow-pink-500/25" onClick={saveBilling} disabled={savingState.billing}>
                <Save size={16} />
                {savingState.billing ? "Saving..." : "Save billing"}
              </button>
            }
          >
            <div className="p-4 rounded-xl border border-pink-200 bg-gradient-to-br from-pink-50/50 to-transparent">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-pink-100 text-pink-600 text-[0.6rem] font-bold uppercase tracking-wide">Current plan</span>
              <h3 className="text-lg font-extrabold text-gray-900 mt-2 mb-1 capitalize">{user?.billing?.plan || "Free"}</h3>
              <p className="text-sm text-gray-500 mb-3">Next billing date: {user?.billing?.nextBillingDate ? new Date(user.billing.nextBillingDate).toLocaleDateString() : "N/A"}</p>
              <Link to="/billing" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-gray-200 bg-white text-gray-600 text-sm font-bold transition-all duration-200 hover:border-pink-300 hover:text-pink-500">Manage billing</Link>
            </div>
            <SettingsSection title="Plan selection" description="Choose the workspace tier that fits your needs.">
              <div className="grid grid-cols-1 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Workspace plan</span>
                  <select value={formState.billing.plan} onChange={(e) => updateSection("billing", "plan", e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none">
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="business">Business</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Billing cycle</span>
                  <select value={formState.billing.cycle} onChange={(e) => updateSection("billing", "cycle", e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none">
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </label>
              </div>
            </SettingsSection>
            <SettingsSection title="Payment method" description="Manage how TickiSpot charges your workspace.">
              <div className="p-3 rounded-xl border border-gray-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm text-gray-500">Primary method</span>
                  <strong className="text-sm font-bold text-gray-900">Not added</strong>
                </div>
              </div>
            </SettingsSection>
          </SettingsCard>
        );
      case "apps":
        return (
          <SettingsCard title="Connected Apps" description="Only real integrations are shown here. Enable them as they become available." icon={<LinkIcon size={18} />}>
            <div className="space-y-3">
              {integrations.map((integration) => (
                <div key={integration.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:border-pink-200">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-0.5">{integration.name}</h3>
                    <p className="text-sm text-gray-500 mb-1">{integration.description}</p>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">{integration.status}</span>
                  </div>
                  <button onClick={() => handleIntegrationAction(integration.key)} disabled={savingState[`integration-${integration.key}`]} className="px-4 py-2 rounded-full border-2 border-gray-200 bg-white text-gray-600 text-sm font-bold transition-all duration-200 hover:border-pink-300 hover:text-pink-500 disabled:opacity-50 whitespace-nowrap">
                    {savingState[`integration-${integration.key}`] ? "Saving..." : user?.integrations?.[integration.key]?.connected ? "Disconnect" : "Connect"}
                  </button>
                </div>
              ))}
            </div>
          </SettingsCard>
        );
      case "support":
        return (
          <SettingsCard title="Support & Contact" description="Need help? We're here for you." icon={<Mail size={18} />}>
            <SettingsSection title="Get in Touch" description="Reach out to our team anytime.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a href="mailto:support@tickispot.com" className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:border-pink-300 hover:bg-pink-50/30 hover:-translate-y-0.5">
                  <Mail size={28} className="text-gray-400" />
                  <div>
                    <strong className="block text-sm font-bold text-gray-900">Email Us</strong>
                    <p className="text-xs text-gray-500">support@tickispot.com</p>
                    <span className="text-xs text-gray-400">Usually reply within 24 hours</span>
                  </div>
                </a>
                <a href="https://wa.me/2349056911562" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:border-pink-300 hover:bg-pink-50/30 hover:-translate-y-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 24 24" className="text-gray-400">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.198.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.485-.888-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.52-.075-.149-.669-1.612-.917-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.372-.01-.572-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  </svg>
                  <div>
                    <strong className="block text-sm font-bold text-gray-900">Chat on WhatsApp</strong>
                    <p className="text-xs text-gray-500">Fastest way to get help</p>
                    <span className="text-xs text-gray-400">Available 9AM - 6PM</span>
                  </div>
                </a>
              </div>
            </SettingsSection>
            <SettingsSection title="Help Resources" description="Quick answers and guides.">
              <div className="space-y-2">
                <a href="/help" className="block p-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-sm font-semibold transition-all duration-200 hover:bg-pink-500 hover:border-pink-500 hover:text-white">📖 Help Center</a>
                <a href="/faq" className="block p-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-sm font-semibold transition-all duration-200 hover:bg-pink-500 hover:border-pink-500 hover:text-white">❓ Frequently Asked Questions</a>
                <a href="/contact" className="block p-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-sm font-semibold transition-all duration-200 hover:bg-pink-500 hover:border-pink-500 hover:text-white">📍 Contact Form</a>
              </div>
            </SettingsSection>
          </SettingsCard>
        );
      case "danger":
        return (
          <SettingsCard title="Danger Zone" description="High-impact actions that affect your account across the product." icon={<AlertTriangle size={18} />} tone="danger">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 bg-white">
                <div>
                  <h3 className="font-bold text-gray-900 mb-0.5">Deactivate account</h3>
                  <p className="text-sm text-gray-500">Hide your account and end your session immediately.</p>
                </div>
                <button onClick={deactivateAccount} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-500 text-white text-sm font-bold transition-all duration-200 hover:bg-red-600 shadow-md shadow-red-500/25 whitespace-nowrap">
                  <Trash2 size={16} /> Deactivate
                </button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 bg-white">
                <div>
                  <h3 className="font-bold text-gray-900 mb-0.5">Logout all devices</h3>
                  <p className="text-sm text-gray-500">Sign out from all browsers and mobile sessions.</p>
                </div>
                <button onClick={logoutEverywhere} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-gray-200 bg-white text-gray-600 text-sm font-bold transition-all duration-200 hover:border-pink-300 hover:text-pink-500 whitespace-nowrap">
                  <LogOut size={16} /> Logout all
                </button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 bg-white">
                <div>
                  <h3 className="font-bold text-gray-900 mb-0.5">Export data</h3>
                  <p className="text-sm text-gray-500">Request a copy of your TickiSpot account data.</p>
                </div>
                <button onClick={exportData} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-gray-200 bg-white text-gray-600 text-sm font-bold transition-all duration-200 hover:border-pink-300 hover:text-pink-500 whitespace-nowrap">
                  Export
                </button>
              </div>
            </div>
          </SettingsCard>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-full w-full bg-gray-50 font-geist px-4 sm:px-6 lg:px-8 pb-16 ">
      {/* Mobile Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between gap-4 py-3 px-1 bg-gray-50/95 backdrop-blur-sm md:hidden">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">Settings</h1>
          <p className="text-xs text-gray-400">Manage your workspace</p>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center">
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mb-4 p-2 rounded-xl border border-gray-200 bg-white shadow-sm md:hidden">
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id ? "bg-pink-50 text-pink-500" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="flex-shrink-0">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-5">
        {/* Sidebar */}
        <aside className="sticky top-6 h-fit p-4 bg-white rounded-xl border border-gray-200 shadow-sm hidden md:block">
          <div className="pb-3 border-b border-gray-100">
            <h1 className="text-lg font-extrabold tracking-tight text-gray-900">Settings</h1>
            <p className="text-xs text-gray-400 mt-0.5">Professional controls for your TickiSpot account.</p>
          </div>
          <nav className="flex flex-col gap-1 mt-3">
            {SETTINGS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.id ? "bg-pink-50 text-pink-500 border border-pink-200" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="flex-shrink-0">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex flex-col gap-4 min-w-0">
          {loading ? (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-pulse">
    {/* Card header skeleton */}
    <div className="p-5 pb-4 border-b border-gray-100 flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-4 w-32 bg-gray-100 rounded" />
        <div className="h-3 w-56 bg-gray-100 rounded" />
      </div>
      <div className="h-9 w-28 rounded-full bg-gray-100 flex-shrink-0" />
    </div>
    {/* Fields skeleton */}
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-2.5 w-16 bg-gray-100 rounded" />
            <div className="h-11 bg-gray-100 rounded-xl" />
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <div className="h-2.5 w-10 bg-gray-100 rounded" />
        <div className="h-24 bg-gray-100 rounded-xl" />
      </div>
    </div>
  </div>
) : (
  renderTabContent()
)}
        </main>
      </div>
    </div>
  );
}