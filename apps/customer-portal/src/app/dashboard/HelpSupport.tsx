"use client";

import { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Clock,
  FileText,
  LifeBuoy,
  Mail,
  MessageCircle,
  Phone,
  Search,
  Send,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

// --------------------------------------------------
// Data
// --------------------------------------------------

const categories = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Account setup, linking KRA, first workflow",
    icon: BookOpen,
    color: "bg-blue-50 text-blue-700",
  },
  {
    id: "workflows",
    title: "Workflows",
    description: "Creating, scheduling and managing automations",
    icon: FileText,
    color: "bg-indigo-50 text-indigo-700",
  },
  {
    id: "submissions",
    title: "Submissions & Filings",
    description: "Tracking status, errors and acknowledgements",
    icon: CheckCircle2,
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    id: "billing",
    title: "Billing & Subscription",
    description: "Plans, invoices, upgrades and cancellations",
    icon: LifeBuoy,
    color: "bg-violet-50 text-violet-700",
  },
];

const faqs = [
  {
    question: "How do I link my KRA iTax account?",
    answer:
      "Go to Linked Accounts → Add Account. Enter your KRA PIN and the credentials you use on iTax. We only use these to submit filings on your behalf and never store your password in plain text.",
  },
  {
    question: "Why is my workflow showing as Pending?",
    answer:
      "A workflow stays in Pending until the next scheduled run date, or until required documents (e.g. sales records) are uploaded. Check the workflow details for any missing requirements.",
  },
  {
    question: "Can I file for more than one KRA PIN?",
    answer:
      "Yes. Professional and higher plans support multiple linked accounts. Switch between them using the account switcher in the top bar, or manage them under Linked Accounts.",
  },
  {
    question: "How do I download acknowledgement receipts?",
    answer:
      "After a successful filing, the acknowledgement appears automatically under Documents. You can also find it under My Submissions by opening the completed submission.",
  },
  {
    question: "What happens if a filing fails?",
    answer:
      "You will receive a notification and the submission status will show Action Required. Open the submission for the exact error message from KRA and recommended next steps.",
  },
  {
    question: "How do I cancel or change my subscription?",
    answer:
      "Go to My Subscription. From there you can upgrade, downgrade or cancel. Changes take effect at the end of the current billing period unless otherwise stated.",
  },
];

// --------------------------------------------------
// Component
// --------------------------------------------------

export default function HelpSupportPage() {
  const [query, setQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [form, setForm] = useState({
    subject: "",
    category: "general",
    message: "",
  });
  const [sent, setSent] = useState(false);

  const filteredFaqs = faqs.filter(
    (f) =>
      !query.trim() ||
      f.question.toLowerCase().includes(query.toLowerCase()) ||
      f.answer.toLowerCase().includes(query.toLowerCase())
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Hook up to your support ticket API here
    setSent(true);
    setForm({ subject: "", category: "general", message: "" });
    setTimeout(() => setSent(false), 5000);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <section className="text-center sm:text-left">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          <CircleHelp size={14} />
          Help Centre
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          How can we help you?
        </h1>
        <p className="mt-2 max-w-xl text-sm text-slate-500">
          Search our knowledge base or get in touch with the Taxflow support
          team.
        </p>

        {/* Search */}
        <div className="relative mx-auto mt-6 max-w-xl sm:mx-0">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for help articles, FAQs..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm shadow-sm outline-none transition focus:border-[#0B1B36] focus:ring-2 focus:ring-[#0B1B36]/10"
          />
        </div>
      </section>

      {/* Categories */}
      <section>
        <h2 className="mb-4 text-sm font-semibold text-slate-700">
          Browse by topic
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                className="flex flex-col items-start rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className={`rounded-xl p-2.5 ${cat.color}`}>
                  <Icon size={20} />
                </div>
                <p className="mt-3 font-semibold text-slate-800">{cat.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {cat.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Two-column: FAQ + Contact */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* FAQ */}
        <section className="lg:col-span-3">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold text-slate-900">
                Frequently asked questions
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Quick answers to common questions
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredFaqs.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-slate-500">
                  No results for “{query}”. Try a different search term.
                </div>
              ) : (
                filteredFaqs.map((faq, index) => {
                  const isOpen = openFaq === index;
                  return (
                    <div key={index}>
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : index)}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
                      >
                        <span className="text-sm font-medium text-slate-800">
                          {faq.question}
                        </span>
                        {isOpen ? (
                          <ChevronUp
                            size={18}
                            className="shrink-0 text-slate-400"
                          />
                        ) : (
                          <ChevronDown
                            size={18}
                            className="shrink-0 text-slate-400"
                          />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 text-sm leading-relaxed text-slate-600">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* Contact & Support options */}
        <section className="space-y-4 lg:col-span-2">
          {/* Contact cards */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-slate-900">Contact support</h3>
            <p className="mt-1 text-xs text-slate-400">
              We typically respond within a few hours
            </p>

            <div className="mt-5 space-y-3">
              <a
                href="mailto:support@taxflow.co.ke"
                className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-blue-200 hover:bg-blue-50/50"
              >
                <div className="rounded-lg bg-blue-50 p-2.5 text-blue-700">
                  <Mail size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">Email</p>
                  <p className="text-xs text-slate-500">support@taxflow.co.ke</p>
                </div>
              </a>

              <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-700">
                  <MessageCircle size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    Live chat
                  </p>
                  <p className="text-xs text-slate-500">
                    Available Mon–Fri, 8am–6pm
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                <div className="rounded-lg bg-violet-50 p-2.5 text-violet-700">
                  <Phone size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">Phone</p>
                  <p className="text-xs text-slate-500">+254 700 000 000</p>
                </div>
              </div>
            </div>
          </div>

          {/* Response time */}
          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="rounded-lg bg-amber-50 p-2.5 text-amber-700">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Average response time
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Under 4 hours on business days
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Contact form */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900">
            Still need help?
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Send us a message and we’ll get back to you as soon as possible.
          </p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="rounded-full bg-emerald-50 p-4 text-emerald-600">
              <CheckCircle2 size={28} />
            </div>
            <p className="mt-4 font-semibold text-slate-800">
              Message sent successfully
            </p>
            <p className="mt-1 text-sm text-slate-500">
              We’ll reply to your email shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-800">
                Subject
                <input
                  required
                  value={form.subject}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, subject: e.target.value }))
                  }
                  placeholder="Brief description of your issue"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal outline-none focus:border-[#0B1B36]"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-800">
                Category
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-normal outline-none focus:border-[#0B1B36]"
                >
                  <option value="general">General enquiry</option>
                  <option value="workflows">Workflows</option>
                  <option value="submissions">Submissions & filings</option>
                  <option value="billing">Billing & subscription</option>
                  <option value="account">Account & security</option>
                  <option value="bug">Bug report</option>
                </select>
              </label>
            </div>

            <label className="block text-sm font-semibold text-slate-800">
              Message
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) =>
                  setForm((f) => ({ ...f, message: e.target.value }))
                }
                placeholder="Please include as much detail as possible so we can help you faster..."
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-normal outline-none focus:border-[#0B1B36]"
              />
            </label>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0B1B36] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Send size={16} />
                Send message
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Extra links */}
      <section className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
        <a
          href="#"
          className="inline-flex items-center gap-1.5 hover:text-[#0B1B36]"
        >
          System status
          <ExternalLink size={13} />
        </a>
        <span className="text-slate-300">·</span>
        <a
          href="#"
          className="inline-flex items-center gap-1.5 hover:text-[#0B1B36]"
        >
          API documentation
          <ExternalLink size={13} />
        </a>
        <span className="text-slate-300">·</span>
        <a
          href="#"
          className="inline-flex items-center gap-1.5 hover:text-[#0B1B36]"
        >
          Terms of service
          <ExternalLink size={13} />
        </a>
      </section>
    </div>
  );
}