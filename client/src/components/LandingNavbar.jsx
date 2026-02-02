import { Link } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { ThemeContext } from "../contexts/ThemeContexts";
import { TicketCheck, ToggleLeft, ToggleRight } from "lucide-react";
import "./css/LandingNavbar.css";

export default function LandingNavbar() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const { darkMode, toggleTheme } = useContext(ThemeContext);

    useEffect(() => {
        const token = localStorage.getItem("token");
        setIsLoggedIn(!!token);
    }, []);

    return (
        <header className="landing-header ">
            <div className="header-content">
                <Link to="/" className="logo">
                    <TicketCheck size={24} className="logo-icon" />
                    <h1>TickiSpot</h1>
                </Link>
                <nav className="nav-menu">
                    <Link to="/events" className="nav-link">
                        Events
                    </Link>
                    <Link to="/pricing" className="nav-link">
                        Pricing
                    </Link>
                    <Link to="/about" className="nav-link">
                        About
                    </Link>
                    <Link to="/contact" className="nav-link">
                        Contact
                    </Link>
                    {isLoggedIn ? (
                        <Link to="/dashboard" className="btn btn-primary">
                            Dashboard
                        </Link>
                    ) : (
                        <div className="log">
                            <Link to="/login" className="btn btn-text">
                                Sign In
                            </Link>
                            <Link to="/register" className="btn btn-primary">
                                Get Started
                            </Link>
                        </div>
                    )}
                    <button
                        onClick={toggleTheme}
                        className="theme-toggle-btn"
                        aria-label="Toggle theme"
                    >
                        {darkMode ? (
                            <ToggleLeft size={18} className="toggle-icon" />
                        ) : (
                            <ToggleRight size={18} className="toggle-icon" />
                        )}
                    </button>
                </nav>
            </div>
        </header>
    );
}
