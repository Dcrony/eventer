import React from "react";
import { Link } from "react-router-dom";
import "./CSS/AboutUs.css";
import { useCreateEvent } from "../context/CreateEventContext";

export default function AboutUs() {
  const { openCreateEvent } = useCreateEvent();

  return (
    <div className="about-container">
      <div className="about-header">
        <h1>About TickiSpot</h1>
        <p className="tagline">Empowering African creators to host unforgettable events</p>
      </div>

      <div className="about-content">
        <section className="about-section">
          <h2>Our Mission</h2>
          <p>
            At <strong>TickiSpot</strong>, we believe everyone should have the power to create meaningful experiences. 
            We built a simple, reliable, and powerful platform that helps organizers focus on what matters most — 
            delivering amazing events — while we handle the rest.
          </p>
        </section>

        <section className="about-section">
          <h2>Our Story</h2>
          <p>
            Born in Nigeria, TickiSpot was founded by event lovers who were frustrated with the complexity 
            and high costs of existing ticketing tools. We started with one goal: to make event management 
            seamless for African organizers — from small community gatherings to large festivals and conferences.
          </p>
        </section>

        <section className="about-section">
          <h2>What We Offer</h2>
          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">🎟️</span>
              <h3>Smart Ticketing</h3>
              <p>Easy ticket creation, secure payments, and instant payouts.</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📡</span>
              <h3>Live Streaming</h3>
              <p>High-quality virtual events with real-time audience engagement.</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <h3>Powerful Analytics</h3>
              <p>Track sales, attendance, and audience insights in real-time.</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🌍</span>
              <h3>Built for Africa</h3>
              <p>Local payment options, multilingual support, and regional focus.</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>Our Values</h2>
          <ul className="values-list">
            <li><strong>Simplicity</strong> — Beautiful tools that are easy to use.</li>
            <li><strong>Reliability</strong> — Events that never fail.</li>
            <li><strong>Transparency</strong> — Fair fees and clear reporting.</li>
            <li><strong>Community First</strong> — Built by Africans, for Africans.</li>
          </ul>
        </section>
      </div>

      <div className="about-cta">
        <h3>Ready to host your next event?</h3>
        <button onClick={openCreateEvent} className="btn-create">
          Create Your First Event
        </button>
      </div>
      

      <footer className="about-footer">
        <Link to="/">← Back to Homepage</Link>
      </footer>
    </div>
  );
}