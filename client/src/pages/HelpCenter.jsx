import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./CSS/HelpCenter.css";

export default function HelpCenter() {
  const [searchTerm, setSearchTerm] = useState("");

  const helpTopics = [
    { 
      icon: "🎟️", 
      title: "Create & Manage Events", 
      desc: "Step-by-step guide to creating, editing, and publishing events." 
    },
    { 
      icon: "💳", 
      title: "Payments, Payouts & Refunds", 
      desc: "How to receive payments and withdraw your earnings." 
    },
    { 
      icon: "📡", 
      title: "Live Streaming Setup", 
      desc: "Set up reliable live events for your audience." 
    },
    { 
      icon: "📊", 
      title: "Analytics & Insights", 
      desc: "Understand your event performance and audience data." 
    },
    { 
      icon: "👤", 
      title: "Account & Profile", 
      desc: "Manage your account, privacy, and security settings." 
    },
    { 
      icon: "🔧", 
      title: "Troubleshooting", 
      desc: "Fix common issues with ticketing and streaming." 
    },
  ];

  const filteredTopics = helpTopics.filter(topic =>
    topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="help-container">
      <div className="help-header">
        <h1 className="help-title">How can we help you?</h1>
        <p className="help-subtitle">
          Everything you need to host successful events on TickiSpot
        </p>
      </div>

      {/* Search Bar */}
      <div className="help-search-container">
        <input
          type="text"
          placeholder="Search help articles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="help-search-input"
        />
      </div>

      {/* Topics Grid */}
      <div className="help-topics-grid">
        {filteredTopics.map((topic, index) => (
          <div key={index} className="help-card">
            <div className="help-card-icon">{topic.icon}</div>
            <h3 className="help-card-title">{topic.title}</h3>
            <p className="help-card-desc">{topic.desc}</p>
            <Link to={`/help/${topic.title.toLowerCase().replace(/\s+/g, '-')}`} className="help-card-link">
              Read more →
            </Link>
          </div>
        ))}
      </div>

      {/* Still Need Help Section */}
      <div className="help-cta-section">
        <div className="help-cta-card">
          <h2>Still need help?</h2>
          <p>Our support team is ready to assist you personally.</p>
          
          <div className="help-cta-buttons">
            <Link to="/contact" className="btn-primary">
              ✉️ Contact Support
            </Link>
            
            <a 
              href="https://wa.me/2349056911562" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-whatsapp"
            >
              💬 Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}