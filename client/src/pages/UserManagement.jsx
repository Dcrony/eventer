import React, { useEffect, useState } from "react";
import axios from "axios";
import "./CSS/UserManagement.css";
import { Users, UserCheck, Shield } from "lucide-react";

// Use VITE_API_URL for Vite projects (not REACT_APP_API_URL)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const MOCK_USERS = [
  {
    _id: "1",
    username: "olaoluwa",
    email: "olaoluwa@example.com",
    role: "organizer",
    bio: "Music event producer with 5 years experience.",
  },
  {
    _id: "2",
    username: "taslim",
    email: "taslim@example.com",
    role: "user",
    bio: "Attending events and managing bookings.",
  },
  {
    _id: "3",
    username: "micheal",
    email: "micheal@example.com",
    role: "admin",
    bio: "Platform administrator and product owner.",
  },
  {
    _id: "4",
    username: "funke",
    email: "funke@example.com",
    role: "organizer",
    bio: "Curator of tech conferences and workshops.",
  },
];

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className={`stat-tile ${color}`}>
      <div className="stat-tile-content">
        <div className="stat-label">{title}</div>
        <div className="stat-value">{value}</div>
      </div>
      <div className="stat-tile-icon-wrapper">
        <Icon size={24} className="stat-tile-icon" />
      </div>
    </div>
  );

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/users`, {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        });

        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.users)
          ? res.data.users
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        if (data.length === 0) {
          setUsers(MOCK_USERS);
          setError("No users returned from API. Using local sample users.");
          showToast("Using fallback sample users", "error");
        } else {
          setUsers(data);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        const message =
          err.response?.status === 401 || err.response?.status === 403
            ? "Admin access required to load users. Please sign in as an admin."
            : "Failed to load users. Showing sample data.";
        setError(message);
        setUsers(MOCK_USERS);
        showToast(message, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updateRole = async (id, role) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_URL}/users/${id}/role`,
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(users.map((u) => (u._id === id ? { ...u, ...res.data } : u)));
      showToast("User role updated successfully");
    } catch (err) {
      console.error("Error updating role:", err);
      showToast("Failed to update role", "error");
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.filter((u) => u._id !== id));
      showToast("User deleted successfully");
    } catch (err) {
      console.error("Error deleting user:", err);
      showToast("Failed to delete user", "error");
    }
  };

  const filteredUsers = users.filter((u) => {
    const name = u.username ? u.username.toLowerCase() : "";
    const email = u.email ? u.email.toLowerCase() : "";
    const matchSearch =
      name.includes(search.toLowerCase()) ||
      email.includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <div className="user-management">
      <div className="page-header">
        <div>
          <h2>User Management</h2>
          <p>View and manage registered participants, organizers, and admins.</p>
        </div>
      </div>

      <div className="user-metrics-grid">
        <StatCard
          title="Total Users"
          value={users.length}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Organizers"
          value={users.filter((u) => u.role === "organizer").length}
          icon={UserCheck}
          color="pink"
        />
        <StatCard
          title="Admins"
          value={users.filter((u) => u.role === "admin").length}
          icon={Shield}
          color="green"
        />
      </div>

      <div className="user-actions-bar">
        <div className="search-group">
          <label htmlFor="user-search" className="sr-only">
            Search users
          </label>
          <input
            id="user-search"
            type="text"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="role-filter" className="sr-only">
            Filter role
          </label>
          <select
            id="role-filter"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="organizer">Organizer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      ) : (
        <div className="user-table-wrapper">
          {error && (
            <div className="alert-banner">
              <p>{error}</p>
            </div>
          )}

          <table className="user-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td data-label="User">
                      <div className="user-info">
                        <div className="avatar">
                          {user.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="user-name">{user.username}</p>
                          <p className="user-bio">{user.bio || "Active member"}</p>
                        </div>
                      </div>
                    </td>
                    <td data-label="Email">{user.email}</td>
                    <td data-label="Role">
                      <div className="role-wrapper">
                        <span className={`role-badge role-${user.role}`}>
                          {user.role}
                        </span>
                        <select
                          value={user.role}
                          onChange={(e) => updateRole(user._id, e.target.value)}
                        >
                          <option value="user">User</option>
                          <option value="organizer">Organizer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </td>
                    <td data-label="Actions">
                      <button
                        onClick={() => deleteUser(user._id)}
                        className="delete-btn"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="empty-row">
                    No users match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
};

export default UserManagement;