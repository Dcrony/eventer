import { useEffect, useState, useContext } from "react";
import API from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { isAuthenticated, login } from "../utils/auth";
import { ThemeContext } from "../contexts/ThemeContexts";
import { ArrowRight } from "lucide-react";
import PasswordInput from "../components/PasswordInput";
import {
  sanitizeEmail,
  sanitizePassword,
  validateLoginForm,
} from "../utils/formValidation";
import icon from "../assets/icon.svg";
import "./CSS/forms.css";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
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
    const { name, value } = e.target;
    const sanitized =
      name === "email"
        ? sanitizeEmail(value)
        : name === "password"
          ? sanitizePassword(value)
          : value;
    setForm((prev) => ({ ...prev, [name]: sanitized }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { valid, errors: validationErrors } = validateLoginForm(form);
    setErrors(validationErrors);
    if (!valid) return;
    setSuccess("");
    setLoading(true);
    const payload = {
      email: sanitizeEmail(form.email),
      password: sanitizePassword(form.password),
    };
    try {
      const res = await API.post("/auth/login", payload);
      login(res.data.user, res.data.token);
      setSuccess("Login successful ✅ Redirecting...");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      setErrors({
        general:
          err.response?.data?.message ||
          "Login failed. Please check your credentials.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`form-page ${darkMode ? "dark-mode" : ""}`}>
      <div className="form-grid-background"></div>
      <div className="form-container">
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              textDecoration: "none",
              color: "inherit",
              marginBottom: "1rem",
            }}
          >
            <img src={icon} className="tickispot-icon" />
          </Link>
          <h1 className="form-title">Welcome Back</h1>
          <p className="form-subtitle">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit}>
          {errors.general && (
            <div className="form-alert form-alert-error">{errors.general}</div>
          )}
          {success && (
            <div className="form-alert form-alert-success">{success}</div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              name="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              className="form-input"
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <PasswordInput
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
            />
            {errors.password && (
              <span className="form-error">{errors.password}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="form-btn"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            {loading ? (
              "Signing in..."
            ) : (
              <>
                Sign In
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="form-footer">
          Don't have an account?{" "}
          <Link to="/register" className="form-link">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
