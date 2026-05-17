import { useState } from "react";
import { Send, Mail, User, MessageSquare, CheckCircle } from "lucide-react";

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 focus:bg-white transition-all";

export default function Contact() {
  const [form, setForm]         = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setForm({ name: "", email: "", message: "" });
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-pink-500 mb-2">Get in touch</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Contact <span className="text-pink-500">Us</span>
          </h1>
          <p className="text-sm text-slate-500">We'll get back to you within 24 hours.</p>
        </div>

        {/* Success banner */}
        {submitted && (
          <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-xl px-4 py-3 mb-5">
            <CheckCircle size={16} className="shrink-0" />
            Your message has been sent! We'll be in touch soon.
          </div>
        )}

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-pink-500 to-fuchsia-500" />

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">
                Name
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  name="name"
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className={`${inputCls} pl-10`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">
                Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className={`${inputCls} pl-10`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">
                Message
              </label>
              <div className="relative">
                <MessageSquare size={15} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                <textarea
                  name="message"
                  placeholder="How can we help you?"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className={`${inputCls} pl-10 resize-none`}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-pink-500 text-white text-sm font-bold shadow-md shadow-pink-200 hover:bg-pink-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-pink-200 transition-all"
            >
              <Send size={15} />
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}