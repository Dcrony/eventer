import React from "react";
import "./CSS/HelpCenter.css";
import { Link } from "react-router-dom";

export default function HelpCenter() {
  const helpTopics = [
    { icon: "🎟", title: "Create & manage events" },
    { icon: "💳", title: "Payments, payouts & refunds" },
    { icon: "👤", title: "Account & profile settings" },
    { icon: "📡", title: "Live streaming setup" },
    { icon: "🛠", title: "Fix common issues" },
    { icon: "📈", title: "Analytics & insights" },
  ];

  return (
    <div className="page-container max-w-5xl">
      <h1 className="page-title">Help Center</h1>

      <p className="page-text text-center max-w-2xl mx-auto">
        Everything you need to run successful events on TickiSpot.
        Browse guides, fix issues, and learn best practices.
      </p>

      {/* Search */}
      <div className="mt-6">
        <input
          type="text"
          placeholder="Search for help..."
          className="w-full rounded-lg border px-4 py-3"
        />
      </div>

      {/* Topics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
        {helpTopics.map((topic, index) => (
          <div
            key={index}
            className="p-4 rounded-xl border hover:shadow transition cursor-pointer"
          >
            <span className="text-xl">{topic.icon}</span>
            <h3 className="font-semibold mt-2">{topic.title}</h3>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center mt-12">
        <p className="text-muted-foreground">
          Still need help?
        </p>
        <Link
          to="/contact"
          className="inline-block mt-3 bg-pink-600 text-white px-6 py-3 rounded-full"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}