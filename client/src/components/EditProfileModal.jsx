import { useState, useContext } from "react";
import axios from "../api/axios";
import { ThemeContext } from "../contexts/ThemeContexts";
import PasswordInput from "./PasswordInput";
import "./css/EditProfileModel.css";

export default function EditProfileModal({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
}) {
  const { darkMode } = useContext(ThemeContext);

  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    username: currentUser?.username || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    bio: currentUser?.bio || "",
    currentPassword: "",
    newPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    // Validation
    if (!formData.name.trim()) {
      setMessage({ text: "Name is required", type: "error" });
      setLoading(false);
      return;
    }
    if (formData.newPassword && !formData.currentPassword) {
      setMessage({ text: "Current password is required to change password", type: "error" });
      setLoading(false);
      return;
    }

    try {
      // Update profile
      const { data } = await axios.put("/users/edit", formData);
      onProfileUpdated && onProfileUpdated(data.user);

      setMessage({ text: "Profile updated successfully!", type: "success" });
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        "Error updating profile. Please try again.";
      setMessage({ text: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`settings-modal-backdrop ${darkMode ? "dark-mode" : ""}`}
    >
      <div className="settings-modal">
        <h2>Account Settings</h2>

        {message.text && (
          <div className={`alert ${message.type}`}>{message.text}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-content">
            <label>
              Name
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </label>

            <label>
              Username
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
              />
            </label>

            <label>
              Email
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </label>

            <label>
              Phone
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </label>

            <label>
              Bio
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
              ></textarea>
            </label>

            <label>
              Current Password
              <PasswordInput
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
              />
            </label>

            <label>
              New Password
              <PasswordInput
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
              />
            </label>
          </div>

          <div className="settings-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
