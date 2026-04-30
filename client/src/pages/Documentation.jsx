import React from "react";

export default function Documentation() {
  return (
    <div className="page-container max-w-4xl">
      <h1 className="page-title">Developer Platform</h1>

      <p className="page-text">
        Build on top of <strong>TickiSpot</strong> with our APIs and developer tools.
        Integrate event creation, ticketing, payments, and livestreaming into your apps.
      </p>

      <div className="mt-6 space-y-4">
        <div className="border p-4 rounded-lg">
          <h3 className="font-semibold">⚡ REST API</h3>
          <p className="text-sm text-muted-foreground">
            Manage events, users, tickets, and payments programmatically.
          </p>
        </div>

        <div className="border p-4 rounded-lg">
          <h3 className="font-semibold">🧩 SDKs</h3>
          <p className="text-sm text-muted-foreground">
            Quickly integrate using JavaScript and upcoming mobile SDKs.
          </p>
        </div>

        <div className="border p-4 rounded-lg">
          <h3 className="font-semibold">🔐 Secure Webhooks</h3>
          <p className="text-sm text-muted-foreground">
            Get real-time updates for payments, tickets, and event actions.
          </p>
        </div>
      </div>

      <a
        href="/docs"
        className="inline-block mt-6 bg-black text-white px-6 py-3 rounded-lg"
        target="_blank"
        rel="noopener noreferrer"
      >
        View Full Documentation →
      </a>
    </div>
  );
}