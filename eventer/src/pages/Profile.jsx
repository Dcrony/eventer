import React, { useState, useEffect } from "react";
import axios from "axios";

const Profile = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [userDetails, setUserDetails] = useState(null);
  const [message, setMessage] = useState("");

  // Load current profile when page loads
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get("http://localhost:5000/api/profile/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFormData({ name: data.name, email: data.email, password: "" });
        setUserDetails(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchProfile();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle submit
  const handleSubmit = async (id, e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.put(
        "http://localhost:5000/api/profile/me",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("✅ Profile updated successfully!");
      setFormData({ ...formData, password: "" });
      setUserDetails(data);
    } catch (error) {
      setMessage("❌ Error updating profile");
      console.error(error);
    }
  };

  return (
    <div className="pt-20">
      <div className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow">
        <h2 className="text-2xl font-bold mb-4">My Profile</h2>

        {message && <p className="mb-4 text-center text-blue-600">{message}</p>}

        {/* Show details (non-editable) */}
        {userDetails && (
          <div>
            <p className="mb-2">
              <strong>Username:</strong> {userDetails.name}
            </p>
            <p className="mb-4">
              <strong>Email:</strong> {userDetails.email}
            </p>
            <div className="mb-6 text-gray-700">
            <p>
              <strong>Role:</strong> {userDetails.role}
            </p>
            <p>
              <strong>Joined:</strong>{" "}
              {new Date(userDetails.createdAt).toLocaleDateString()}
            </p>
          </div>
          </div>
        )}

        {/* Form for editing */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block mb-1">New Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Leave blank to keep current password"
              className="w-full border p-2 rounded"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Update Profile
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
