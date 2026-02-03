import React from "react";
import LandingNavbar from "../components/LandingNavbar";
import Footer from "../components/Footer";

export default function Donation() {
  return (
    <div className="landing-page">
      <LandingNavbar />

      <div
        className="page-container "
        style={{
          paddingTop: "120px",
          paddingBottom: "80px",
          maxWidth: "1200px",
          margin: "0 auto",
          paddingLeft: "20px",
          paddingRight: "20px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div className="section-header animate-in">
          <h1 className="section-title">
            <span className="title-box title-box-border">Support</span>
            <span className="title-box title-box-filled">Our Mission</span>
          </h1>
          <p className="section-subtitle">
             TickiSpot is built to empower event creators. Your support helps us
          improve, innovate, and keep the platform accessible to everyone.
          </p>
        </div>
       
        <button className="btn btn-primary">Donate Now</button>
      </div>
      <Footer />
    </div>
  );
}
