import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios";
import "./css/Settings.css";
import ToggleSwitch from "./ToggleSwitch";
import EditProfileModal from "./EditProfileModal";
import {
  User,
  Lock,
  Bell,
  CreditCard,
  Link as LinkIcon,
  AlertTriangle,
  ChevronRight,
  Save,
  Mail,
  Smartphone,
  Globe,
  Eye,
  Search,
  DollarSign,
  Calendar,
  Shield,
  LogOut,
  Trash2,
  User2,
} from "lucide-react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("privacy");
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  // Privacy
  const [privacy, setPrivacy] = useState({
    showProfile: true,
    showActivity: false,
    searchable: true,
  });

  // Notifications
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    appPush: true,
    newsletter: false,
  });

  // Billing
  const [billing, setBilling] = useState({
    plan: "Free",
    nextBillingDate: "N/A",
    paymentMethod: "Not added",
  });

  const [saving, setSaving] = useState(false);
  const { id } = useParams();

  // 🧩 Fetch Logged-in User
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get(`/settings/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const userData = res.data.user || res.data;
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };
    fetchUser();
  }, [id]);

  // 🔒 Handle Privacy
  const handlePrivacyChange = (field) => {
    setPrivacy((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const savePrivacySettings = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      await API.put(`/settings/${id}/privacy`, privacy, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showNotification("Privacy settings saved successfully!", "success");
    } catch (error) {
      console.error("Error saving privacy settings:", error);
      showNotification("Failed to save privacy settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  // 🔔 Handle Notifications
  const handleNotificationChange = (field) => {
    setNotifications((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const saveNotificationSettings = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      await API.put(`/settings/notifications/${id}`, notifications, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showNotification("Notification settings saved!", "success");
    } catch (error) {
      console.error("Error saving notifications:", error);
      showNotification("Failed to save notifications.", "error");
    } finally {
      setSaving(false);
    }
  };

  // 💳 Handle Billing
  const handleUpgradePlan = () => {
    showNotification("Redirecting to billing portal...", "info");
  };

  const handleAddPaymentMethod = () => {
    showNotification("Payment method setup coming soon!", "info");
  };

  // ⚠️ Handle Account Deletion
  const deleteAccount = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete your account? This cannot be undone!",
      )
    )
      return;
    try {
      const token = localStorage.getItem("token");
      await API.put(
  `/profile/${user._id}/deactivate`,
  {},
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);
      showNotification("Your account has been deactivated (you can restore it later).", "success");
      localStorage.removeItem("token");
      window.location.href = "/";
    } catch (error) {
      console.error("Error deleting account:", error);
      showNotification("Failed to delete account.", "error");
    }
  };

  // Show notification helper
  const showNotification = (message, type) => {
    alert(message);
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: <User2 size={18} /> },
    { id: "privacy", label: "Privacy", icon: <Lock size={18} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
    { id: "billing", label: "Billing", icon: <CreditCard size={18} /> },
    { id: "apps", label: "Connected Apps", icon: <LinkIcon size={18} /> },
    { id: "danger", label: "Danger Zone", icon: <AlertTriangle size={18} /> },
  ];

  return (
    <div className="settings-page">
      {/* Mobile Header */}
      <div className="settings-page-mobile-header">
        <h1 className="settings-page-mobile-header-title">Settings</h1>
        <button
          className="settings-page-mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <ChevronRight
            size={24}
            className={`settings-page-toggle-icon ${mobileMenuOpen ? "open" : ""}`}
          />
        </button>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`settings-page-mobile-sidebar ${mobileMenuOpen ? "open" : ""}`}
      >
        <nav className="settings-page-mobile-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMobileMenuOpen(false);
              }}
              className={`settings-page-mobile-nav-item ${activeTab === tab.id ? "active" : ""}`}
            >
              <span className="settings-page-mobile-nav-icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Desktop Sidebar */}
      <aside className="settings-page-sidebar">
        <div className="settings-page-sidebar-header">
          <h2 className="settings-page-sidebar-title">Settings</h2>
          <p className="settings-page-sidebar-subtitle">Manage your account</p>
        </div>
        <nav className="settings-page-sidebar-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`settings-page-sidebar-nav-item ${activeTab === tab.id ? "active" : ""}`}
            >
              <span className="settings-page-nav-icon">{tab.icon}</span>
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <span className="settings-page-active-indicator" />
              )}
            </button>
          ))}
        </nav>

      </aside>

      {/* Main Content */}
      <main className="settings-page-content">
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="settings-page-card">
            <div className="settings-page-card-header">
              <h3 className="settings-page-card-title">
                <User2 size={20} className="settings-page-title-icon" />
                Profile Details
              </h3>
              <p className="settings-page-card-description">
                View your account information and update via the profile editor.
              </p>
            </div>

            <div className="settings-page-section settings-page-profile-view">
              <div className="settings-page-profile-row">
                <span className="settings-page-profile-label">Name</span>
                <span className="settings-page-profile-value">{user?.name || "—"}</span>
              </div>
              <div className="settings-page-profile-row">
                <span className="settings-page-profile-label">Username</span>
                <span className="settings-page-profile-value">{user?.username || "—"}</span>
              </div>
              <div className="settings-page-profile-row">
                <span className="settings-page-profile-label">Email</span>
                <span className="settings-page-profile-value">{user?.email || "—"}</span>
              </div>
              <div className="settings-page-profile-row">
                <span className="settings-page-profile-label">Phone</span>
                <span className="settings-page-profile-value">{user?.phone || "—"}</span>
              </div>
              <div className="settings-page-profile-row">
                <span className="settings-page-profile-label">Bio</span>
                <span className="settings-page-profile-value">{user?.bio || "No bio yet."}</span>
              </div>

              <button
                className="settings-page-btn-primary"
                onClick={() => setEditProfileOpen(true)}
              >
                Edit Profile
              </button>
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === "privacy" && (
          <div className="settings-page-card">
            <div className="settings-page-card-header">
              <h3 className="settings-page-card-title">
                <Lock size={20} className="settings-page-title-icon" />
                Privacy Settings
              </h3>
              <p className="settings-page-card-description">
                Control who can see your information
              </p>
            </div>

            <div className="settings-page-section">
              <div className="settings-page-toggle-group">
                <ToggleSwitch
                  checked={privacy.showProfile}
                  onChange={() => handlePrivacyChange("showProfile")}
                  label="Show my profile publicly"
                  description="Your profile will be visible to everyone"
                  icon={<Eye size={16} />}
                />
                <ToggleSwitch
                  checked={privacy.showActivity}
                  onChange={() => handlePrivacyChange("showActivity")}
                  label="Show my activity"
                  description="Allow others to see your event activity"
                  icon={<Globe size={16} />}
                />
                <ToggleSwitch
                  checked={privacy.searchable}
                  onChange={() => handlePrivacyChange("searchable")}
                  label="Searchable"
                  description="Allow your account to be found in search"
                  icon={<Search size={16} />}
                />
              </div>

              <button
                className="settings-page-save-btn"
                onClick={savePrivacySettings}
                disabled={saving}
              >
                <Save size={18} />
                {saving ? "Saving..." : "Save Privacy Settings"}
              </button>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="settings-page-card">
            <div className="settings-page-card-header">
              <h3 className="settings-page-card-title">
                <Bell size={20} className="settings-page-title-icon" />
                Notification Settings
              </h3>
              <p className="settings-page-card-description">
                Choose how you want to be notified
              </p>
            </div>

            <div className="settings-page-section">
              <div className="settings-page-toggle-group">
                <ToggleSwitch
                  checked={notifications.emailAlerts}
                  onChange={() => handleNotificationChange("emailAlerts")}
                  label="Email Alerts"
                  description="Receive notifications via email"
                  icon={<Mail size={16} />}
                />
                <ToggleSwitch
                  checked={notifications.smsAlerts}
                  onChange={() => handleNotificationChange("smsAlerts")}
                  label="SMS Notifications"
                  description="Get text message alerts"
                  icon={<Smartphone size={16} />}
                />
                <ToggleSwitch
                  checked={notifications.appPush}
                  onChange={() => handleNotificationChange("appPush")}
                  label="Push Notifications"
                  description="In-app notifications"
                  icon={<Bell size={16} />}
                />
                <ToggleSwitch
                  checked={notifications.newsletter}
                  onChange={() => handleNotificationChange("newsletter")}
                  label="Newsletter"
                  description="Receive our monthly newsletter"
                  icon={<Mail size={16} />}
                />
              </div>

              <button
                className="settings-page-save-btn"
                onClick={saveNotificationSettings}
                disabled={saving}
              >
                <Save size={18} />
                {saving ? "Saving..." : "Save Notification Settings"}
              </button>
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === "billing" && (
          <div className="settings-page-card">
            <div className="settings-page-card-header">
              <h3 className="settings-page-card-title">
                <CreditCard size={20} className="settings-page-title-icon" />
                Billing
              </h3>
              <p className="settings-page-card-description">
                Manage your subscription and payment methods
              </p>
            </div>

            <div className="settings-page-billing-section">
              <div className="settings-page-plan-card">
                <div className="settings-page-plan-info">
                  <span className="settings-page-plan-badge">Current Plan</span>
                  <h4 className="settings-page-plan-name">{billing.plan}</h4>
                  <div className="settings-page-plan-details">
                    <div className="settings-page-plan-detail-item">
                      <DollarSign size={16} />
                      <span>Free forever</span>
                    </div>
                    <div className="settings-page-plan-detail-item">
                      <Calendar size={16} />
                      <span>Next billing: {billing.nextBillingDate}</span>
                    </div>
                  </div>
                </div>
                <button className="settings-page-upgrade-btn" onClick={handleUpgradePlan}>
                  Upgrade Plan
                </button>
              </div>

              <div className="settings-page-payment-methods">
                <h4 className="settings-page-section-subtitle">Payment Methods</h4>
                <div className="settings-page-payment-method-item">
                  <div className="settings-page-method-info">
                    <span className="settings-page-method-icon">💳</span>
                    <div>
                      <p className="settings-page-method-name">{billing.paymentMethod}</p>
                      <p className="settings-page-method-status">No payment method added</p>
                    </div>
                  </div>
                  <button
                    className="settings-page-add-payment-btn"
                    onClick={handleAddPaymentMethod}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Connected Apps Tab */}
        {activeTab === "apps" && (
          <div className="settings-page-card">
            <div className="settings-page-card-header">
              <h3 className="settings-page-card-title">
                <LinkIcon size={20} className="settings-page-title-icon" />
                Connected Apps
              </h3>
              <p className="settings-page-card-description">
                Manage third-party app integrations
              </p>
            </div>

            <div className="settings-page-apps-section">
              <div className="settings-page-app-item">
                <div className="settings-page-app-info">
                  <div className="settings-page-app-icon">G</div>
                  <div>
                    <h4 className="settings-page-app-name">Google</h4>
                    <p className="settings-page-app-status">Not connected</p>
                  </div>
                </div>
                <button className="settings-page-connect-btn">Connect</button>
              </div>

              <div className="settings-page-app-item">
                <div className="settings-page-app-info">
                  <div className="settings-page-app-icon">f</div>
                  <div>
                    <h4 className="settings-page-app-name">Facebook</h4>
                    <p className="settings-page-app-status">Not connected</p>
                  </div>
                </div>
                <button className="settings-page-connect-btn">Connect</button>
              </div>

              <div className="settings-page-app-item">
                <div className="settings-page-app-info">
                  <div className="settings-page-app-icon">🔄</div>
                  <div>
                    <h4 className="settings-page-app-name">Apple</h4>
                    <p className="settings-page-app-status">Not connected</p>
                  </div>
                </div>
                <button className="settings-page-connect-btn">Connect</button>
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone Tab */}
        {activeTab === "danger" && (
          <div className="settings-page-card settings-page-danger-card">
            <div className="settings-page-card-header">
              <h3 className="settings-page-card-title settings-page-danger-title">
                <AlertTriangle size={20} className="settings-page-title-icon" />
                Danger Zone
              </h3>
              <p className="settings-page-card-description">
                Irreversible actions - proceed with caution
              </p>
            </div>

            <div className="settings-page-danger-section">
              <div className="settings-page-danger-item">
                <div className="settings-page-danger-info">
                  <h4 className="settings-page-danger-item-title">Delete Account</h4>
                  <p className="settings-page-danger-item-description">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <button className="settings-page-delete-account-btn" onClick={deleteAccount}>
                  <Trash2 size={18} />
                  Delete Account
                </button>
              </div>

              <div className="settings-page-danger-item">
                <div className="settings-page-danger-info">
                  <h4 className="settings-page-danger-item-title">Export Data</h4>
                  <p className="settings-page-danger-item-description">
                    Download a copy of all your data
                  </p>
                </div>
                <button className="settings-page-export-data-btn">Export</button>
              </div>

              <div className="settings-page-danger-item">
                <div className="settings-page-danger-info">
                  <h4 className="settings-page-danger-item-title">Logout from all devices</h4>
                  <p className="settings-page-danger-item-description">
                    Sign out of your account on all devices
                  </p>
                </div>
                <button className="settings-page-logout-all-btn">
                  <LogOut size={18} />
                  Logout All
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {editProfileOpen && (
        <EditProfileModal
          isOpen={editProfileOpen}
          onClose={() => setEditProfileOpen(false)}
          currentUser={user}
          onProfileUpdated={(updatedUser) => {
            setUser(updatedUser);
            setEditProfileOpen(false);
          }}
        />
      )}
    </div>
  );
}