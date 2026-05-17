import { Link, useLocation } from "react-router-dom";
import AppPage from "./layout/AppPage";

const adminNav = [
  { to: "/admin/dashboard", label: "Overview" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/events", label: "Events" },
  { to: "/admin/transactions", label: "Transactions" },
  { to: "/admin/withdrawals", label: "Withdrawals" },
  { to: "/admin/logs", label: "Activity Logs" },
  { to: "/admin/controls", label: "Platform Controls" },
];

export default function AdminLayout({
  children,
  title = "Admin Control Center",
  description = "Monitor and manage TickiSpot platform operations.",
}) {
  const location = useLocation();

  return (
    <AppPage background="bg-gray-50" contentClassName="py-6">
      <div className="mb-6 flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-pink-500">Admin</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">{description}</p>
        </div>
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm transition-colors hover:border-pink-300 hover:text-pink-600"
        >
          Back to app
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit rounded-xl border border-gray-200/80 bg-white p-3 shadow-sm">
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Navigation
          </p>
          <nav className="space-y-0.5">
            {adminNav.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-pink-50 text-pink-600" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0 space-y-5">{children}</section>
      </div>
    </AppPage>
  );
}
