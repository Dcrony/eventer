import React, { useState } from "react";
import LandingNavbar from "../components/LandingNavbar";
import Footer from "../components/Footer";
import "./CSS/landing.css";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("✅ Your message has been sent!");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="landing-page">
      <div className="grid-background"></div>
      <LandingNavbar />

      <div style={{ paddingTop: "120px", paddingBottom: "60px", maxWidth: "800px", margin: "0 auto", paddingLeft: "20px", paddingRight: "20px", position: "relative", zIndex: 1 }}>
        <div className="section-header animate-in" style={{ marginBottom: "40px" }}>
          <h1 className="section-title" style={{ gap: "20px" }}>
            <span className="title-box title-box-border">Contact</span>
            <span className="title-box title-box-filled">Us</span>
          </h1>
        </div>
        <div className="feature-card animate-in" style={{ maxWidth: "600px", margin: "0 auto" }}>
          <form onSubmit={handleSubmit} className="contact-form" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Name</label>
              <input
                name="name"
                placeholder="Your Name"
                value={form.name}
                onChange={handleChange}
                required
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "16px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Email</label>
              <input
                name="email"
                type="email"
                placeholder="Your Email"
                value={form.email}
                onChange={handleChange}
                required
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "16px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Message</label>
              <textarea
                name="message"
                placeholder="Your Message"
                value={form.message}
                onChange={handleChange}
                required
                rows={5}
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "16px", resize: "vertical" }}
              ></textarea>
            </div>
            <button type="submit" className="btn btn-primary btn-large" style={{ width: "100%", justifyContent: "center" }}>
              Send Message
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
