import { useEffect, useState } from "react";
import API from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../utils/auth";
import { ArrowRight } from "lucide-react";
import PasswordInput from "../components/PasswordInput";
import {
  sanitizeFullName,
  sanitizeUsername,
  sanitizeEmail,
  sanitizePhone,
  sanitizePassword,
  phoneDigitsOnly,
  validateRegisterForm,
} from "../utils/formValidation";
import "./CSS/forms.css";
import { isAuthenticated } from "../utils/auth";
import icon from "../assets/icon.svg";
import emailService from "../api/emailVerificationService";

export default function Register() {
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitized =
      name === "fullName"
        ? sanitizeFullName(value)
        : name === "username"
          ? sanitizeUsername(value)
          : name === "email"
            ? sanitizeEmail(value)
            : name === "phone"
              ? sanitizePhone(value)
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
      formData.append("fullName", sanitizeFullName(form.fullName));
      formData.append("username", sanitizeUsername(form.username));
      formData.append("email", sanitizeEmail(form.email));
      formData.append("phone", phoneDigitsOnly(form.phone));
      formData.append("password", sanitizePassword(form.password));

      const res = await API.post("/auth/register", formData);

      const { email, verificationCode } = res.data;
      if (email) localStorage.setItem("verifyEmail", email);
      if (verificationCode) {
        sessionStorage.setItem("pendingVerificationCode", verificationCode);
      } else {
        sessionStorage.removeItem("pendingVerificationCode");
      }

      navigate("/verify-otp", {
        replace: true,
        state: { email, verificationCode },
      });
    } catch (err) {
      setErrors({});
      setError(
        err.response?.data?.message || "Registration failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };


  const handleGoogleSignup = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const { signInWithGoogleAndGetIdToken } = await import("../utils/googleSignIn");
      const idToken = await signInWithGoogleAndGetIdToken();
      
      // 🆕 Use firebaseSync endpoint for OTP verification flow
      const result = await emailService.firebaseSync(idToken);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Check if user is already verified (Google Sign-In users are auto-verified)
      if (result.data.user.isVerified) {
        // User already verified - proceed to dashboard
        login(result.data.user, result.data.token);
        setSuccess("Google sign-up successful! Redirecting...");
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        const emailAddr = result.data.user.email;
        const code = result.data.verificationCode;
        localStorage.setItem("verifyEmail", emailAddr);
        if (code) sessionStorage.setItem("pendingVerificationCode", code);
        else sessionStorage.removeItem("pendingVerificationCode");
        navigate("/verify-otp", {
          replace: true,
          state: { email: emailAddr, verificationCode: code },
        });
      }
    } catch (err) {
      setError(
        err.message ||
          "Google sign-up failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-grid-background" aria-hidden="true" />
      <div className="form-layout">
        <aside className="form-brand-panel" aria-hidden="true">
          <span className="form-brand-float" />
          <span className="form-brand-float form-brand-float--2" />
          <div className="form-brand-inner">
            <img src={icon} className="tickispot-icon" alt="" />
            <h2 className="form-brand-headline">TickiSpot</h2>
            <p className="form-brand-tagline">
              Create your account and start selling tickets in minutes — with
              secure payments and real-time insights.
            </p>
          </div>
        </aside>
        <div className="form-auth-column">
      <div className="form-container">
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", color: "inherit", marginBottom: "1rem" }}>
            <img src={icon} className="tickispot-icon" alt="TickiSpot home" />
          </Link>
          <h1 className="form-title">Create Account</h1>
          <p className="form-subtitle">
            Add your name, username, contact details, and password to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
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
            <label className="form-label" htmlFor="reg-fullName">
              Full name
            </label>
            <input
              id="reg-fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="e.g. Ada Okafor"
              value={form.fullName}
              onChange={handleChange}
              className="form-input"
            />
            {errors.fullName && (
              <span className="form-error">{errors.fullName}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-username">
              Username
            </label>
            <input
              id="reg-username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Your public @handle (letters, numbers, _ -)"
              value={form.username}
              onChange={handleChange}
              className="form-input"
            />
            {errors.username && (
              <span className="form-error">{errors.username}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">
              Email
            </label>
            <input
              id="reg-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              className="form-input"
            />
            {errors.email && (
              <span className="form-error">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-phone">
              Phone number <span className="form-label-required">*</span>
            </label>
            <input
              id="reg-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="+234 800 000 0000"
              value={form.phone}
              onChange={handleChange}
              className="form-input"
            />
            <p className="form-hint">
              Include country code. At least 10 digits total.
            </p>
            {errors.phone && (
              <span className="form-error">{errors.phone}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">
              Password
            </label>
            <PasswordInput
              id="reg-password"
              name="password"
              placeholder="Create a password (min. 6 characters)"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
            {errors.password && (
              <span className="form-error">{errors.password}</span>
            )}
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
            type="button"
            onClick={handleGoogleSignup}
            className="form-btn form-btn-google"
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
      </div>
    </div>
  );
}
