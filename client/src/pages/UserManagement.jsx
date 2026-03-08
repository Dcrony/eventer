import React, { useEffect, useState } from "react";
import axios from "axios";
import "./CSS/UserManagement.css"; // import your CSS file

const PORT_URL = import.meta.env.REACT_APP_API_URL || "http://localhost:8080";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${PORT_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data);
      } catch (err) {
        console.error("Error fetching users:", err);
        showToast("Failed to load users", "error");
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
        `${PORT_URL}/api/profile/${id}/role`,
        { role },
        { headers: { Authorization: `Bearer ${token}` } },
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
      await axios.delete(`${PORT_URL}/api/profile/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.filter((u) => u._id !== id));
      showToast("User deleted successfully");
    } catch (err) {
      console.error("Error deleting user:", err);
      showToast("Failed to delete user", "error");
    }
  };

  // 🔍 Filtered & searched users
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
    <div className="user-management pt-20 px-20 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">User Management</h2>

      {/* Analytics Cards */}
      <div className="user-stats">
        <div className="stat-card">
          <h4>Total Users</h4>
          <p>{users.length}</p>
        </div>

        <div className="stat-card">
          <h4>Organizers</h4>
          <p>{users.filter((u) => u.role === "organizer").length}</p>
        </div>

        <div className="stat-card">
          <h4>Admins</h4>
          <p>{users.filter((u) => u.role === "admin").length}</p>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded focus:outline-none focus:ring"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="all">All Roles</option>
          <option value="user">User</option>
          <option value="organizer">Organizer</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* User Table */}
      <table className="user-table w-full border rounded overflow-hidden">
        <thead>
          <tr>
            <th className="p-3 border">Name</th>
            <th className="p-3 border">Email</th>
            <th className="p-3 border">Role</th>
            <th className="p-3 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <tr
                key={user._id}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <td className="user-info">
                  <div className="avatar">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                  <span>{user.username}</span>
                </td>
                <td className="p-3 border">{user.email}</td>
                <td>
                  <div className={`role-badge role-${user.role}`}>
                    {user.role}
                  </div>

                  <select
                    value={user.role}
                    onChange={(e) => updateRole(user._id, e.target.value)}
                  >
                    <option value="user">User</option>
                    <option value="organizer">Organizer</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="p-3 border text-center">
                  <button
                    onClick={() => deleteUser(user._id)}
                    className="delete-btn text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center p-4">
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="pagination">
        <button>Previous</button>
        <button>1</button>
        <button>2</button>
        <button>Next</button>
      </div>

      {/* Toast Notification */}
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
};

export default UserManagement;
