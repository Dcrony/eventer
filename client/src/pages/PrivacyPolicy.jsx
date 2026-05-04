import React from "react";
import "./CSS/PrivacyPolicy.css";

export default function PrivacyPolicy() {
  const lastUpdated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="privacy-container">
      <div className="privacy-header">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last updated: {lastUpdated}</p>
      </div>

      <div className="privacy-content">
        <p className="intro-text">
          At <strong>TickiSpot</strong>, we value your trust and are committed to protecting your personal information 
          with transparency and care.
        </p>

        <section className="privacy-section">
          <h2>1. Information We Collect</h2>
          <div className="privacy-text">
            <p>We collect the following types of information:</p>
            <ul>
              <li><strong>Account Information:</strong> Name, email, phone number, password, and profile details.</li>
              <li><strong>Event Data:</strong> Events you create, tickets sold, attendee information.</li>
              <li><strong>Payment Information:</strong> Processed securely through our payment partners.</li>
              <li><strong>Usage Data:</strong> How you interact with the platform, device information, and analytics.</li>
            </ul>
          </div>
        </section>

        <section className="privacy-section">
          <h2>2. How We Use Your Information</h2>
          <div className="privacy-text">
            <p>We use your data to:</p>
            <ul>
              <li>Provide and improve our services</li>
              <li>Process ticket sales and payouts</li>
              <li>Enable live streaming and audience engagement</li>
              <li>Send important updates and notifications</li>
              <li>Ensure platform security and prevent fraud</li>
              <li>Personalize your experience</li>
            </ul>
          </div>
        </section>

        <section className="privacy-section">
          <h2>3. Data Sharing</h2>
          <div className="privacy-text">
            <p>We do not sell your personal data. We may share information with:</p>
            <ul>
              <li>Payment processors and banking partners</li>
              <li>Event attendees (limited to necessary details)</li>
              <li>Legal authorities when required by law</li>
            </ul>
          </div>
        </section>

        <section className="privacy-section">
          <h2>4. Data Security</h2>
          <div className="privacy-text">
            <p>We use industry-standard encryption, secure servers, and regular security audits to protect your information. However, no system is 100% secure.</p>
          </div>
        </section>

        <section className="privacy-section">
          <h2>5. Your Rights</h2>
          <div className="privacy-text">
            <p>You have the right to:</p>
            <ul>
              <li>Access, correct, or delete your personal data</li>
              <li>Object to certain processing activities</li>
              <li>Withdraw consent where applicable</li>
              <li>Export your data</li>
            </ul>
            <p>You can exercise these rights from your <strong>Account Settings</strong>.</p>
          </div>
        </section>

        <section className="privacy-section">
          <h2>6. Contact Us</h2>
          <div className="privacy-text">
            <p>If you have any questions about this Privacy Policy, please contact us at:</p>
            <p><strong>support@tickispot.com</strong></p>
          </div>
        </section>
      </div>

      <div className="privacy-footer">
        <p>© {new Date().getFullYear()} TickiSpot. All rights reserved.</p>
      </div>
    </div>
  );
}