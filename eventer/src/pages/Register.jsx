import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import "./CSS/login.css";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    isOrganizer: false,
    isAdmin: false, // 👈 added
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    formData.append("username", form.username);
    formData.append("email", form.email);
    formData.append("password", form.password);

    // Convert booleans to strings
    formData.append("isOrganizer", form.isOrganizer ? "true" : "false");
    formData.append("isAdmin", form.isAdmin ? "true" : "false");

    // Append image if selected
    if (imageFile) {
      formData.append("profilePic", imageFile);
    }

    try {
      await API.post("auth/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess("Registered successfully");
      navigate("/login");
    } catch (err) {
      console.error(err);
      setError("Registration failed");
    }
  };

  return (
    <div className="login">
      <div className="form">
        <h2>Register</h2>
        <form onSubmit={handleSubmit}>
          <div className="error-message">{error}</div>
          <div className="success-message">{success}</div>

          <label htmlFor="imageUpload">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  width: "100px",
                  height: "100px",
                  objectFit: "cover",
                  cursor: "pointer",
                  borderRadius: "50%",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  padding: "10px",
                  border: "1px dashed #ccc",
                  cursor: "pointer",
                  borderRadius: "50%",
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                Upload Image
              </div>
            )}
          </label>
          <input
            id="imageUpload"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageChange}
          />

          <input
            name="username"
            placeholder="Username"
            onChange={handleChange}
            required
          />
          <input
            name="email"
            placeholder="Email"
            type="email"
            onChange={handleChange}
            required
          />
          <input
            name="password"
            placeholder="Password"
            type="password"
            onChange={handleChange}
            required
          />

          {/* Organizer checkbox */}
          <label>
            <span><input
              type="checkbox"
              name="isOrganizer"
              checked={form.isOrganizer}
              onChange={handleChange}
            /></span>
            <span>I'm an Organizer</span>
          </label>

          {/* Admin checkbox */}
          <label>
            <span>
              <input
              type="checkbox"
              name="isAdmin"
              checked={form.isAdmin}
              onChange={handleChange}
            />
            </span>
            <span>I'm an Admin</span>
          </label>

          <button type="submit">Register</button>
        </form>
      </div>
    </div>
  );
}
