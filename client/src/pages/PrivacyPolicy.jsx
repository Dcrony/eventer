import React from "react";
import { Shield, Lock, Eye, Database, Mail } from "lucide-react";

export default function PrivacyPolicy() {
  const lastUpdated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const sections = [
    {
      title: "Information We Collect",
      icon: Database,
      content: "We collect Account Information (name, email, phone number, password), Event Data (events created, tickets sold, attendee information), Payment Information (processed securely through payment partners), and Usage Data (how you interact with the platform)."
    },
    {
      title: "How We Use Your Information",
      icon: Eye,
      content: "We use your data to provide and improve services, process ticket sales and payouts, enable live streaming, send important notifications, ensure platform security, and personalize your experience."
    },
    {
      title: "Data Sharing",
      icon: Shield,
      content: "We do not sell your personal data. We may share information with payment processors and banking partners, event attendees (limited to necessary details), and legal authorities when required by law."
    },
    {
      title: "Data Security",
      icon: Lock,
      content: "We use industry-standard encryption, secure servers, and regular security audits to protect your information. However, no system is 100% secure."
    },
    {
      title: "Your Rights",
      icon: Shield,
      content: "You have the right to access, correct, or delete your personal data, object to certain processing activities, withdraw consent where applicable, and export your data from Account Settings."
    }
  ];

  return (
    <div className="min-h-full w-full bg-gray-50 font-geist ">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 pb-6 border-b border-gray-200">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-500">Last updated: {lastUpdated}</p>
        </div>

        {/* Introduction */}
        <div className="mb-8 p-5 rounded-xl bg-pink-50/50 border border-pink-100 text-center">
          <p className="text-gray-700">
            At <strong className="text-pink-600">TickiSpot</strong>, we value your trust and are committed to protecting 
            your personal information with transparency and care.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <div key={index} className="bg-white rounded-xl border border-gray-200 p-5 transition-all duration-200 hover:border-pink-200">
                <div className="flex items-center gap-3 mb-3 pb-2 border-b border-pink-200">
                  <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center text-pink-500">
                    <Icon size={16} />
                  </div>
                  <h2 className="text-base font-extrabold text-gray-900">{section.title}</h2>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{section.content}</p>
              </div>
            );
          })}
        </div>

        {/* Contact Section */}
        <div className="mt-8 p-5 rounded-xl bg-gray-50 border border-gray-200 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Mail size={16} className="text-pink-500" />
            <h3 className="text-sm font-semibold text-gray-900">Contact Us</h3>
          </div>
          <p className="text-sm text-gray-600">
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p className="text-sm font-semibold text-pink-600 mt-1">support@tickispot.com</p>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 text-center border-t border-gray-200">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} TickiSpot. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}