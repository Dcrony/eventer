import { useEffect, useState, useContext } from "react";
import API from "../api/axios";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { ThemeContext } from "../contexts/ThemeContexts";
import { login } from "../utils/auth";
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
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if already authenticated
    if (isAuthenticated()) {
      navigate("/dashboard", { replace: true });
      return;
    }

    // Handle Google OAuth callback token
    const token = searchParams.get("token");
    if (token) {
      try {
        // Parse token to get user data
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const user = JSON.parse(jsonPayload);

        // Auto-login with token
        login(user, token);
        setSuccess("Google signup successful! Redirecting...");
        setTimeout(() => navigate("/dashboard"), 1500);
      } catch (err) {
        console.error("Error processing Google OAuth token:", err);
        setError("Google signup failed. Please try again.");
      }
    }
  }, [navigate, searchParams]);

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

      setSuccess("Registration successful! Please check your email to verify your account.");
      // Don't redirect automatically
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

        <div style={{ textAlign: "center", margin: "1rem 0" }}>
          <button
            onClick={() => (window.location.href = "/api/auth/google")}
            className="form-btn-secondary"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              width: "100%",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with Google
          </button>
        </div>

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
