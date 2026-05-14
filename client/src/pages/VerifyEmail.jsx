import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import API from "../api/axios";
import icon from "../assets/icon.svg";
import { CheckCircle, AlertCircle, Loader2, ArrowLeft } from "lucide-react";

export default function VerifyEmail() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Invalid verification link. Please use the 6-digit code from the verify page.");
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        await API.post("/auth/verify-email", { token });
        setMessage("Email verified successfully! You can now log in.");
        setTimeout(() => navigate("/events"), 3000);
      } catch (err) {
        setError(err.response?.data?.message || "Verification failed.");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/20 font-geist flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-pink-500 transition-colors">
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8 text-center">
          <img src={icon} alt="TickiSpot" className="w-12 h-12 mx-auto mb-4" />

          <h1 className="text-2xl font-extrabold text-gray-900 mb-4">Email Verification</h1>

          {loading && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 size={32} className="text-pink-500 animate-spin" />
              <p className="text-gray-500">Verifying your email...</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {message && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200 text-green-600 text-sm">
              <CheckCircle size={16} />
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}