import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Features } from "@/components/blocks/features-10";
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

export default function FeaturesPage() {
  const headerRef = useRef(null);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.12,
      rootMargin: "0px 0px -40px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in");
        }
      });
    }, observerOptions);

    // Target the header element
    if (headerRef.current) {
      observer.observe(headerRef.current);
    }

    // Also target any features showcase cards
    const featureCards = document.querySelectorAll(".features-showcase-card");
    featureCards.forEach((el) => observer.observe(el));

    return () => {
      if (headerRef.current) {
        observer.unobserve(headerRef.current);
      }
      featureCards.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden font-geist">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-pink-50/30 to-purple-50/20" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]" />
      
      {/* Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-pink-500/20 rounded-full blur-[100px] opacity-30" />

      <div className="relative z-10 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        {/* Hero Section - Always visible, then animates in */}
        <div 
          ref={headerRef}
          className="mx-auto mb-12 max-w-3xl text-center md:mb-16 transition-all duration-700 ease-out opacity-0 translate-y-6"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-semibold mb-5">
            <Sparkles size={14} />
            Why choose TickiSpot
          </div>

          {/* Title */}
          <h1 className="flex flex-wrap items-center justify-center gap-3 text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight">
            <span className="inline-flex items-center px-5 py-2 rounded-full border-2 border-pink-300 bg-white/80 shadow-sm">
              Platform
            </span>
            <span className="inline-flex items-center px-5 py-2 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/30">
              features
            </span>
          </h1>
          
          {/* Main Description */}
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mt-6 leading-relaxed">
            TickiSpot gives you everything you need to create, manage, and scale events —
            from ticket sales to live streaming and real-time analytics.
          </p>
          
          {/* Secondary Text */}
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-500">
              Built for creators, organizers, and modern event businesses.
            </p>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Everything organizers need to sell tickets, run the door, and
              keep schedules on track—designed to match TickiSpot's workflow.
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <CheckCircle2 size={14} className="text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <CheckCircle2 size={14} className="text-green-500" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <CheckCircle2 size={14} className="text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>

        {/* Features Component Section */}
        <section className="rounded-3xl py-12 md:py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-3 sm:px-5">
            <Features />
          </div>
        </section>

        {/* CTA Section */}
        <div className="mx-auto mt-12 max-w-3xl text-center">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-8 shadow-xl">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-3">
              Ready to transform your events?
            </h2>
            <p className="text-white/80 text-sm mb-5 max-w-md mx-auto">
              Join thousands of organizers who use TickiSpot to create amazing experiences.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-pink-600 text-sm font-semibold shadow-lg transition-all duration-200 hover:bg-gray-100 hover:-translate-y-0.5"
            >
              Get started free
              <ArrowRight size={16} />
            </Link>
          </div>
          
          <p className="text-gray-500 mt-6 text-sm">
            <Link to="/" className="text-pink-500 hover:text-pink-600 transition-colors hover:underline inline-flex items-center gap-1">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .animate-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}</style>
    </div>
  );
}