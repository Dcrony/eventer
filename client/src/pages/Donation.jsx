import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { X, Heart, Sparkles, CheckCircle, AlertCircle, Shield, CreditCard, Lock } from "lucide-react";
import API from "../api/axios";

export default function Donation() {
  const [searchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    amount: "",
    message: ""
  });
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const statusParam = searchParams.get('status');
    const reference = searchParams.get('reference');

    if (statusParam === 'success') {
      setStatus({
        type: 'success',
        message: 'Thank you for your donation! Your payment has been processed successfully.',
        reference
      });
      setShowForm(false);
    } else if (statusParam === 'failed') {
      setStatus({
        type: 'error',
        message: 'Payment failed. Please try again.'
      });
      setShowForm(true);
    }
  }, [searchParams]);

  const presetAmounts = [
    { value: 500, label: "₦500" },
    { value: 1000, label: "₦1,000" },
    { value: 5000, label: "₦5,000" },
    { value: 10000, label: "₦10,000" }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'amount') setSelectedPreset(null);
  };

  const handlePresetSelect = (amount) => {
    setSelectedPreset(amount);
    setFormData(prev => ({ ...prev, amount: amount.toString() }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await API.post('/donations', {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      if (response.data.success) {
        window.location.href = response.data.authorization_url;
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setShowForm(false);
    setStatus(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/20 font-geist ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center">
          {/* Header */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100 text-pink-600 text-xs font-semibold mb-4">
            <Heart size={14} />
            Support Our Mission
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
            Help us build the future
            <br />
            <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              of event technology
            </span>
          </h1>
          
          <p className="text-lg text-gray-500 p-6">
            Your support helps us improve, innovate, and keep the platform accessible for <br/> creators and organizers worldwide.
          </p>

          {/* Success Message */}
          {status?.type === 'success' && (
            <div className="max-w-md mx-auto mb-8 p-4 rounded-xl bg-green-50 border border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle size={24} className="text-green-500" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-green-700">Thank you for your donation!</p>
                  <p className="text-xs text-green-600">Your payment has been processed successfully.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowForm(true)} 
                className="mt-3 w-full py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
              >
                Donate Again
              </button>
            </div>
          )}

          {/* Donate Button */}
          {status?.type !== 'success' && (
            <button 
              onClick={() => setShowForm(true)} 
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-pink-500 text-white text-lg font-bold transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 shadow-xl shadow-pink-500/30"
            >
              <Heart size={20} />
              Donate Now
            </button>
          )}
        </div>

        {/* Impact Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 max-w-3xl mx-auto">
          <div className="text-center p-4">
            <div className="text-2xl font-extrabold text-pink-500">50K+</div>
            <p className="text-sm text-gray-500">Events created</p>
          </div>
          <div className="text-center p-4">
            <div className="text-2xl font-extrabold text-pink-500">500K+</div>
            <p className="text-sm text-gray-500">Tickets sold</p>
          </div>
          <div className="text-center p-4">
            <div className="text-2xl font-extrabold text-pink-500">10K+</div>
            <p className="text-sm text-gray-500">Active organizers</p>
          </div>
        </div>
      </div>

      {/* Donation Modal - FIXED SCROLLABLE VERSION */}
      {showForm && (
        <div
          className="fixed inset-0 z-[10003] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={closeModal}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pink accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-pink-500 to-fuchsia-500 flex-shrink-0" />

            {/* Modal Header - Fixed (non-scrolling) */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500">
                  <Heart size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 tracking-tight">Make a Donation</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Your contribution helps us build a better platform.</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-pink-500 transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name Field */}
                <div className="space-y-1.5">
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">
                    Full Name <span className="text-pink-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none"
                  />
                </div>

                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">
                    Email Address <span className="text-pink-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none"
                  />
                </div>

                {/* Donation Amount Field */}
                <div className="space-y-1.5">
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">
                    Donation Amount <span className="text-pink-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    {presetAmounts.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => handlePresetSelect(preset.value)}
                        className={`py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                          selectedPreset === preset.value
                            ? "bg-pink-500 text-white shadow-md scale-[1.02]"
                            : "bg-gray-100 text-gray-700 hover:bg-pink-100 hover:text-pink-600"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₦</span>
                    <input
                      type="number"
                      name="amount"
                      placeholder="Custom amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none"
                    />
                  </div>
                </div>

                {/* Message Field */}
                <div className="space-y-1.5">
                  <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">
                    Message <span className="font-normal lowercase text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={3}
                    maxLength={200}
                    placeholder="Leave a message of support..."
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none resize-none"
                  />
                  <div className="flex justify-end">
                    <span className="text-xs text-gray-400">{formData.message.length}/200</span>
                  </div>
                </div>

                {/* Error Message */}
                {status?.type === 'error' && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <span>{status.message}</span>
                  </div>
                )}
              </form>
            </div>

            {/* Footer - Fixed (non-scrolling) */}
            <div className="px-6 pb-6 pt-2 border-t border-gray-100 flex-shrink-0">
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full py-2.5 rounded-full bg-pink-500 text-white text-sm font-bold transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 shadow-md shadow-pink-500/25"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  "Continue to Payment"
                )}
              </button>

              {/* Trust Badges - Using real icons */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-400 mb-2">Your donation is secure and encrypted</p>
                <div className="flex items-center justify-center gap-4">
                  <span className="inline-flex items-center gap-1.5 text-[0.65rem] text-gray-500">
                    <Lock size={12} className="text-green-500" />
                    SSL Secure
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[0.65rem] text-gray-500">
                    <CreditCard size={12} className="text-blue-500" />
                    Instant Payment
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[0.65rem] text-gray-500">
                    <Shield size={12} className="text-purple-500" />
                    Protected
                  </span>
                </div>
              </div>
            </div>

            <style jsx>{`
              @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes scale-in {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
              }
              .animate-fade-in {
                animation: fade-in 0.2s ease-out;
              }
              .animate-scale-in {
                animation: scale-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}