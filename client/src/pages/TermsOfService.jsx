import React from "react";
import { Link } from "react-router-dom";
import { Shield, Scale, FileText, ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  const lastUpdated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const sections = [
    {
      title: "Acceptance of Terms",
      content: "By using TickiSpot, you confirm that you have read, understood, and agree to these Terms of Service and our Privacy Policy."
    },
    {
      title: "Use of the Platform",
      content: "You agree to use TickiSpot only for lawful purposes and in accordance with these terms. You must not use the platform to host illegal, fraudulent, or harmful events."
    },
    {
      title: "Account Responsibility",
      content: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account."
    },
    {
      title: "Payments and Fees",
      content: "All ticket sales are processed securely. TickiSpot charges a service fee on paid events. Organizers are responsible for accurate pricing and refunds where applicable."
    },
    {
      title: "Content and Events",
      content: "You retain ownership of content you upload. However, you grant TickiSpot a license to display and promote your events on the platform."
    },
    {
      title: "Termination",
      content: "We reserve the right to suspend or terminate accounts that violate these terms or engage in prohibited activities."
    },
    {
      title: "Limitation of Liability",
      content: "TickiSpot is provided 'as is'. We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform."
    },
    {
      title: "Changes to Terms",
      content: "We may update these terms from time to time. Continued use of TickiSpot after changes constitutes acceptance of the new terms."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-geist">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-pink-500 transition-colors mb-6">
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100 text-pink-600 text-xs font-semibold mb-4">
            <FileText size={14} />
            Legal Agreement
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
            Terms of Service
          </h1>
          <p className="text-sm text-gray-500">Last updated: {lastUpdated}</p>
        </div>

        {/* Introduction */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6 mb-8 border border-pink-100">
          <p className="text-gray-700 leading-relaxed">
            Welcome to <strong className="text-pink-600">TickiSpot</strong>. By accessing or using our platform, 
            you agree to be bound by these Terms of Service.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-5 transition-all duration-200 hover:border-pink-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center text-pink-500">
                  <Scale size={16} />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-gray-900 mb-2">{section.title}</h2>
                  <p className="text-sm text-gray-600 leading-relaxed">{section.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
            <Shield size={16} className="text-green-500" />
            <span>Your trust is our priority. Read our </span>
            <Link to="/privacy" className="text-pink-500 hover:underline">Privacy Policy</Link>
          </div>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} TickiSpot. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Questions? Contact us at{" "}
            <a href="mailto:support@tickispot.com" className="text-pink-500 hover:underline">
              support@tickispot.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}