import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className="page-container max-w-4xl">
      <h1 className="page-title">Privacy Policy</h1>

      <p className="page-text">
        Your data matters. At <strong>TickiSpot</strong>, we are committed to
        protecting your personal information and being transparent about how we use it.
      </p>

      <div className="space-y-6 mt-6">
        <section>
          <h2 className="font-semibold text-lg">1. Information We Collect</h2>
          <p className="page-text">
            We collect information you provide directly (like account details, event data, and payments)
            and data generated from your use of the platform (analytics, device info, logs).
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-lg">2. How We Use Your Data</h2>
          <p className="page-text">
            We use your data to operate TickiSpot, process transactions, improve features,
            personalize your experience, and ensure platform security.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-lg">3. Data Protection</h2>
          <p className="page-text">
            We implement industry-standard security measures to protect your data from unauthorized access.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-lg">4. Your Rights</h2>
          <p className="page-text">
            You can access, update, or delete your data anytime from your account settings.
          </p>
        </section>
      </div>

      <p className="text-sm text-muted-foreground mt-8">
        Last updated: {new Date().getFullYear()}
      </p>
    </div>
  );
}