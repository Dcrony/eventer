import { useEffect, useState } from "react";
import { Shield, UserCheck, Users, Search, Download, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { UserAvatar } from "../components/ui/avatar";
import adminService from "../services/adminService";
import { formatCurrency, formatDate, formatNumber, formatStatus, getStatusTone } from "../utils/adminUtils";
import { useToast } from "../components/ui/toast";

function StatCard({ icon: Icon, label, value, detail }) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
                </div>
                {Icon && (
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-500">
                        <Icon size={18} />
                    </div>
                )}
            </div>
            {detail && <p className="mt-3 text-xs text-gray-500">{detail}</p>}
        </div>
    );
}

function SurfaceCard({ children, className = "" }) {
    return <div className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${className}`.trim()}>{children}</div>;
}

function LoadingSpinner({ label = "Loading..." }) {
    return (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="text-center">
                <div className="mx-auto h-8 w-8 border-3 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
                <p className="mt-3 text-sm text-gray-500">{label}</p>
            </div>
        </div>
    );
}

function ErrorMessage({ message, onDismiss }) {
    return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <AlertCircle size={18} />
                    <span className="text-sm font-semibold">Error</span>
                </div>
                {onDismiss && (
                    <button onClick={onDismiss} className="text-xs font-semibold uppercase tracking-wider text-red-600 hover:text-red-700">
                        Dismiss
                    </button>
                )}
            </div>
            <p className="mt-2 text-sm leading-relaxed">{message}</p>
        </div>
    );
}

function EmptyState({ icon: Icon, title, description, action }) {
    return (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center shadow-sm">
            <div>
                <Icon className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-base font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">{description}</p>
                {action && <div className="mt-5">{action}</div>}
            </div>
        </div>
    );
}

function StatusBadge({ tone = "gray", children }) {
    const tones = {
        green: "bg-green-100 text-green-700",
        amber: "bg-amber-100 text-amber-700",
        red: "bg-red-100 text-red-700",
        pink: "bg-pink-100 text-pink-700",
        gray: "bg-gray-100 text-gray-700",
        blue: "bg-blue-100 text-blue-700",
    };

    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone] || tones.gray}`}>
            {children}
        </span>
    );
}

function PaginationControls({ page, pages, onPrevious, onNext, total, label = "results" }) {
    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-gray-500">
                Page {page} of {pages} {typeof total === "number" ? `- ${formatNumber(total)} ${label}` : ""}
            </p>
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={onPrevious}
                    disabled={page <= 1}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 transition-all duration-200 hover:border-pink-300 hover:text-pink-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronLeft size={16} />
                    Previous
                </button>
                <button
                    type="button"
                    onClick={onNext}
                    disabled={page >= pages}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 transition-all duration-200 hover:border-pink-300 hover:text-pink-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Next
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}

export default function AdminUsers() {
    const toast = useToast();
    const [users, setUsers] = useState([]);
    const [summary, setSummary] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    const filters = {
        ...(search ? { search } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
    };

    useEffect(() => {
        fetchUsers();
    }, [page, roleFilter, statusFilter]);

    const fetchUsers = async (overrideFilters = filters, nextPage = page) => {
        try {
            setLoading(true);
            setError(null);
            const data = await adminService.getAllUsers(nextPage, 20, overrideFilters);
            setUsers(data.users || []);
            setSummary(data.summary || null);
            setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load users.");
        } finally {
            setLoading(false);
        }
    };

    const applySearch = () => {
        setPage(1);
        fetchUsers(filters, 1);
    };

    const openUserDetails = async (userId) => {
        try {
            setDetailsLoading(true);
            const data = await adminService.getUserDetails(userId);
            setSelectedUser(data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load user details.");
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleSuspendToggle = async (user) => {
        try {
            if (user.isSuspended) {
                await adminService.reactivateUser(user._id);
                toast.success("User reactivated.");
            } else {
                await adminService.suspendUser(user._id);
                toast.success("User suspended.");
            }

            fetchUsers(filters, page);

            if (selectedUser?.user?._id === user._id) {
                openUserDetails(user._id);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update user status.");
        }
    };

    const handleRoleChange = async (userId, role) => {
        try {
            await adminService.updateUserRole(userId, role);
            toast.success(`User role updated to ${role}.`);
            fetchUsers(filters, page);

            if (selectedUser?.user?._id === userId) {
                openUserDetails(userId);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update user role.");
        }
    };

    const handleDelete = async (user) => {
        if (!window.confirm(`Delete ${user.email}? This will deactivate the account.`)) {
            return;
        }

        try {
            await adminService.deleteUser(user._id);
            toast.success("User deleted successfully.");
            if (selectedUser?.user?._id === user._id) {
                setSelectedUser(null);
            }
            fetchUsers(filters, page);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete user.");
        }
    };

    return (
        <AdminLayout
            title="User Management"
            description="Search users, change access roles, suspend or reactivate accounts, and inspect organizer activity."
        >
            <div className="space-y-6">
                {/* Search and Filters */}
                <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_auto]">
                    <SurfaceCard>
                        <div className="flex items-center gap-2">
                            <Search size={18} className="text-pink-500 flex-shrink-0" />
                            <input
                                type="search"
                                placeholder="Search by name, username, or email"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") applySearch();
                                }}
                                className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                            />
                        </div>
                    </SurfaceCard>
                    <SurfaceCard>
                        <select
                            value={roleFilter}
                            onChange={(event) => {
                                setRoleFilter(event.target.value);
                                setPage(1);
                            }}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                        >
                            <option value="">All roles</option>
                            <option value="user">Users</option>
                            <option value="organizer">Organizers</option>
                            <option value="admin">Admins</option>
                        </select>
                    </SurfaceCard>
                    <SurfaceCard>
                        <select
                            value={statusFilter}
                            onChange={(event) => {
                                setStatusFilter(event.target.value);
                                setPage(1);
                            }}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                        >
                            <option value="">All statuses</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </SurfaceCard>
                    <button
                        type="button"
                        onClick={applySearch}
                        className="rounded-xl bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 shadow-md shadow-pink-500/25"
                    >
                        Search
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard icon={Users} label="Total Users" value={formatNumber(summary?.total || 0)} detail="Active admin scope" />
                    <StatCard icon={UserCheck} label="Organizers" value={formatNumber(summary?.organizers || 0)} detail="Event creators" />
                    <StatCard icon={Shield} label="Admins" value={formatNumber(summary?.admins || 0)} detail="Platform managers" />
                    <StatCard icon={Shield} label="Suspended" value={formatNumber(summary?.suspended || 0)} detail="Restricted accounts" />
                </div>

                {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

                {/* Main Content Grid */}
                <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
                    {/* Users Table */}
                    <div className="space-y-6">
                        {loading ? (
                            <LoadingSpinner label="Loading users..." />
                        ) : users.length === 0 ? (
                            <EmptyState icon={Users} title="No users found" description="Try a broader search or clear some filters." />
                        ) : (
                            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50 text-gray-500">
                                        <tr>
                                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider">User</th>
                                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider">Role</th>
                                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {users.map((user) => (
                                            <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-5 py-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => openUserDetails(user._id)}
                                                        className="flex items-center gap-3 text-left w-full"
                                                    >
                                                        <UserAvatar user={user} className="h-10 w-10 rounded-xl" />
                                                        <div>
                                                            <div className="font-semibold text-gray-900">{user.name || user.username}</div>
                                                            <div className="mt-0.5 text-xs text-gray-500">{user.email}</div>
                                                        </div>
                                                    </button>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <select
                                                        value={user.role}
                                                        onChange={(event) => handleRoleChange(user._id, event.target.value)}
                                                        className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                                                    >
                                                        <option value="user">User</option>
                                                        <option value="organizer">Organizer</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <StatusBadge tone={user.isSuspended ? "red" : "green"}>
                                                        {user.isSuspended ? "Suspended" : "Active"}
                                                    </StatusBadge>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSuspendToggle(user)}
                                                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 ${
                                                                user.isSuspended
                                                                    ? "bg-green-500 hover:bg-green-600"
                                                                    : "bg-amber-500 hover:bg-amber-600"
                                                            }`}
                                                        >
                                                            {user.isSuspended ? "Reactivate" : "Suspend"}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(user)}
                                                            className="rounded-xl bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:bg-red-600"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <PaginationControls
                            page={pagination.page || page}
                            pages={pagination.pages || 1}
                            total={pagination.total}
                            label="users"
                            onPrevious={() => setPage((current) => Math.max(1, current - 1))}
                            onNext={() => setPage((current) => Math.min(pagination.pages || 1, current + 1))}
                        />
                    </div>

                    {/* User Details Panel */}
                    <SurfaceCard className="space-y-5">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">User details</p>
                            <h3 className="mt-2 text-lg font-bold text-gray-900">
                                {selectedUser?.user?.name || selectedUser?.user?.username || "Select a user"}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {selectedUser?.user?.email || "Choose a row to inspect recent activity and organizer events."}
                            </p>
                        </div>

                        {detailsLoading ? (
                            <LoadingSpinner label="Loading user details..." />
                        ) : selectedUser?.user ? (
                            <div className="space-y-5">
                                {/* User Stats */}
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-xl bg-gray-50 p-4 border border-gray-200">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Role</p>
                                        <p className="mt-2 text-sm font-semibold text-gray-900 capitalize">{selectedUser.user.role || "User"}</p>
                                    </div>
                                    <div className="rounded-xl bg-gray-50 p-4 border border-gray-200">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Status</p>
                                        <p className="mt-2 text-sm font-semibold text-gray-900">
                                            {selectedUser.user.isSuspended ? "Suspended" : "Active"}
                                        </p>
                                    </div>
                                </div>

                                {/* Recent Transactions */}
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900">Recent transactions</h4>
                                    <div className="mt-3 space-y-3">
                                        {(selectedUser.transactions || []).slice(0, 5).length === 0 ? (
                                            <p className="text-sm text-gray-500">No recent transactions.</p>
                                        ) : (
                                            (selectedUser.transactions || []).slice(0, 5).map((transaction) => (
                                                <div key={transaction._id} className="rounded-xl border border-gray-200 p-4 hover:border-pink-200 transition-all duration-200">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                                                {transaction.event?.title || "Unknown event"}
                                                            </p>
                                                            <p className="mt-1 text-xs text-gray-500">{formatDate(transaction.purchasedAt)}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-semibold text-gray-900">{formatCurrency(transaction.amount || 0)}</p>
                                                            <StatusBadge tone={transaction.paymentStatus === "success" ? "green" : "amber"}>
                                                                {transaction.paymentStatus || "pending"}
                                                            </StatusBadge>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Organizer Events */}
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900">Organizer events</h4>
                                    <div className="mt-3 space-y-3">
                                        {(selectedUser.events || []).slice(0, 5).length === 0 ? (
                                            <p className="text-sm text-gray-500">No organizer events found.</p>
                                        ) : (
                                            (selectedUser.events || []).slice(0, 5).map((event) => (
                                                <div key={event._id} className="rounded-xl border border-gray-200 p-4 hover:border-pink-200 transition-all duration-200">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-gray-900 truncate">{event.title}</p>
                                                            <p className="mt-1 text-xs text-gray-500">{event.category || "No category"}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <StatusBadge tone={event.status === "approved" ? "green" : event.status === "rejected" ? "red" : "amber"}>
                                                                {event.status || "pending"}
                                                            </StatusBadge>
                                                            <p className="mt-1 text-xs text-gray-500">Sold: {formatNumber(event.ticketsSold || 0)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <EmptyState
                                icon={Users}
                                title="No user selected"
                                description="Select a user from the table to view profile details, recent purchases, and events."
                            />
                        )}
                    </SurfaceCard>
                </div>
            </div>
        </AdminLayout>
    );
}