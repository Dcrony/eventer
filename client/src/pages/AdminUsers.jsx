import { useEffect, useState } from "react";
import { Shield, UserCheck, Users } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import {
  EmptyState,
  ErrorMessage,
  LoadingSpinner,
  PaginationControls,
  StatCard,
  StatusBadge,
  SurfaceCard,
} from "../components/AdminComponents";
import { UserAvatar } from "../components/ui/avatar";
import adminService from "../services/adminService";
import { formatCurrency, formatDate, formatNumber, formatStatus, getStatusTone } from "../utils/adminUtils";
import { useToast } from "../components/ui/toast";

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
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_auto]">
          <SurfaceCard>
            <input
              type="search"
              placeholder="Search by name, username, or email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") applySearch();
              }}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
            />
          </SurfaceCard>
          <SurfaceCard>
            <select
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
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
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </SurfaceCard>
          <button
            type="button"
            onClick={applySearch}
            className="rounded-2xl bg-pink-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-pink-700"
          >
            Search
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Users} label="Total Users" value={formatNumber(summary?.total || 0)} detail="Active admin scope" />
          <StatCard icon={UserCheck} label="Organizers" value={formatNumber(summary?.organizers || 0)} detail="Event creators" />
          <StatCard icon={Shield} label="Admins" value={formatNumber(summary?.admins || 0)} detail="Platform managers" />
          <StatCard icon={Shield} label="Suspended" value={formatNumber(summary?.suspended || 0)} detail="Restricted accounts" />
        </div>

        {error ? <ErrorMessage message={error} onDismiss={() => setError(null)} /> : null}

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-6">
            {loading ? (
              <LoadingSpinner label="Loading users..." />
            ) : users.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No users found"
                description="Try a broader search or clear some filters."
              />
            ) : (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">User</th>
                      <th className="px-6 py-4 text-left font-semibold">Role</th>
                      <th className="px-6 py-4 text-left font-semibold">Status</th>
                      <th className="px-6 py-4 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => openUserDetails(user._id)}
                            className="flex items-center gap-3 text-left"
                          >
                            <UserAvatar user={user} className="h-10 w-10" />
                            <div>
                              <div className="font-semibold text-slate-950">{user.name || user.username}</div>
                              <div className="mt-1 text-xs text-slate-500">{user.email}</div>
                            </div>
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={user.role}
                            onChange={(event) => handleRoleChange(user._id, event.target.value)}
                            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none"
                          >
                            <option value="user">User</option>
                            <option value="organizer">Organizer</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge tone={getStatusTone(user.isSuspended ? "suspended" : "active")}>
                            {user.isSuspended ? "Suspended" : "Active"}
                          </StatusBadge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleSuspendToggle(user)}
                              className={`rounded-2xl px-3 py-2 text-xs font-semibold text-white transition ${
                                user.isSuspended ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-500 hover:bg-amber-600"
                              }`}
                            >
                              {user.isSuspended ? "Reactivate" : "Suspend"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(user)}
                              className="rounded-2xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
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

          <SurfaceCard className="space-y-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">User details</p>
              <h3 className="mt-2 text-xl font-bold text-slate-950">
                {selectedUser?.user?.name || selectedUser?.user?.username || "Select a user"}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {selectedUser?.user?.email || "Choose a row to inspect recent activity and organizer events."}
              </p>
            </div>

            {detailsLoading ? (
              <LoadingSpinner label="Loading user details..." />
            ) : selectedUser?.user ? (
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Role</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{formatStatus(selectedUser.user.role)}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Status</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {selectedUser.user.isSuspended ? "Suspended" : "Active"}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Recent transactions</h4>
                  <div className="mt-3 space-y-3">
                    {(selectedUser.transactions || []).slice(0, 5).map((transaction) => (
                      <div key={transaction._id} className="rounded-2xl border border-slate-200 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{transaction.event?.title || "Unknown event"}</p>
                            <p className="mt-1 text-xs text-slate-500">{formatDate(transaction.purchasedAt)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-slate-900">{formatCurrency(transaction.amount || 0)}</p>
                            <StatusBadge tone={getStatusTone(transaction.paymentStatus)}>
                              {transaction.paymentStatus || "unknown"}
                            </StatusBadge>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!selectedUser.transactions?.length ? <p className="text-sm text-slate-500">No recent transactions.</p> : null}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Organizer events</h4>
                  <div className="mt-3 space-y-3">
                    {(selectedUser.events || []).slice(0, 5).map((event) => (
                      <div key={event._id} className="rounded-2xl border border-slate-200 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                            <p className="mt-1 text-xs text-slate-500">{event.category || "No category"}</p>
                          </div>
                          <div className="text-right">
                            <StatusBadge tone={getStatusTone(event.status)}>{event.status || "pending"}</StatusBadge>
                            <p className="mt-2 text-xs text-slate-500">Sold: {formatNumber(event.ticketsSold || 0)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!selectedUser.events?.length ? <p className="text-sm text-slate-500">No organizer events found.</p> : null}
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
