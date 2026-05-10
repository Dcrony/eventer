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
        <div className="admin-shell bg-slate-50 min-h-screen">
            <div className="max-w-[1440px] mx-auto px-4 py-6 lg:px-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-600">Admin</p>
                        <h1 className="mt-2 text-3xl font-bold text-slate-950">{title}</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
                    </div>
                    <div className="inline-flex flex-wrap gap-3">
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-pink-300 hover:text-pink-600"
                        >
                            Back to app
                        </Link>
                    </div>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
                    <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="space-y-4">
                            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-600">Admin navigation</div>
                            <nav className="space-y-2">
                                {adminNav.map((item) => {
                                    const active = location.pathname === item.to;
                                    return (
                                        <Link
                                            key={item.to}
                                            to={item.to}
                                            className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${active
                                                    ? "bg-pink-50 text-pink-700 ring-1 ring-pink-200"
                                                    : "text-slate-700 hover:bg-slate-100"
                                                }`}
                                        >
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    </aside>

                    <section className="space-y-6">{children}</section>
                </div>
            </div>
        </div>
    );
}
