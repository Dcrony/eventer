import { useEffect } from "react";
import { Link } from "react-router-dom";
import "./CSS/landing.css";
import { Features } from "@/components/blocks/features-10";

export default function FeaturesPage() {
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

    const elements = document.querySelectorAll(
      ".features-showcase-card, .features-page .section-header",
    );
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="features-page landing-page">
      <div className="grid-background" />

      <div className="relative z-[1] px-4 pb-20 pt-[5.5rem] sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-3xl text-center md:mb-14">
          <div className="section-header">
            <h1 className="section-title justify-center">
              <span className="title-box title-box-border">Platform</span>
              <span className="title-box title-box-filled">features</span>
            </h1>
            <p className="section-subtitle mx-auto mt-4 max-w-xl">
              Everything organizers need to sell tickets, run the door, and
              keep schedules on track—designed to match TickiSpot&apos;s
              workflow.
            </p>
          </div>
        </div>

        <section className="bg-zinc-50 py-12 md:py-20">
          <div className="mx-auto max-w-6xl px-2 sm:px-4">
            <Features />
          </div>
        </section>

        <div className="mx-auto mt-12 max-w-3xl text-center">
          <Link
            to="/register"
            className="inline-flex items-center justify-center rounded-full bg-pink-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-pink-700"
          >
            Get started free
          </Link>
          <p className="text-muted-foreground mt-4 text-sm">
            <Link to="/" className="text-pink-600 underline-offset-4 hover:underline">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
