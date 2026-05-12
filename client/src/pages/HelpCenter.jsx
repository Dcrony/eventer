import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Search, MessageCircle, Headphones, ArrowRight, Ticket, CreditCard, Video, BarChart3, User, Wrench } from "lucide-react";

export default function HelpCenter() {
  const [searchTerm, setSearchTerm] = useState("");

  const helpTopics = [
    { icon: <Ticket size={24} />, title: "Create & Manage Events", desc: "Step-by-step guide to creating, editing, and publishing events.", link: "/help/create-events" },
    { icon: <CreditCard size={24} />, title: "Payments, Payouts & Refunds", desc: "How to receive payments and withdraw your earnings.", link: "/help/payments" },
    { icon: <Video size={24} />, title: "Live Streaming Setup", desc: "Set up reliable live events for your audience.", link: "/help/live-streaming" },
    { icon: <BarChart3 size={24} />, title: "Analytics & Insights", desc: "Understand your event performance and audience data.", link: "/help/analytics" },
    { icon: <User size={24} />, title: "Account & Profile", desc: "Manage your account, privacy, and security settings.", link: "/help/account" },
    { icon: <Wrench size={24} />, title: "Troubleshooting", desc: "Fix common issues with ticketing and streaming.", link: "/help/troubleshooting" },
  ];

  const filteredTopics = helpTopics.filter(topic =>
    topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 font-geist pt-8 lg:pl-[var(--sidebar-width,0px)] pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100 text-pink-600 text-xs font-semibold mb-3">
            <Headphones size={14} />
            Help Center
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 mb-3">
            How can we help you?
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Everything you need to host successful events on TickiSpot
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto mb-10">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search help articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-full border-2 border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none transition-all shadow-sm"
          />
        </div>

        {/* Topics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {filteredTopics.map((topic, index) => (
            <Link
              key={index}
              to={topic.link}
              className="group bg-white rounded-xl border border-gray-200 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-pink-200/40"
            >
              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center text-pink-500 mb-4 group-hover:bg-pink-500 group-hover:text-white transition-all duration-300">
                {topic.icon}
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2 group-hover:text-pink-500 transition-colors">
                {topic.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-3">{topic.desc}</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-pink-500 group-hover:gap-2 transition-all">
                Read more <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>

        {/* Still Need Help Section */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-extrabold mb-2">Still need help?</h2>
          <p className="text-white/90 mb-6">Our support team is ready to assist you personally.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-pink-600 font-semibold transition-all duration-200 hover:bg-gray-100 hover:-translate-y-0.5 shadow-md"
            >
              ✉️ Contact Support
            </Link>
            <a
              href="https://wa.me/2349056911562"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-500 text-white font-semibold transition-all duration-200 hover:bg-green-600 hover:-translate-y-0.5 shadow-md"
            >
              <MessageCircle size={18} />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}