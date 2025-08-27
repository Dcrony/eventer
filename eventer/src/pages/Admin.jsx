import React, { useEffect, useState } from "react";
import axios from "axios";

const UserManagement = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    };
    fetchUsers();
  }, []);

  const updateRole = async (id, role) => {
    const token = localStorage.getItem("token");
    const res = await axios.put(
      `http://localhost:5000/api/profile/${id}/role`,
      { role },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setUsers(users.map(u => (u._id === id ? res.data : u)));
  };

  const deleteUser = async (id) => {
    const token = localStorage.getItem("token");
    await axios.delete(`http://localhost:5000/api/profile/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUsers(users.filter(u => u._id !== id));
  };

  return (
    <div className="pl-60 pt-20 pr-6">
      <h2 className="text-2xl font-bold mb-4">User Management</h2>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Role</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id}>
              <td className="p-2 border">{user.name}</td>
              <td className="p-2 border">{user.email}</td>
              <td className="p-2 border">
                <select
                  value={user.role}
                  onChange={(e) => updateRole(user._id, e.target.value)}
                  className="border p-1"
                >
                  <option value="user">User</option>
                  <option value="organizer">Organizer</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td className="p-2 border">
                <button
                  onClick={() => deleteUser(user._id)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagement;
