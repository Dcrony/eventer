import { Link, useLocation } from "react-router-dom";

const adminNav = [
    { to: "/admin/dashboard", label: "Overview" },
    { to: "/admin/users", label: "Users" },
    { to: "/admin/events", label: "Events" },
    { to: "/admin/transactions", label: "Transactions" },
    { to: "/admin/withdrawals", label: "Withdrawals" },
    { to: "/admin/logs", label: "Activity Logs" },
    { to: "/admin/controls", label: "Platform Controls" },
];

export default function AdminLayout({ children, title = "Admin Control Center", description = "Monitor and manage TickiSpot platform operations." }) {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-gray-50 font-geist pl-[var(--sidebar-width,0px)]">
            <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-pink-500">Admin</p>
                        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900">{title}</h1>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500 leading-relaxed">{description}</p>
                    </div>
                    <div className="inline-flex flex-wrap gap-2">
                        <Link
                            to="/dashboard"
                            className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm transition-all duration-200 hover:border-pink-300 hover:text-pink-500"
                        >
                            Back to app
                        </Link>
                    </div>
                </div>

                <div className="mt-6 grid gap-5 lg:grid-cols-[260px_1fr]">
                    <aside className="rounded-xl border h-fit border-gray-200 bg-white p-4 shadow-sm">
                        <div className="space-y-3">
                            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 px-2">Admin navigation</div>
                            <nav className="space-y-1">
                                {adminNav.map((item) => {
                                    const active = location.pathname === item.to;
                                    return (
                                        <Link
                                            key={item.to}
                                            to={item.to}
                                            className={`block rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                                                active
                                                    ? "bg-pink-50 text-pink-600"
                                                    : "text-gray-600 hover:bg-gray-100"
                                            }`}
                                        >
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    </aside>

                    <section className="space-y-5">{children}</section>
                </div>
            </div>
        </div>
    );
}