import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../api/axios";
import icon from "../assets/icon.svg";
import { ArrowLeft, CheckCircle, AlertCircle, Clock, Mail } from "lucide-react";

const PENDING_CODE_KEY = "pendingVerificationCode";

const VerifyEmailOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timeLeft, setTimeLeft] = useState(600);
  const [resendLoading, setResendLoading] = useState(false);

  const email = location.state?.email || localStorage.getItem("verifyEmail");

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleInputChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length !== 6) return;
    e.preventDefault();
    setOtp(text.split(""));
    const last = document.getElementById("otp-input-5");
    if (last) last.focus();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Email not found. Please sign up again.");
      return;
    }
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const response = await API.post("/auth/verify-otp", { email, otp: otpCode });
      setSuccess("✅ Email verified successfully!");
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      localStorage.removeItem("verifyEmail");
      sessionStorage.removeItem(PENDING_CODE_KEY);
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to verify OTP. Please try again.";
      setError(message);
      setOtp(["", "", "", "", "", ""]);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setError("Email not found. Please sign up again.");
      return;
    }
    setError("");
    setResendLoading(true);
    try {
      setSuccess("✅ New code sent to your email.");
      setTimeLeft(600);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to get a new code. Please try again.";
      setError(message);
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/20 font-geist flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center max-w-md">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-semibold">Email not found</p>
          <button onClick={() => navigate("/register")} className="mt-4 px-4 py-2 rounded-full bg-pink-500 text-white text-sm font-semibold hover:bg-pink-600">
            Back to Sign Up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/20 font-geist flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-pink-500 transition-colors">
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8">
          <div className="text-center mb-6">
            <img src={icon} alt="TickiSpot" className="w-12 h-12 mx-auto mb-4" />
            <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-3">
              <Mail size={24} className="text-pink-500" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Verify your email</h1>
            <p className="text-sm text-gray-500">
              Enter the 6-digit code for <br />
              <strong className="text-gray-700">{email}</strong>
            </p>
          </div>

          {/* Timer Banner */}
          <div className={`p-3 rounded-xl text-center text-sm mb-5 ${timeLeft < 120 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
            <Clock size={14} className="inline mr-1" />
            Code expires in: <strong>{formatTime(timeLeft)}</strong>
          </div>

          <form onSubmit={handleVerifyOtp}>
            {/* OTP Inputs */}
            <div className="flex justify-center gap-3 mb-5" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-input-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  placeholder="—"
                  disabled={loading}
                  className="w-12 h-12 sm:w-14 sm:h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none transition-all"
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm mb-4">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200 text-green-600 text-sm mb-4">
                <CheckCircle size={16} /> {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otp.some((digit) => !digit)}
              className="w-full py-2.5 rounded-full bg-pink-500 text-white text-sm font-bold transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 shadow-md shadow-pink-500/25"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : (
                "Verify"
              )}
            </button>
          </form>

          {/* Resend Section */}
          <div className="text-center mt-6 pt-5 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-2">Need a new code?</p>
            <button
              onClick={handleResendOtp}
              disabled={resendLoading}
              className="text-sm font-semibold text-pink-500 hover:text-pink-600 transition-colors disabled:opacity-50"
            >
              {resendLoading ? "Working..." : "Get new code"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailOtp;