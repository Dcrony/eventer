import { useEffect, useState } from "react";
import { Download, Search, Shield, UserCheck, Users, X } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { UserAvatar } from "../components/ui/avatar";
import adminService from "../services/adminService";
import { formatCurrency, formatDate, formatNumber, getStatusTone } from "../utils/adminUtils";
import { useToast } from "../components/ui/toast";
import {
    EmptyState,
    ErrorMessage,
    LoadingSpinner,
    PaginationControls,
    StatCard,
    StatusBadge,
    SurfaceCard,
    TableHead,
    TableWrapper,
} from "../components/AdminComponents";

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

    useEffect(() => { fetchUsers(); }, [page, roleFilter, statusFilter]);

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

    const applySearch = () => { setPage(1); fetchUsers(filters, 1); };

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
            if (selectedUser?.user?._id === user._id) openUserDetails(user._id);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update user status.");
        }
    };

    const handleRoleChange = async (userId, role) => {
        try {
            await adminService.updateUserRole(userId, role);
            toast.success(`Role updated to ${role}.`);
            fetchUsers(filters, page);
            if (selectedUser?.user?._id === userId) openUserDetails(userId);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update role.");
        }
    };

    const handleDelete = async (user) => {
        if (!window.confirm(`Delete ${user.email}? This will deactivate the account.`)) return;
        try {
            await adminService.deleteUser(user._id);
            toast.success("User deleted.");
            if (selectedUser?.user?._id === user._id) setSelectedUser(null);
            fetchUsers(filters, page);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete user.");
        }
    };

    return (
        <AdminLayout
            title="User Management"
            description="Search users, manage roles, suspend accounts, and inspect organizer activity."
        >
            <div className="space-y-4">
                {/* Search + Filters */}
                <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
                    <SurfaceCard className="p-3">
                        <div className="flex items-center gap-2">
                            <Search size={14} className="text-pink-500 flex-shrink-0" />
                            <input
                                type="search"
                                placeholder="Search by name, username, or email"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") applySearch(); }}
                                className="min-w-0 flex-1 bg-transparent text-xs text-gray-800 outline-none placeholder:text-gray-400"
                            />
                        </div>
                    </SurfaceCard>
                    <SurfaceCard className="p-3">
                        <select
                            value={roleFilter}
                            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                            className="w-full bg-transparent text-xs font-medium text-gray-700 outline-none"
                        >
                            <option value="">All roles</option>
                            <option value="user">Users</option>
                            <option value="organizer">Organizers</option>
                            <option value="admin">Admins</option>
                            <option value="moderator">Moderators</option>
                            <option value="finance_admin">Finance Admins</option>
                            <option value="support_admin">Support Admins</option>
                            <option value="super_admin">Super Admins</option>
                        </select>
                    </SurfaceCard>
                    <SurfaceCard className="p-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="w-full bg-transparent text-xs font-medium text-gray-700 outline-none"
                        >
                            <option value="">All statuses</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </SurfaceCard>
                    <button
                        type="button"
                        onClick={applySearch}
                        className="rounded-xl bg-pink-500 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-pink-600"
                    >
                        Search
                    </button>
                </div>

                {/* Stats */}
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard icon={Users} label="Total Users" value={formatNumber(summary?.total || 0)} detail="Active admin scope" accent />
                    <StatCard icon={UserCheck} label="Organizers" value={formatNumber(summary?.organizers || 0)} detail={`${formatNumber(summary?.verifiedOrganizers || 0)} verified`} />
                    <StatCard icon={Shield} label="Admins" value={formatNumber(summary?.admins || 0)} detail="Platform managers" />
                    <StatCard icon={Shield} label="Suspended" value={formatNumber(summary?.suspended || 0)} detail={`${formatNumber(summary?.proUsers || 0)} pro accounts`} />
                </div>

                {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

                {/* Main split layout */}
                <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
                    {/* User table */}
                    <div className="space-y-3">
                        {loading ? (
                            <LoadingSpinner label="Loading users..." />
                        ) : users.length === 0 ? (
                            <EmptyState icon={Users} title="No users found" description="Try a broader search or clear filters." />
                        ) : (
                            <TableWrapper>
                                <TableHead columns={["User", "Role", "Status", "Actions"]} />
                                <tbody className="divide-y divide-gray-50 bg-white">
                                    {users.map((user) => (
                                        <tr key={user._id} className="group transition-colors hover:bg-pink-50/20">
                                            <td className="px-4 py-3.5">
                                                <button
                                                    type="button"
                                                    onClick={() => openUserDetails(user._id)}
                                                    className="flex items-center gap-3 text-left"
                                                >
                                                    <UserAvatar user={user} className="h-9 w-9 rounded-xl flex-shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-gray-900 truncate">{user.name || user.username}</p>
                                                        <p className="mt-0.5 text-[0.6rem] text-gray-400 truncate">{user.email}</p>
                                                    </div>
                                                </button>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                    className="rounded-xl border border-gray-100 bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-700 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                                                >
                                                    <option value="user">User</option>
                                                    <option value="organizer">Organizer</option>
                                                    <option value="admin">Admin</option>
                                                    <option value="moderator">Moderator</option>
                                                    <option value="finance_admin">Finance Admin</option>
                                                    <option value="support_admin">Support Admin</option>
                                                    <option value="super_admin">Super Admin</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <StatusBadge tone={user.isSuspended ? "red" : "green"}>
                                                    {user.isSuspended ? "Suspended" : "Active"}
                                                </StatusBadge>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSuspendToggle(user)}
                                                        className={`rounded-lg px-2.5 py-1.5 text-[0.65rem] font-semibold text-white transition-colors ${user.isSuspended ? "bg-emerald-500 hover:bg-emerald-600" : "bg-amber-500 hover:bg-amber-600"}`}
                                                    >
                                                        {user.isSuspended ? "Reactivate" : "Suspend"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(user)}
                                                        className="rounded-lg bg-red-500 px-2.5 py-1.5 text-[0.65rem] font-semibold text-white transition-colors hover:bg-red-600"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </TableWrapper>
                        )}

                        <PaginationControls
                            page={pagination.page || page}
                            pages={pagination.pages || 1}
                            total={pagination.total}
                            label="users"
                            onPrevious={() => setPage((c) => Math.max(1, c - 1))}
                            onNext={() => setPage((c) => Math.min(pagination.pages || 1, c + 1))}
                        />
                    </div>

                    {/* Detail panel */}
                    <SurfaceCard className="space-y-4">
                        <div>
                            <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">User details</p>
                            <h3 className="mt-1.5 text-sm font-bold text-gray-900">
                                {selectedUser?.user?.name || selectedUser?.user?.username || "Select a user"}
                            </h3>
                            <p className="mt-0.5 text-xs text-gray-400">
                                {selectedUser?.user?.email || "Choose a row to inspect activity."}
                            </p>
                        </div>

                        {detailsLoading ? (
                            <LoadingSpinner label="Loading user details..." />
                        ) : selectedUser?.user ? (
                            <div className="space-y-4">
                                {/* Quick stats */}
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {[
                                        ["Role", <span className="capitalize">{selectedUser.user.role || "user"}</span>],
                                        ["Status", selectedUser.user.isSuspended ? "Suspended" : "Active"],
                                    ].map(([label, val]) => (
                                        <div key={label} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                            <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">{label}</p>
                                            <p className="mt-1.5 text-xs font-semibold text-gray-900">{val}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Verification + Subscription */}
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                        <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">Verification</p>
                                        <div className="mt-1.5 flex items-center justify-between gap-2">
                                            <p className="text-xs font-semibold text-gray-900">{selectedUser.user.isVerified ? "Verified" : "Unverified"}</p>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    try {
                                                        await adminService.updateUserVerification(selectedUser.user._id, !selectedUser.user.isVerified);
                                                        toast.success("Verification updated.");
                                                        openUserDetails(selectedUser.user._id);
                                                        fetchUsers(filters, page);
                                                    } catch (err) {
                                                        setError(err.response?.data?.message || "Failed.");
                                                    }
                                                }}
                                                className={`rounded-lg px-2 py-1 text-[0.6rem] font-bold text-white transition-colors ${selectedUser.user.isVerified ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-500 hover:bg-emerald-600"}`}
                                            >
                                                {selectedUser.user.isVerified ? "Remove" : "Verify"}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                        <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">Subscription</p>
                                        <div className="mt-1.5 flex items-center justify-between gap-2">
                                            <p className="text-xs font-bold uppercase text-gray-900">{selectedUser.user.plan || "free"}</p>
                                            <select
                                                value={selectedUser.user.plan || "free"}
                                                onChange={async (e) => {
                                                    try {
                                                        await adminService.updateUserSubscription(selectedUser.user._id, {
                                                            plan: e.target.value,
                                                            interval: "monthly",
                                                            status: e.target.value === "free" ? "inactive" : "active",
                                                        });
                                                        toast.success("Subscription updated.");
                                                        openUserDetails(selectedUser.user._id);
                                                    } catch (err) {
                                                        setError(err.response?.data?.message || "Failed.");
                                                    }
                                                }}
                                                className="rounded-lg border border-gray-100 bg-white px-2 py-1 text-xs text-gray-700 outline-none"
                                            >
                                                <option value="free">Free</option>
                                                <option value="trial">Trial</option>
                                                <option value="pro">Pro</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Risk indicators */}
                                {selectedUser.riskIndicators?.length > 0 && (
                                    <div>
                                        <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400 mb-2">Risk Indicators</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedUser.riskIndicators.map((ind) => (
                                                <StatusBadge key={ind.label} tone={ind.tone}>{ind.label}</StatusBadge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recent transactions */}
                                <div>
                                    <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400 mb-2">Recent Transactions</p>
                                    <div className="space-y-2">
                                        {(selectedUser.transactions || []).slice(0, 5).length === 0 ? (
                                            <p className="text-xs text-gray-400">No recent transactions.</p>
                                        ) : (
                                            (selectedUser.transactions || []).slice(0, 5).map((tx) => (
                                                <div key={tx._id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3 hover:border-pink-100 transition-colors">
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-gray-900 truncate">{tx.event?.title || "Unknown"}</p>
                                                        <p className="mt-0.5 text-[0.6rem] text-gray-400">{formatDate(tx.purchasedAt)}</p>
                                                    </div>
                                                    <div className="flex-shrink-0 text-right">
                                                        <p className="text-xs font-bold text-gray-900 tabular-nums">{formatCurrency(tx.amount || 0)}</p>
                                                        <StatusBadge tone={tx.paymentStatus === "success" ? "green" : "amber"}>
                                                            {tx.paymentStatus || "pending"}
                                                        </StatusBadge>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Organizer events */}
                                <div>
                                    <p className="text-[0.6rem] font-bold uppercase tracking-widest text-gray-400 mb-2">Organizer Events</p>
                                    <div className="space-y-2">
                                        {(selectedUser.events || []).slice(0, 5).length === 0 ? (
                                            <p className="text-xs text-gray-400">No events found.</p>
                                        ) : (
                                            (selectedUser.events || []).slice(0, 5).map((ev) => (
                                                <div key={ev._id} className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 p-3 hover:border-pink-100 transition-colors">
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-gray-900 truncate">{ev.title}</p>
                                                        <p className="mt-0.5 text-[0.6rem] text-gray-400">{ev.category || "No category"}</p>
                                                    </div>
                                                    <div className="flex-shrink-0 text-right">
                                                        <StatusBadge tone={ev.status === "approved" ? "green" : ev.status === "rejected" ? "red" : "amber"}>
                                                            {ev.status || "pending"}
                                                        </StatusBadge>
                                                        <p className="mt-1 text-[0.55rem] text-gray-400">Sold: {formatNumber(ev.ticketsSold || 0)}</p>
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
                                description="Select a user from the table to view their profile, purchases, and events."
                            />
                        )}
                    </SurfaceCard>
                </div>
            </div>
        </AdminLayout>
    );
}