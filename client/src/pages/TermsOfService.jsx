import React from "react";
import "./CSS/TermsOfService.css";

export default function TermsOfService() {
  const lastUpdated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="terms-container">
      <div className="terms-header">
        <h1>Terms of Service</h1>
        <p className="last-updated">Last updated: {lastUpdated}</p>
      </div>

      <div className="terms-intro">
        <p>
          Welcome to <strong>TickiSpot</strong>. By accessing or using our platform, you agree to be bound by these Terms of Service.
        </p>
      </div>

      <div className="terms-content">
        <section className="terms-section">
          <h2>1. Acceptance of Terms</h2>
          <div className="terms-text">
            <p>By using TickiSpot, you confirm that you have read, understood, and agree to these Terms of Service and our Privacy Policy.</p>
          </div>
        </section>

        <section className="terms-section">
          <h2>2. Use of the Platform</h2>
          <div className="terms-text">
            <p>You agree to use TickiSpot only for lawful purposes and in accordance with these terms. You must not use the platform to host illegal, fraudulent, or harmful events.</p>
          </div>
        </section>

        <section className="terms-section">
          <h2>3. Account Responsibility</h2>
          <div className="terms-text">
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
          </div>
        </section>

        <section className="terms-section">
          <h2>4. Payments and Fees</h2>
          <div className="terms-text">
            <p>All ticket sales are processed securely. TickiSpot charges a service fee on paid events. Organizers are responsible for accurate pricing and refunds where applicable.</p>
          </div>
        </section>

        <section className="terms-section">
          <h2>5. Content and Events</h2>
          <div className="terms-text">
            <p>You retain ownership of content you upload. However, you grant TickiSpot a license to display and promote your events on the platform.</p>
          </div>
        </section>

        <section className="terms-section">
          <h2>6. Termination</h2>
          <div className="terms-text">
            <p>We reserve the right to suspend or terminate accounts that violate these terms or engage in prohibited activities.</p>
          </div>
        </section>

        <section className="terms-section">
          <h2>7. Limitation of Liability</h2>
          <div className="terms-text">
            <p>TickiSpot is provided "as is". We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform.</p>
          </div>
        </section>

        <section className="terms-section">
          <h2>8. Changes to Terms</h2>
          <div className="terms-text">
            <p>We may update these terms from time to time. Continued use of TickiSpot after changes constitutes acceptance of the new terms.</p>
          </div>
        </section>
      </div>

      <div className="terms-footer">
        <p>© {new Date().getFullYear()} TickiSpot. All rights reserved.</p>
        <p>
          Questions? Contact us at <a href="mailto:support@tickispot.com">support@tickispot.com</a>
        </p>
      </div>
    </div>
  );
}