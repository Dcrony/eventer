import React from "react";
import { Link } from "react-router-dom";
import { Code2, Package, Webhook, ArrowRight, Shield, Zap, Server, Clock, Sparkles } from "lucide-react";

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
          {/* REST API Card - Available Now */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-pink-200/40">
            <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center text-pink-500 mb-4">
              <Server size={24} />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-extrabold text-gray-900">REST API</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[0.6rem] font-bold uppercase">
                Available
              </span>
            </div>
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

          {/* SDKs Card - Coming Soon */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-pink-200/40 relative overflow-hidden">
            {/* Coming Soon Overlay */}
            <div className="absolute top-0 right-0">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[0.6rem] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl flex items-center gap-1">
                <Clock size={10} />
                Coming Soon
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 mb-4">
              <Package size={24} />
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">SDKs & Libraries</h3>
            <p className="text-sm text-gray-500 mb-4">
              Quickly integrate using our JavaScript SDK and upcoming mobile SDKs for iOS and Android.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-mono">JavaScript</span>
              <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-mono opacity-50">React</span>
              <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-mono opacity-50">Node.js</span>
            </div>
          </div>

          {/* Webhooks Card - Available Now */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-pink-200/40">
            <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center text-pink-500 mb-4">
              <Webhook size={24} />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-extrabold text-gray-900">Secure Webhooks</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[0.6rem] font-bold uppercase">
                Available
              </span>
            </div>
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

        {/* Additional Coming Soon Features Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
              Coming Soon
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Exciting new features currently in development
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mobile SDKs */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-6 transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Mobile SDKs</h3>
                  <p className="text-xs text-gray-500">iOS & Android</p>
                </div>
                <div className="ml-auto">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[0.6rem] font-bold">
                    <Clock size={10} />
                    Q3 2026
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Native SDKs for iOS and Android to easily integrate ticketing and event management into your mobile apps.
              </p>
            </div>

            {/* GraphQL API */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-6 transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <Code2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">GraphQL API</h3>
                  <p className="text-xs text-gray-500">Flexible queries</p>
                </div>
                <div className="ml-auto">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[0.6rem] font-bold">
                    <Clock size={10} />
                    Q4 2026
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Flexible GraphQL API allowing you to query exactly the data you need with a single request.
              </p>
            </div>

            {/* WebSocket Events */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-6 transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">WebSocket Events</h3>
                  <p className="text-xs text-gray-500">Real-time streaming</p>
                </div>
                <div className="ml-auto">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[0.6rem] font-bold">
                    <Clock size={10} />
                    Q1 2027
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Real-time event streaming via WebSockets for live ticket sales, attendee updates, and more.
              </p>
            </div>

            {/* Webhook Simulator */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-6 transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600">
                  <Webhook size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Webhook Simulator</h3>
                  <p className="text-xs text-gray-500">Testing tool</p>
                </div>
                <div className="ml-auto">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[0.6rem] font-bold">
                    <Clock size={10} />
                    Q2 2026
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Test and debug your webhook endpoints with our built-in simulator before going live.
              </p>
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
          
          {/* Code Block */}
          <div className="mt-6 bg-gray-900 rounded-xl p-4 overflow-x-auto">
            <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
              {`curl -X POST https://api.tickispot.com/v1/events
  -H "Authorization: Bearer YOUR_API_KEY"
  -d '{"title": "My Event", "category": "Tech"}'`}
            </pre>
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