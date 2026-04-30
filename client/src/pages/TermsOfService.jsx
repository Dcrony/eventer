import React from "react";

export default function TermsOfService() {
  return (
    <div className="page-container max-w-4xl">
      <h1 className="page-title">Terms of Service</h1>

      <p className="page-text">
        By accessing or using TickiSpot, you agree to these terms.
      </p>

      <div className="space-y-6 mt-6">
        <section>
          <h2 className="font-semibold text-lg">1. Use of Platform</h2>
          <p className="page-text">
            You agree to use TickiSpot responsibly and in compliance with all applicable laws.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-lg">2. Payments & Fees</h2>
          <p className="page-text">
            TickiSpot processes payments securely. Fees may apply depending on your plan.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-lg">3. Account Responsibility</h2>
          <p className="page-text">
            You are responsible for maintaining the security of your account and credentials.
          </p>
        </section>
      </div>

      <p className="text-sm text-muted-foreground mt-8">
        Last updated: {new Date().getFullYear()}
      </p>
    </div>
  );
}