import { Link } from "react-router-dom";
import { TicketCheck } from "lucide-react";
import "./css/Footer.css";

export default function Footer() {
    return (
        <footer className="landing-footer">
            <div className="footer-wrapper">
                <div className="footer-content">
                    <div className="footer-section footer-brand">
                        <div className="footer-logo">
                            <TicketCheck size={24} />
                            <h3>TickiSpot</h3>
                        </div>
                        <p>Your complete event management solution. Create, manage, and grow your events with confidence.</p>
                    </div>
                    <div className="footer-section">
                        <h4>Product</h4>
                        <Link to="/events">Browse Events</Link>
                        <Link to="/create">Create Event</Link>
                        <Link to="/pricing">Pricing</Link>
                        <Link to="/docs">Documentation</Link>
                    </div>
                    <div className="footer-section">
                        <h4>Support</h4>
                        <Link to="/help">Help Center</Link>
                        <Link to="/contact">Contact Us</Link>
                        <Link to="/about">About Us</Link>
                    </div>
                    <div className="footer-section">
                        <h4>Legal</h4>
                        <Link to="/privacy">Privacy Policy</Link>
                        <Link to="/terms">Terms of Service</Link>
                        <Link to="/donate">Donate</Link>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2024 TickiSpot. All rights reserved.</p>
                    <div className="footer-links">
                        <Link to="/privacy">Privacy</Link>
                        <Link to="/terms">Terms</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
