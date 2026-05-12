import { Helmet } from "react-helmet-async";
import founderImg from "../assets/icon.svg";
import { Globe, Linkedin, Github, Sparkles, Heart, Quote } from "lucide-react";

const founder = {
  name: "Ibrahim Abdulmajeed",
  role: "Founder, TickiSpot",
  bio: "I build products at the intersection of events, community, and creator growth. My focus is creating systems that help organizers scale real-world experiences using technology.",
  portfolio: "https://dcrony.vercel.app",
  linkedin: "https://linkedin.com/in/ibrahimabdulmajeed",
  github: "https://github.com/ibrahimabdulmajeed",
};

const story = {
  title: "How TickiSpot started",
  content: `TickiSpot started from a simple frustration — organizing events was messy.

From ticket sales to tracking attendees and handling payments, everything lived in different tools that didn't talk to each other. As someone who worked closely with event communities and creators, I kept seeing the same problem: organizers were spending more time managing tools than actually building experiences.

The idea for TickiSpot came during a small campus event where managing attendance and ticket verification became chaotic. That moment made it clear — events needed one system, not five.

So I started building a platform that brings ticketing, event management, analytics, and audience engagement into one place. What began as a personal solution quickly turned into a product designed for organizers, creators, and communities who want to scale real-world experiences without friction.`
};

export default function FounderProfile() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/20 font-geist pt-8 lg:pl-[var(--sidebar-width,0px)] pb-16">
      <Helmet>
        <title>{`${founder.name} - Founder of TickiSpot`}</title>
        <meta name="description" content="Public founder profile for Ibrahim Abdulmajeed, founder of TickiSpot." />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Founder Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          {/* Header with gradient */}
          <div className="h-32 bg-gradient-to-r from-pink-500 to-purple-600" />

          {/* Profile Section */}
          <div className="relative px-6 pb-6">
            <div className="flex flex-col items-center text-center -mt-16">
              <img
                src={founderImg}
                alt={founder.name}
                className="w-28 h-28 rounded-full border-4 border-white shadow-lg bg-white object-cover"
              />
              <h1 className="text-2xl font-extrabold text-gray-900 mt-3">{founder.name}</h1>
              <p className="text-pink-500 font-semibold mt-0.5">{founder.role}</p>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 my-5" />

            {/* Bio */}
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-pink-500" /> About
              </h3>
              <p className="text-gray-600 leading-relaxed">{founder.bio}</p>
            </div>

            {/* Story */}
            <div className="mb-5 p-5 rounded-xl bg-pink-50/50 border border-pink-100">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <Quote size={16} className="text-pink-500" /> {story.title}
              </h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">{story.content}</p>
            </div>

            {/* Mission Statement */}
            <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100">
              <div className="flex items-center gap-2 mb-2">
                <Heart size={16} className="text-pink-500" />
                <h3 className="text-sm font-semibold text-gray-900">Mission</h3>
              </div>
              <p className="text-sm text-gray-700">
                To empower creators and organizers with technology that makes event management seamless, 
                so they can focus on what matters most — building memorable experiences.
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <a
                href={founder.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-semibold transition-all duration-200 hover:bg-gray-800"
              >
                <Globe size={16} /> Portfolio
              </a>
              <a
                href={founder.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold transition-all duration-200 hover:bg-blue-700"
              >
                <Linkedin size={16} /> LinkedIn
              </a>
              <a
                href={founder.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800 text-white text-sm font-semibold transition-all duration-200 hover:bg-gray-900"
              >
                <Github size={16} /> GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}