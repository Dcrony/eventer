import React, { useState } from "react";
import { Search, ChevronDown, ChevronUp, MessageCircle, Headphones, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const faqs = [
    {
      question: "How do I create my first event on TickiSpot?",
      answer: "Go to your dashboard, click 'Create Event', fill in the details, set ticket prices, and publish. The event will go live instantly or you can schedule it."
    },
    {
      question: "How do I get paid from ticket sales?",
      answer: "Payouts are processed automatically to your connected bank account or Stripe. You can withdraw funds once they are settled (usually within 3-7 business days)."
    },
    {
      question: "Can I host live streaming events?",
      answer: "Yes! TickiSpot supports high-quality live streaming. Just enable live streaming when creating your event and connect your preferred streaming source."
    },
    {
      question: "What payment methods do you support?",
      answer: "We support bank transfers, card payments, and popular mobile money options across Nigeria and other African countries."
    },
    {
      question: "How do I refund a ticket buyer?",
      answer: "You can issue refunds directly from your organizer dashboard. Refunds are processed back to the original payment method."
    },
    {
      question: "Is TickiSpot free to use?",
      answer: "Yes, creating events is free. We only charge a small service fee on paid tickets, which is deducted from sales."
    },
    {
      question: "Can I make my event private?",
      answer: "Absolutely. You can set your event to Private so only people with the link can see and buy tickets."
    },
    {
      question: "How do I add co-organizers or team members?",
      answer: "Go to your event settings and invite team members by email. You can assign different roles and permissions."
    },
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-full w-full bg-gray-50 font-geist ">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100 text-pink-600 text-xs font-semibold mb-3">
            <Headphones size={14} />
            Help Center
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 mb-3">
            Got questions? We've got answers
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Everything you need to know about using TickiSpot for your events
          </p>

          {/* Search Bar */}
          <div className="relative max-w-lg mx-auto mt-8">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-full border-2 border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        {/* FAQ List */}
        {filteredFaqs.length > 0 ? (
          <div className="space-y-3 mb-12">
            {filteredFaqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-200 hover:border-pink-200"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                >
                  <h3 className="text-base font-bold text-gray-900">{faq.question}</h3>
                  <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${openIndex === index ? "bg-pink-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                    {openIndex === index ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </button>
                <div className={`overflow-hidden ${openIndex === index ? "max-h-96" : "max-h-0"}`}>
                  <div className="p-5 pt-0 border-t border-gray-100">
                    <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 mb-12">
            <Search size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No matching questions found</h3>
            <p className="text-gray-500">Try different keywords or browse all FAQs above.</p>
          </div>
        )}

        {/* Still Need Help Section */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-extrabold mb-2">Still have questions?</h2>
          <p className="text-white/90 mb-6">Our support team is ready to help you.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-pink-600 font-semibold transition-all duration-200 hover:bg-gray-100 hover:-translate-y-0.5 shadow-md"
            >
              Contact Support
            </Link>
            <a
              href="https://wa.me/2349056911562"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-500 text-white font-semibold transition-all duration-200 hover:bg-green-600 hover:-translate-y-0.5 shadow-md"
            >
              <MessageCircle size={18} />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}