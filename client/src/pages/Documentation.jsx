import React from "react";
import { Link } from "react-router-dom";
import { Code2, Package, Webhook, ArrowRight, Shield, Zap, Server, Sparkles } from "lucide-react";

export default function Documentation() {
  return (
    <div className="min-h-screen bg-gray-50 font-geist pt-8 lg:pl-[var(--sidebar-width,0px)] pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section - Light Theme */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100 text-pink-600 text-xs font-semibold mb-4">
            <Code2 size={14} />
            Developer Platform
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 mb-4">
            Build on TickiSpot
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-6">
            Integrate event creation, ticketing, payments, and livestreaming into your apps
            with our powerful APIs and developer tools.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-pink-500 text-white font-semibold hover:bg-pink-600 transition-all duration-200 shadow-md shadow-pink-500/25"
            >
              View Documentation
              <ArrowRight size={18} />
            </a>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-gray-200 bg-white text-gray-700 font-semibold hover:border-pink-300 hover:text-pink-500 transition-all duration-200"
            >
              Get API Keys
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">
            Everything you need to integrate
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Comprehensive tools and documentation to help you build seamlessly on top of TickiSpot
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* REST API Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-pink-200/40">
            <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center text-pink-500 mb-4">
              <Server size={24} />
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">REST API</h3>
            <p className="text-sm text-gray-500 mb-4">
              Manage events, users, tickets, and payments programmatically with our comprehensive REST API.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-mono">GET</span>
              <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-mono">POST</span>
              <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-mono">PUT</span>
              <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-mono">DELETE</span>
            </div>
          </div>

          {/* SDKs Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-pink-200/40">
            <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center text-pink-500 mb-4">
              <Package size={24} />
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">SDKs & Libraries</h3>
            <p className="text-sm text-gray-500 mb-4">
              Quickly integrate using our JavaScript SDK and upcoming mobile SDKs for iOS and Android.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-mono">JavaScript</span>
              <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-mono">React</span>
              <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-mono">Node.js</span>
            </div>
          </div>

          {/* Webhooks Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-pink-200/40">
            <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center text-pink-500 mb-4">
              <Webhook size={24} />
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">Secure Webhooks</h3>
            <p className="text-sm text-gray-500 mb-4">
              Get real-time updates for payments, tickets, and event actions delivered to your endpoint.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs">Real-time</span>
              <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs">Secure</span>
              <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs">Reliable</span>
            </div>
          </div>
        </div>

        {/* Quick Start Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap size={20} className="text-pink-500" />
                <span className="text-sm font-semibold text-pink-500">Quick Start</span>
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">Get started in minutes</h3>
              <p className="text-gray-500">
                Create your developer account, get your API keys, and make your first API call.
              </p>
            </div>
            <a
              href="/docs/quickstart"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-pink-500 text-white font-semibold hover:bg-pink-600 transition-all duration-200 shadow-md shadow-pink-500/25 whitespace-nowrap"
            >
              Quick Start Guide
              <ArrowRight size={16} />
            </a>
          </div>
          <div className="mt-6 bg-gray-900 rounded-xl p-4">
            <code className="text-sm text-gray-300 font-mono">
              <span className="text-pink-400">curl -X POST</span> https://api.tickispot.com/v1/events \
              <br />&nbsp;&nbsp;-H "Authorization: Bearer YOUR_API_KEY" \
              <br />&nbsp;&nbsp;-d '{"title": "My Event", "category": "Tech"}'
            </code>
          </div>
        </div>

        {/* Security Note */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Shield size={16} className="text-green-500" />
          <span>Enterprise-grade security and compliance</span>
        </div>
      </div>
    </div>
  );
}