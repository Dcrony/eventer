import { useState } from "react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "privacy", label: "Privacy" },
    { id: "notifications", label: "Notifications" },
    { id: "billing", label: "Billing" },
    { id: "apps", label: "Connected Apps" },
    { id: "danger", label: "Danger Zone" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex ml-64 pt-16">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r shadow-sm hidden md:block">
        <h2 className="text-xl font-semibold px-6 py-4 border-b">⚙️ Settings</h2>
        <nav className="mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-6 py-3 text-sm font-medium hover:bg-gray-100 transition 
              ${
                activeTab === tab.id
                  ? "bg-gray-100 text-indigo-600 border-r-4 border-indigo-600"
                  : "text-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {activeTab === "profile" && (
          <div>
            <h3 className="text-lg font-semibold mb-4">👤 Profile Settings</h3>
            <p className="text-gray-600">Update your name, email, and profile picture.</p>
            {/* Your Profile form goes here */}
          </div>
        )}

        {activeTab === "privacy" && (
          <div>
            <h3 className="text-lg font-semibold mb-4">🔒 Privacy Settings</h3>
            <p className="text-gray-600">Manage who can see your activity and data.</p>
          </div>
        )}

        {activeTab === "notifications" && (
          <div>
            <h3 className="text-lg font-semibold mb-4">🔔 Notification Settings</h3>
            <p className="text-gray-600">Choose how you want to receive alerts.</p>
          </div>
        )}

        {activeTab === "billing" && (
          <div>
            <h3 className="text-lg font-semibold mb-4">💳 Billing</h3>
            <p className="text-gray-600">View invoices, manage subscriptions, and payment methods.</p>
          </div>
        )}

        {activeTab === "apps" && (
          <div>
            <h3 className="text-lg font-semibold mb-4">🔗 Connected Apps</h3>
            <p className="text-gray-600">Manage integrations with third-party apps.</p>
          </div>
        )}

        {activeTab === "danger" && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-red-600">⚠️ Danger Zone</h3>
            <p className="text-gray-600">Delete your account or reset everything.</p>
            <button className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">
              Delete Account
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
