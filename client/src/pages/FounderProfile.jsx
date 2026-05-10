import { Helmet } from "react-helmet-async";
// import "./CSS/founder.css";
import founderImg from "../assets/icon.svg";
import { Globe, Linkedin, Github } from "lucide-react";

const founder = {
  name: "Ibrahim Abdulmajeed",
  role: "Founder, TickiSpot",
  bio: "I build products at the intersection of events, community, and creator growth. My focus is creating systems that help organizers scale real-world experiences using technology.",
  portfolio: "https://dcrony.vercel.app",
  linkedin: "https://linkedin.com",
  github: "https://github.com",
};

const story = {
  title: "How TickiSpot started",
  content: `
TickiSpot started from a simple frustration — organizing events was messy.

From ticket sales to tracking attendees and handling payments, everything lived in different tools that didn’t talk to each other. As someone who worked closely with event communities and creators, I kept seeing the same problem: organizers were spending more time managing tools than actually building experiences.

The idea for TickiSpot came during a small campus event where managing attendance and ticket verification became chaotic. That moment made it clear — events needed one system, not five.

So I started building a platform that brings ticketing, event management, analytics, and audience engagement into one place. What began as a personal solution quickly turned into a product designed for organizers, creators, and communities who want to scale real-world experiences without friction.
`
};

export default function FounderProfile() {
  return (
    <div className="founder-page">
      <Helmet>
        <title>{`${founder.name} - Founder of TickiSpot`}</title>
        <meta
          name="description"
          content="Public founder profile for Ibrahim Abdulmajeed, founder of TickiSpot."
        />
      </Helmet>

      <div className="founder-container">
        <div className="founder-card">

          {/* Profile Section */}
          <div className="founder-header">
            <img
              src={founderImg}
              alt={founder.name}
              className="founder-avatar"
            />

            <div>
              <h1>{founder.name}</h1>
              <p className="founder-role">{founder.role}</p>
            </div>
          </div>

          {/* Bio */}
          <div className="founder-body">
            <h3>About</h3>
            <p>{founder.bio}</p>
          </div>{/* Founder Story */}
<div className="founder-story">
  <h3>{story.title}</h3>
  <p>{story.content}</p>
</div>


          {/* Links */}
          <div className="founder-links">
            <a href={founder.portfolio} target="_blank" rel="noreferrer">
              <Globe size={16} /> Portfolio
            </a>

            <a href={founder.linkedin} target="_blank" rel="noreferrer">
              <Linkedin size={16} /> LinkedIn
            </a>

            <a href={founder.github} target="_blank" rel="noreferrer">
              <Github size={16} /> GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}