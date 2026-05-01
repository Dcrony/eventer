import { useEffect, useState } from "react";
import API from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import PasswordInput from "../components/PasswordInput";
import {
  sanitizeEmail,
  sanitizePassword,
  validateLoginForm,
} from "../utils/formValidation";
import icon from "../assets/icon.svg";
import "./CSS/forms.css";
import emailService from "../api/emailVerificationService";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/events", { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
      const data = err.response?.data;
      if (err.response?.status === 403 && data?.code === "OTP_SENT") {
        const email = sanitizeEmail(form.email);
        localStorage.setItem("verifyEmail", email);
        if (data.verificationCode) {
          sessionStorage.setItem("pendingVerificationCode", data.verificationCode);
        } else {
          sessionStorage.removeItem("pendingVerificationCode");
        }
        navigate("/verify-otp", {
          replace: true,
          state: { email, verificationCode: data.verificationCode },
        });
        return;
      }
      setErrors({
        general:
          data?.message ||
          "Login failed. Please check your credentials.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrors({});
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

      // Check if user is verified
      if (result.data.user.isVerified) {
        // Already verified - proceed to dashboard
        login(result.data.user, result.data.token);
        setSuccess("Google login successful! Redirecting...");
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
      setErrors({
        general:
          err.message ||
          "Google sign-in failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page auth-page">
      <div className="form-grid-background" aria-hidden="true" />
      <div className="form-layout">
        <aside className="form-brand-panel" aria-hidden="true">
          <span className="form-brand-float" />
          <span className="form-brand-float form-brand-float--2" />
          <div className="form-brand-inner">
            <img src={icon} className="tickispot-icon" alt="" />
            <h2 className="form-brand-headline">Welcome back to your command center</h2>
            <p className="form-brand-tagline">
              Everything you need to run smooth events and increase ticket sales
              is one sign-in away.
            </p>
            <div className="auth-benefits">
              <p>
                <CheckCircle2 size={14} />
                Live sales and payout visibility
              </p>
              <p>
                <CheckCircle2 size={14} />
                QR check-in and attendee control
              </p>
              <p>
                <CheckCircle2 size={14} />
                Stream, message, and analytics in one workflow
              </p>
            </div>
          </div>
        </aside>
        <div className="form-auth-column">
      <div className="form-container">
        <div className="form-intro">
          <Link to="/" className="form-home-link">
            <img src={icon} className="tickispot-icon" alt="TickiSpot home" />
          </Link>
          <h1 className="form-title">Welcome Back</h1>
          <p className="form-subtitle">Sign in to manage events, tickets, and attendees.</p>
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
            <div className="form-inline-row">
              <Link to="/forgot-password" className="form-link">
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="form-btn form-btn-main"
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

        <div className="form-provider-row">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="form-btn form-btn-google"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        </div>

        <div className="form-footer">
          Don't have an account?{" "}
          <Link to="/register" className="form-link">
            Sign up
          </Link>
        </div>
        <p className="auth-legal-note">
          By continuing, you agree to TickiSpot&apos;s -
              <Link to="/terms"> Terms</Link> and 
              <Link to="/privacy"> Privacy</Link> policy.
        </p>
      </div>
        </div>
      </div>
    </div>
  );
}
