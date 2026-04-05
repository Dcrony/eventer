import { useState, useEffect, useContext } from "react";
import API from "../api/axios";
import { ThemeContext } from "../contexts/ThemeContexts";
import { useNavigate } from "react-router-dom";
import "./CSS/EditProfile.css";

const PORT_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/api\/?$/, "");

export default function EditProfile() {
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewPic, setPreviewPic] = useState(null);
  const [previewCover, setPreviewCover] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    bio: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
        setFormData({
          name: res.data.name || "",
          username: res.data.username || "",
          bio: res.data.bio || "",
        });
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ✅ Normalize file path so images always render correctly
const buildImageUrl = (path, type = "profile") => {
    if (!path) return "";
    // If already a full URL, return as-is
    if (/^https?:\/\//i.test(path)) return path;

    // strip leading slashes
    const normalized = path.replace(/^\/+/, "");

    // If path already references uploads/profile_pic or uploads/cover_pic or includes "uploads"
    if (
        normalized.startsWith("uploads") ||
        /profile_pic|cover_pic/.test(normalized)
    ) {
        return `${PORT_URL}/${normalized}`;
    }

    // If backend returned just a filename (no slash), pick folder based on type
    if (!normalized.includes("/")) {
        if (type === "cover") return `${PORT_URL}/uploads/cover_pic/${normalized}`;
        return `${PORT_URL}/uploads/profile_pic/${normalized}`;
    }

    // Fallback: join with base URL
    return `${PORT_URL}/${normalized}`;
};


  const handleImageUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem("token");
    const form = new FormData();
    form.append(type, file); // 'profilePic' or 'coverPic'

    try {
      setLoading(true);
      const endpoint =
        type === "profilePic" ? "/users/me/upload" : "/users/me/cover";

      const res = await API.post(endpoint, form, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      const objectUrl = URL.createObjectURL(file);

      if (type === "profilePic") {
        setPreviewPic(objectUrl);
        setUser((prev) => ({ ...prev, profilePic: res.data.profilePic }));
      } else {
        setPreviewCover(objectUrl);
        setUser((prev) => ({ ...prev, coverPic: res.data.coverPic }));
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("❌ Upload failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await API.put("/users/edit", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("✅ Profile updated successfully!");
      navigate(`/users/${user?.id ?? user?._id ?? ""}`);
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("❌ Update failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!user)
    return (
      <div className="editprofile-loading">
        <div className="spinner" />
        <p>Loading your profile...</p>
      </div>
    );

  return (
    <div className={`editprofile-page pl-20 ${darkMode ? "dark-mode" : ""}`}>
      {/* ===== Cover Section ===== */}
      <div className="cover-section">
        <img
          src={previewCover || buildImageUrl(user.coverPic, "cover") || "/cover.jpg"}
          alt="Cover"
          className="cover-image"
        />
        <label htmlFor="coverPic" className="cover-upload">
          {loading ? "Uploading..." : "Change Cover"}
          <input
            type="file"
            id="coverPic"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, "coverPic")}
          />
        </label>

        {/* ===== Profile Pic ===== */}
        <div className="profile-pic-wrapper">
          <img
            src={
              previewPic ||
              buildImageUrl(user.profilePic, "profile") ||
              "/default-avatar.png"
            }
            alt="Profile"
            className="profile-pic"
          />
          <label htmlFor="profilePic" className="profile-upload">
            {loading ? "Uploading..." : "Change Photo"}
            <input
              type="file"
              id="profilePic"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "profilePic")}
            />
          </label>
        </div>
      </div>

      {/* ===== Form Section ===== */}
      <form className="editprofile-form" onSubmit={handleSubmit}>
        <h2>Edit Profile</h2>

        <label>Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Your full name"
        />

        <label>Username</label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="@username"
        />

        <label>Bio</label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          placeholder="Write a short bio..."
          rows="4"
        />

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
