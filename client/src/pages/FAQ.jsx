import React, { useState } from "react";
import "./CSS/FAQ.css";

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
    <div className="faq-container">
      <div className="faq-header">
        <h1>Frequently Asked Questions</h1>
        <p>Find quick answers to common questions about TickiSpot</p>
      </div>

      <div className="faq-search">
        <input
          type="text"
          placeholder="Search FAQs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="faq-search-input"
        />
      </div>

      <div className="faq-list">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, index) => (
            <div 
              key={index} 
              className={`faq-item ${openIndex === index ? 'active' : ''}`}
              onClick={() => toggleFAQ(index)}
            >
              <div className="faq-question">
                <h3>{faq.question}</h3>
                <span className="faq-icon">{openIndex === index ? '−' : '+'}</span>
              </div>
              <div className={`faq-answer ${openIndex === index ? 'show' : ''}`}>
                <p>{faq.answer}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="no-results">No matching questions found. Try different keywords.</p>
        )}
      </div>

      <div className="faq-cta">
        <h2>Still have questions?</h2>
        <p>Our support team is ready to help you.</p>
        <div className="faq-cta-buttons">
          <a href="/contact" className="btn-primary">Contact Support</a>
          <a href="https://wa.me/2349056911562" target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}