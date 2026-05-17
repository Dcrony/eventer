import { useEffect, useState } from "react";
import API from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import icon from "../assets/icon.svg";
import emailService from "../api/emailVerificationService";
import {
  sanitizeFullName,
  sanitizeUsername,
  sanitizeEmail,
  sanitizePhone,
  sanitizePassword,
  phoneDigitsOnly,
  validateRegisterForm,
} from "../utils/formValidation";

function PasswordInput({ name, placeholder, value, onChange, autoComplete }) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="relative">
      <input
        id={name}
        name={name}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none pr-11"
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-500 transition-colors"
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

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
  const { login: authLogin } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
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
      setError(err.response?.data?.message || "Registration failed. Try again.");
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
    const result = await emailService.firebaseSync(idToken);

    if (!result.success) throw new Error(result.error);

    // Google users are always verified — log in directly, no OTP
    authLogin(result.data.user, result.data.token);
    setSuccess("Google sign-up successful! Redirecting...");
    setTimeout(() => navigate("/dashboard"), 1500);
  } catch (err) {
    setError(err.message || "Google sign-up failed. Please try again.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-white font-inter">
      <div className="relative min-h-screen flex items-center justify-center p-4">
        {/* Animated Grid Background */}
        <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px] animate-grid-move" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_80%_15%,rgba(236,72,153,0.08),transparent_55%),radial-gradient(ellipse_50%_45%_at_10%_80%,rgba(59,130,246,0.06),transparent_50%)]" />
        </div>

        {/* Main Container */}
        <div className="relative z-10 w-full max-w-5xl min-h-[600px] bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] min-h-[600px]">
            
            {/* Brand Panel - Left Side */}
            <div className="md:block hidden relative bg-gradient-to-br from-white via-pink-50/50 to-gray-50 p-8 lg:p-10 overflow-hidden border-r border-gray-100">
              {/* Floating Blobs */}
              <div className="absolute w-44 h-44 rounded-full bg-pink-200/30 blur-3xl top-10 -right-10 animate-float" />
              <div className="absolute w-36 h-36 rounded-full bg-blue-200/20 blur-2xl bottom-10 -left-10 animate-float-delayed" />
              
              <div className="relative z-10 max-w-md">
                <img src={icon} alt="TickiSpot" className="w-12 h-12 mb-5 drop-shadow-lg" />
                <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-gray-900 mb-3">
                  Build events people remember
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Create your account and launch polished event pages with secure checkout and real-time audience insight.
                </p>
                <div className="mt-5 space-y-2">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <CheckCircle2 size={14} className="text-pink-500" /> Go live in under 10 minutes
                  </p>
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <CheckCircle2 size={14} className="text-pink-500" /> Ticketing, payments, and check-in included
                  </p>
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <CheckCircle2 size={14} className="text-pink-500" /> Built for creators, campuses, and brands
                  </p>
                </div>
              </div>
            </div>

            {/* Form Panel - Right Side */}
            <div className="p-6 sm:p-8 lg:p-10 bg-white/95 overflow-y-auto max-h-[90vh] lg:max-h-none">
              <div className="text-center mb-6">
                <Link to="/" className="inline-block mb-4 lg:hidden">
                  <img src={icon} alt="TickiSpot" className="w-10 h-10 mx-auto" />
                </Link>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 mb-1">
                  Create Account
                </h1>
                <p className="text-sm text-gray-500">Add your details once and start creating events right away.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Error Alert */}
                {(error || errors.general) && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium animate-slide-down">
                    {error || errors.general}
                  </div>
                )}
                
                {/* Success Alert */}
                {success && (
                  <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-600 text-sm font-medium animate-slide-down">
                    {success}
                  </div>
                )}

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Full name
                  </label>
                  <input
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="e.g. Ada Okafor"
                    value={form.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none"
                  />
                  {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Username
                  </label>
                  <input
                    name="username"
                    type="text"
                    autoComplete="username"
                    placeholder="Your public @handle (letters, numbers, _ -)"
                    value={form.username}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none"
                  />
                  {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none"
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Phone number <span className="text-pink-500">*</span>
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="+234 800 000 0000"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">Include country code. At least 10 digits total.</p>
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Password
                  </label>
                  <PasswordInput
                    name="password"
                    placeholder="Create a password (min. 6 characters)"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-pink-500 text-white text-sm font-bold transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Google Sign Up */}
              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  className="w-full py-2.5 rounded-xl bg-white border border-gray-300 text-gray-700 text-sm font-semibold transition-all duration-200 hover:bg-gray-50 hover:-translate-y-0.5 flex items-center justify-center gap-2"
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

              {/* Footer Links */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Already have an account?{" "}
                  <Link to="/login" className="font-semibold text-pink-500 hover:text-pink-600 transition-colors">
                    Sign in
                  </Link>
                </p>
                <p className="text-[0.65rem] text-gray-400 mt-3">
                  By creating an account, you agree to TickiSpot's -{" "}
                  <Link to="/terms" className="hover:text-pink-500 transition-colors">Terms</Link> and{" "}
                  <Link to="/privacy" className="hover:text-pink-500 transition-colors">Privacy policy</Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes grid-move {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-10px, 15px) scale(1.05); }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-grid-move { animation: grid-move 20s linear infinite; }
        .animate-float { animation: float 12s ease-in-out infinite; }
        .animate-float-delayed { animation: float 12s ease-in-out infinite -4s; }
        .animate-slide-down { animation: slide-down 0.3s ease-out; }
      `}</style>
    </div>
  );
}