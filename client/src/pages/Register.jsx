import { useEffect, useState, useContext } from "react";
import API from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { ThemeContext } from "../contexts/ThemeContexts";
import { ArrowRight } from "lucide-react";
import PasswordInput from "../components/PasswordInput";
import {
  sanitizeUsername,
  sanitizeEmail,
  sanitizePassword,
  validateRegisterForm,
} from "../utils/formValidation";
import "./CSS/forms.css";
import { isAuthenticated } from "../utils/auth";
import icon from "../assets/icon.svg";


export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    isOrganizer: false,
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    const sanitized =
      name === "username"
        ? sanitizeUsername(value)
        : name === "email"
          ? sanitizeEmail(value)
          : name === "password"
            ? sanitizePassword(value)
            : value;
    setForm((prev) => ({ ...prev, [name]: sanitized }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const { valid, errors: validationErrors } = validateRegisterForm(form);
    setErrors(validationErrors);
    if (!valid) return;
    setSuccess("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("username", sanitizeUsername(form.username));
      formData.append("email", sanitizeEmail(form.email));
      formData.append("password", sanitizePassword(form.password));
      formData.append("isOrganizer", form.isOrganizer ? "true" : "false");

      await API.post("/auth/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess("Registered successfully ✅ Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setErrors({});
      setError(
        err.response?.data?.message || "Registration failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`form-page ${darkMode ? "dark-mode" : ""}`}>
      <div className="form-grid-background"></div>
      <div className="form-container">
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", color: "inherit", marginBottom: "1rem" }}>
            <img src={icon} className="tickispot-icon" />
          </Link>
          <h1 className="form-title">Create Account</h1>
          <p className="form-subtitle">Join TickiSpot and start creating amazing events</p>
        </div>

        <form onSubmit={handleSubmit}>
          {(error || errors.general) && (
            <div className="form-alert form-alert-error">
              {error || errors.general}
            </div>
          )}
          {success && (
            <div className="form-alert form-alert-success">
              {success}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              name="username"
              type="text"
              placeholder="Choose a username"
              value={form.username}
              onChange={handleChange}
              className="form-input"
              required
            />
            {errors.username && (
              <span className="form-error">{errors.username}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              name="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              className="form-input"
              required
            />
            {errors.email && (
              <span className="form-error">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <PasswordInput
              name="password"
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange}
              required
            />
            {errors.password && (
              <span className="form-error">{errors.password}</span>
            )}
          </div>

          <div className="form-checkbox-wrapper">
            <input
              type="checkbox"
              name="isOrganizer"
              checked={form.isOrganizer}
              onChange={handleChange}
              className="form-checkbox"
              id="isOrganizer"
            />
            <label htmlFor="isOrganizer" className="form-checkbox-label">
              I'm an Event Organizer
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="form-btn"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
          >
            {loading ? "Creating Account..." : (
              <>
                Create Account
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="form-footer">
          Already have an account?{" "}
          <Link to="/login" className="form-link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
