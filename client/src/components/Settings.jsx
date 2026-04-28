import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import { useToast } from "./ui/toast";
import SettingsCard from "./settings/SettingsCard";
import SettingsSection from "./settings/SettingsSection";
import SettingsToggle from "./settings/SettingsToggle";
import "./css/Settings.css";
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
  MapPin,
  Save,
  Search,
  Shield,
  Smartphone,
  Ticket,
  Trash2,
  User2,
} from "lucide-react";

const SETTINGS_TABS = [
  { id: "account", label: "Account", icon: <User2 size={18} /> },
  { id: "privacy", label: "Privacy", icon: <Lock size={18} /> },
  { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
  { id: "security", label: "Security", icon: <Shield size={18} /> },
  { id: "events", label: "Event Preferences", icon: <Ticket size={18} /> },
  { id: "billing", label: "Billing", icon: <CreditCard size={18} /> },
  { id: "apps", label: "Connected Apps", icon: <LinkIcon size={18} /> },
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
        console.error("Failed to fetch settings:", error);
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
        key: "stripe",
        name: "Stripe",
        description: "Accept payments and payouts for your events.",
        status: user?.integrations?.stripe?.label || "Not connected",
      },
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
      console.error(`${key} save failed:`, error);
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
      console.error("Failed to deactivate account:", error);
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
      console.error("Failed to log out all devices:", error);
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
      console.error("Failed to export data:", error);
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
              console.error("Failed to refresh settings after OAuth:", error);
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
      console.error("Integration action failed:", error);
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
                className="settings-primary-button"
                onClick={saveAccount}
                disabled={savingState.account}
              >
                <Save size={16} />
                {savingState.account ? "Saving..." : "Save account"}
              </button>
            }
          >
            <SettingsSection
              title="Profile details"
              description="These details appear across TickiSpot wherever your account is shown."
            >
              <div className="settings-form-grid">
                <label className="settings-field">
                  <span>Name</span>
                  <input value={formState.account.name} onChange={(event) => updateSection("account", "name", event.target.value)} />
                </label>
                <label className="settings-field">
                  <span>Username</span>
                  <input value={formState.account.username} onChange={(event) => updateSection("account", "username", event.target.value)} />
                </label>
                <label className="settings-field">
                  <span>Email</span>
                  <input type="email" value={formState.account.email} onChange={(event) => updateSection("account", "email", event.target.value)} />
                </label>
                <label className="settings-field">
                  <span>Phone</span>
                  <input value={formState.account.phone} onChange={(event) => updateSection("account", "phone", event.target.value)} />
                </label>
                <label className="settings-field">
                  <span>Current password</span>
                  <input
                    type="password"
                    placeholder="Required only for sensitive changes"
                    value={formState.account.currentPassword}
                    onChange={(event) => updateSection("account", "currentPassword", event.target.value)}
                  />
                </label>
                <label className="settings-field settings-field-full">
                  <span>Bio</span>
                  <textarea rows={4} value={formState.account.bio} onChange={(event) => updateSection("account", "bio", event.target.value)} />
                </label>
              </div>
            </SettingsSection>
            <SettingsSection title="Password" description="Password controls live in Security so sensitive actions stay in one place.">
              <button type="button" className="settings-secondary-button" onClick={() => setActiveTab("security")}>
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
              <button type="button" className="settings-primary-button" onClick={savePrivacy} disabled={savingState.privacy}>
                <Save size={16} />
                {savingState.privacy ? "Saving..." : "Save privacy"}
              </button>
            }
          >
            <SettingsToggle checked={formState.privacy.showProfile} onChange={() => updateSection("privacy", "showProfile", !formState.privacy.showProfile)} label="Show profile publicly" description="Allow people outside your network to access your public profile." icon={<Globe size={16} />} />
            <SettingsToggle checked={formState.privacy.showActivity} onChange={() => updateSection("privacy", "showActivity", !formState.privacy.showActivity)} label="Show activity" description="Display your likes and attendance activity on your profile." icon={<MapPin size={16} />} />
            <SettingsToggle checked={formState.privacy.searchable} onChange={() => updateSection("privacy", "searchable", !formState.privacy.searchable)} label="Search visibility" description="Let other people discover your account through search." icon={<Search size={16} />} />
          </SettingsCard>
        );
      case "notifications":
        return (
          <SettingsCard
            title="Notifications"
            description="Decide which events trigger alerts and where those alerts should reach you."
            icon={<Bell size={18} />}
            action={
              <button type="button" className="settings-primary-button" onClick={saveNotifications} disabled={savingState.notifications}>
                <Save size={16} />
                {savingState.notifications ? "Saving..." : "Save notifications"}
              </button>
            }
          >
            <SettingsSection title="Activity alerts" description="Choose the social activity you care about most.">
              <SettingsToggle checked={formState.notifications.likes} onChange={() => updateSection("notifications", "likes", !formState.notifications.likes)} label="Likes" description="Get notified when someone likes your event." icon={<Bell size={16} />} />
              <SettingsToggle checked={formState.notifications.comments} onChange={() => updateSection("notifications", "comments", !formState.notifications.comments)} label="Comments" description="Get notified when someone comments on your event." icon={<Bell size={16} />} />
              <SettingsToggle checked={formState.notifications.follows} onChange={() => updateSection("notifications", "follows", !formState.notifications.follows)} label="Follows" description="Get notified when another user follows you." icon={<Bell size={16} />} />
              <SettingsToggle checked={formState.notifications.eventReminders} onChange={() => updateSection("notifications", "eventReminders", !formState.notifications.eventReminders)} label="Event reminders" description="Remind me when my upcoming events are close." icon={<Calendar size={16} />} />
            </SettingsSection>
            <SettingsSection title="Delivery channels" description="Control where TickiSpot sends updates.">
              <SettingsToggle checked={formState.notifications.emailAlerts} onChange={() => updateSection("notifications", "emailAlerts", !formState.notifications.emailAlerts)} label="Email alerts" description="Receive important updates in your inbox." icon={<Mail size={16} />} />
              <SettingsToggle checked={formState.notifications.appPush} onChange={() => updateSection("notifications", "appPush", !formState.notifications.appPush)} label="Push alerts" description="Receive in-app alerts in real time." icon={<Bell size={16} />} />
              <SettingsToggle checked={formState.notifications.smsAlerts} onChange={() => updateSection("notifications", "smsAlerts", !formState.notifications.smsAlerts)} label="SMS alerts" description="Receive urgent reminders by text message." icon={<Smartphone size={16} />} />
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
              <button type="button" className="settings-primary-button" onClick={saveSecurity} disabled={savingState.security}>
                <Save size={16} />
                {savingState.security ? "Saving..." : "Save security"}
              </button>
            }
          >
            <SettingsSection title="Authentication" description="Keep your account protected.">
              <SettingsToggle checked={formState.security.twoFactorEnabled} onChange={() => updateSection("security", "twoFactorEnabled", !formState.security.twoFactorEnabled)} label="Two-factor authentication" description="Require an extra verification step when signing in." icon={<Shield size={16} />} />
            </SettingsSection>
            <SettingsSection title="Change password" description="Update your password anytime.">
              <div className="settings-form-grid">
                <label className="settings-field">
                  <span>Current password</span>
                  <input type="password" value={formState.security.currentPassword} onChange={(event) => updateSection("security", "currentPassword", event.target.value)} />
                </label>
                <label className="settings-field">
                  <span>New password</span>
                  <input type="password" value={formState.security.newPassword} onChange={(event) => updateSection("security", "newPassword", event.target.value)} />
                </label>
              </div>
            </SettingsSection>
            <SettingsSection title="Login activity" description="A lightweight overview of your recent access.">
              <div className="settings-info-list">
                <div className="settings-info-row">
                  <span>Last account update</span>
                  <strong>{user?.updatedAt ? new Date(user.updatedAt).toLocaleString() : "Unavailable"}</strong>
                </div>
                <div className="settings-info-row">
                  <span>Password last changed</span>
                  <strong>{user?.security?.lastPasswordChange ? new Date(user.security.lastPasswordChange).toLocaleString() : "Not recorded yet"}</strong>
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
              <button type="button" className="settings-primary-button" onClick={saveEventPreferences} disabled={savingState.events}>
                <Save size={16} />
                {savingState.events ? "Saving..." : "Save preferences"}
              </button>
            }
          >
            <div className="settings-form-grid">
              <label className="settings-field">
                <span>Default ticket price</span>
                <input type="number" min="0" value={formState.eventPreferences.defaultTicketPrice} onChange={(event) => updateSection("eventPreferences", "defaultTicketPrice", Number(event.target.value))} />
              </label>
              <label className="settings-field">
                <span>Default visibility</span>
                <select value={formState.eventPreferences.eventVisibility} onChange={(event) => updateSection("eventPreferences", "eventVisibility", event.target.value)}>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </label>
            </div>
            <SettingsToggle checked={formState.eventPreferences.autoPublishEvents} onChange={() => updateSection("eventPreferences", "autoPublishEvents", !formState.eventPreferences.autoPublishEvents)} label="Auto-publish events" description="Publish new events immediately after creation instead of saving as drafts." icon={<Calendar size={16} />} />
          </SettingsCard>
        );
      case "billing":
        return (
          <SettingsCard
            title="Billing"
            description="View your current plan and manage the billing tier attached to your account."
            icon={<CreditCard size={18} />}
            action={
              <button type="button" className="settings-primary-button" onClick={saveBilling} disabled={savingState.billing}>
                <Save size={16} />
                {savingState.billing ? "Saving..." : "Save billing"}
              </button>
            }
          >
            <div className="settings-billing-hero">
              <div>
                <span className="settings-chip">Current plan</span>
                <h3>{user?.billing?.plan || "Free"}</h3>
                <p>
                  Next billing date:{" "}
                  {user?.billing?.nextBillingDate
                    ? new Date(user.billing.nextBillingDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
            <SettingsSection title="Plan selection" description="Choose the workspace tier that fits your needs.">
              <div className="settings-form-grid">
                <label className="settings-field">
                  <span>Workspace plan</span>
                  <select value={formState.billing.plan} onChange={(event) => updateSection("billing", "plan", event.target.value)}>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="business">Business</option>
                  </select>
                </label>
                <label className="settings-field">
                  <span>Billing cycle</span>
                  <select value={formState.billing.cycle} onChange={(event) => updateSection("billing", "cycle", event.target.value)}>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </label>
              </div>
            </SettingsSection>
            <SettingsSection title="Payment method" description="Manage how TickiSpot charges your workspace.">
              <div className="settings-info-list">
                <div className="settings-info-row">
                  <span>Primary method</span>
                  <strong>Not added</strong>
                </div>
              </div>
            </SettingsSection>
          </SettingsCard>
        );
      case "apps":
        return (
          <SettingsCard title="Connected Apps" description="Only real integrations are shown here. Enable them as they become available." icon={<LinkIcon size={18} />}>
            <div className="settings-integration-list">
              {integrations.map((integration) => (
                <div key={integration.key} className="settings-integration-card">
                  <div>
                    <h3>{integration.name}</h3>
                    <p>{integration.description}</p>
                    <span className="settings-integration-status">{integration.status}</span>
                  </div>
                  <button
                    type="button"
                    className="settings-secondary-button"
                    onClick={() => handleIntegrationAction(integration.key)}
                    disabled={savingState[`integration-${integration.key}`]}
                  >
                    {savingState[`integration-${integration.key}`]
                      ? "Saving..."
                      : user?.integrations?.[integration.key]?.connected
                        ? "Disconnect"
                        : "Connect"}
                  </button>
                </div>
              ))}
            </div>
          </SettingsCard>
        );
      case "danger":
        return (
          <SettingsCard title="Danger Zone" description="High-impact actions that affect your account across the product." icon={<AlertTriangle size={18} />} tone="danger">
            <div className="settings-danger-list">
              <div className="settings-danger-item">
                <div>
                  <h3>Deactivate account</h3>
                  <p>Hide your account and end your session immediately.</p>
                </div>
                <button type="button" className="settings-danger-button" onClick={deactivateAccount}>
                  <Trash2 size={16} />
                  Deactivate
                </button>
              </div>
              <div className="settings-danger-item">
                <div>
                  <h3>Logout all devices</h3>
                  <p>Sign out from all browsers and mobile sessions.</p>
                </div>
                <button type="button" className="settings-secondary-button" onClick={logoutEverywhere}>
                  <LogOut size={16} />
                  Logout all
                </button>
              </div>
              <div className="settings-danger-item">
                <div>
                  <h3>Export data</h3>
                  <p>Request a copy of your TickiSpot account data.</p>
                </div>
                <button type="button" className="settings-secondary-button" onClick={exportData}>
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
    <div className="settings-shell">
      <header className="settings-mobile-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your workspace</p>
        </div>
        <button type="button" className="settings-mobile-toggle" onClick={() => setMobileMenuOpen((current) => !current)}>
          <ChevronRight size={22} className={mobileMenuOpen ? "is-open" : ""} />
        </button>
      </header>

      <div className={`settings-mobile-drawer ${mobileMenuOpen ? "is-open" : ""}`}>
        {SETTINGS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`settings-nav-item ${activeTab === tab.id ? "is-active" : ""}`}
            onClick={() => {
              setActiveTab(tab.id);
              setMobileMenuOpen(false);
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="settings-layout">
        <aside className="settings-sidebar">
          <div className="settings-sidebar-header">
            <h1>Settings</h1>
            <p>Professional controls for your TickiSpot account.</p>
          </div>
          <nav className="settings-nav">
            {SETTINGS_TABS.map((tab) => (
              <button key={tab.id} type="button" className={`settings-nav-item ${activeTab === tab.id ? "is-active" : ""}`} onClick={() => setActiveTab(tab.id)}>
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="settings-content">
          {loading ? (
            <div className="settings-loading-card">
              <div className="settings-loading-spinner" />
              <p>Loading your settings...</p>
            </div>
          ) : (
            renderTabContent()
          )}
        </main>
      </div>
    </div>
  );
}
