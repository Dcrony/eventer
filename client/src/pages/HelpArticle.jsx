import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ARTICLES = {
  "create-events": {
    title: "Create & Manage Events",
    body: [
      "Open your dashboard and select Create Event.",
      "Add title, schedule, location, cover image, and ticket tiers.",
      "Submit for review if required; published events appear on the public feed.",
      "Edit or cancel from the dashboard before sales start when possible.",
    ],
  },
  payments: {
    title: "Payments, Payouts & Refunds",
    body: [
      "Ticket sales are collected via Paystack and credited to your organizer balance.",
      "Connect a payout account under Earnings, then request withdrawals.",
      "Refunds are handled from the event tickets view for eligible sales.",
    ],
  },
  "live-streaming": {
    title: "Live Streaming Setup",
    body: [
      "Pro plans can enable live streaming on an event.",
      "Choose YouTube, Facebook, a custom URL, or in-browser camera streaming.",
      "Toggle live status when you are ready for attendees to join.",
    ],
  },
  analytics: {
    title: "Analytics & Insights",
    body: [
      "View per-event analytics from the event dashboard.",
      "Platform analytics summarizes performance across your events (Pro).",
      "Track views, sales, and engagement over time.",
    ],
  },
  account: {
    title: "Account & Profile",
    body: [
      "Update profile, privacy, and notification preferences in Settings.",
      "Verify your email to unlock purchases and organizer tools.",
      "Use security settings to log out of all devices if needed.",
    ],
  },
  troubleshooting: {
    title: "Troubleshooting",
    body: [
      "Payment pending: wait a few minutes and check My Tickets.",
      "QR not scanning: ensure brightness and a valid ticket reference.",
      "Contact support via the Help Center if issues persist.",
    ],
  },
};

export default function HelpArticle() {
  const { slug } = useParams();
  const article = ARTICLES[slug];

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12 lg:pl-[var(--sidebar-width,0px)]">
        <p className="text-center text-gray-600">Article not found.</p>
        <p className="mt-4 text-center">
          <Link to="/help" className="font-semibold text-pink-500">
            Back to Help Center
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-geist pt-8 lg:pl-[var(--sidebar-width,0px)] pb-16">
      <article className="mx-auto max-w-2xl px-4 sm:px-6">
        <Link
          to="/help"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-pink-500 hover:text-pink-600"
        >
          <ArrowLeft size={16} />
          Help Center
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-900">{article.title}</h1>
        <ul className="mt-6 space-y-4 text-gray-600">
          {article.body.map((paragraph) => (
            <li key={paragraph} className="leading-relaxed">
              {paragraph}
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}
