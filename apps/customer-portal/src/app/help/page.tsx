"use client";

import { useState } from "react";
import {
  AlertCircle,
  AtSign,
  CheckCircle2,
  Loader2,
  MessageCircle,
  MinusCircle,
  Phone,
  PlusCircle,
} from "lucide-react";

// --------------------------------------------------
// Contact details
// --------------------------------------------------

const CONTACT_EMAIL = "xecoafrica@gmail.com";
const PHONE_LOCAL = "0184790476";
const PHONE_INTL = "254" + PHONE_LOCAL.slice(1); // international format, no "+" or leading zero
const PHONE_DISPLAY = "0184 790 476";
const TEL_LINK = `tel:+${PHONE_INTL}`;
const WHATSAPP_LINK = `https://wa.me/${PHONE_INTL}?text=${encodeURIComponent("Hello Taxflow, I need help with ")}`;

const INK = "#0B1B36";
const BLUE = "#2563EB";
const LINE = "#DDE2EA";

const FAQ = [
  {
    q: "Who can use Taxflow?",
    a: "Individuals and businesses with a valid KRA PIN. You choose Individual or Business when you verify your PIN during setup.",
  },
  {
    q: "Which returns can Taxflow file for me?",
    a: "Nil returns, Turnover Tax, PAYE, VAT, Income Tax, Rental Income, Withholding Tax and Corporation Tax. Each one is its own automation, so you only set up what applies to you.",
  },
  {
    q: "What do I need to get started?",
    a: "A valid KRA PIN registered for the obligation you want to automate, and an active Taxflow subscription that covers the service. We verify your PIN with iTax before anything is set up.",
  },
  {
    q: "What if my KRA PIN doesn't match the automation?",
    a: "We tell you which obligation the PIN is registered for and ask you to enter a PIN that matches the automation you chose. Nothing is filed until the PIN and obligation agree.",
  },
  {
    q: "How do I pay for an automation?",
    a: "The service fee is paid by M-Pesa STK Push when you activate an automation. Card payments are coming soon.",
  },
  {
    q: "Can I review returns before they are filed?",
    a: "Yes. You can review each return before it goes to KRA, or let it file automatically. Every workflow needs your authorization, and manual filing outside Taxflow is not supported.",
  },
  {
    q: "Where do I find my acknowledgement receipt?",
    a: "After a return is filed, download the acknowledgement receipt from the Documents page.",
  },
];

type FormState = { name: string; email: string; phone: string; message: string };
type Status = "idle" | "sending" | "sent" | "error";
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --------------------------------------------------
// Page
// --------------------------------------------------

export default function HelpSupportPage({
  onSubmit,
}: {
  // Optional: send the enquiry to your own API. Without it, the visitor's email app opens instead.
  onSubmit?: (data: FormState) => Promise<void>;
}) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({ name: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [viaEmailApp, setViaEmailApp] = useState(false);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate() {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = "Please enter your name";
    if (!EMAIL_FORMAT.test(form.email.trim())) e.email = "Enter a valid email address";
    if (form.message.trim().length < 10) e.message = "Add a little more detail so we can help";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    const clean = { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), message: form.message.trim() };

    if (onSubmit) {
      setStatus("sending");
      try {
        await onSubmit(clean);
        setViaEmailApp(false);
        setStatus("sent");
      } catch {
        setStatus("error");
      }
      return;
    }

    // No backend connected: hand the enquiry to the visitor's email app
    const body = [
      `Name: ${clean.name}`,
      `Email: ${clean.email}`,
      clean.phone ? `Phone / WhatsApp: ${clean.phone}` : null,
      "",
      clean.message,
    ].filter((l) => l !== null).join("\n");
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Taxflow enquiry from ${clean.name}`)}&body=${encodeURIComponent(body)}`;
    setViaEmailApp(true);
    setStatus("sent");
  }

  function reset() {
    setForm({ name: "", email: "", phone: "", message: "" });
    setErrors({});
    setStatus("idle");
  }

  const input =
    "w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0B1B36] focus:ring-1 focus:ring-[#0B1B36]";

  const channels = [
    { icon: Phone, title: "Call us", label: "Phone:", text: PHONE_DISPLAY, href: TEL_LINK, external: false },
    { icon: MessageCircle, title: "WhatsApp us", label: "WhatsApp:", text: PHONE_DISPLAY, href: WHATSAPP_LINK, external: true },
    { icon: AtSign, title: "Write us", label: "Email:", text: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}`, external: false },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-[34px]" style={{ color: INK }}>
        Help &amp; Support
      </h1>

      {/* ---------------- Contact panel ---------------- */}
      <section className="mt-8 grid gap-10 rounded-xl bg-[#F6F7F9] px-8 py-9 sm:grid-cols-3 sm:px-10">
        {channels.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.title} className="min-w-0">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100" style={{ color: BLUE }}>
                <Icon size={18} />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-slate-700">{c.title}</h2>
              <p className="mt-3 text-sm text-slate-700">{c.label}</p>
              <a
                href={c.href}
                {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="mt-1.5 inline-block break-all text-[15px] font-semibold tracking-wide hover:underline"
                style={{ color: BLUE }}
              >
                {c.text}
              </a>
            </div>
          );
        })}
      </section>

      {/* ---------------- Send us a message ---------------- */}
      <section className="mt-14 max-w-3xl">
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: INK }}>Send us a message</h2>
        <p className="mt-2 text-sm text-slate-600">
          Tell us a little about your practice or business and we&rsquo;ll get back to you.
        </p>

        <div className="mt-5 rounded-2xl bg-white p-6 sm:p-8" style={{ border: `1px solid ${LINE}` }}>
          {status === "sent" ? (
            <div className="py-10 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={28} />
              </span>
              <h3 className="mt-5 text-xl font-bold" style={{ color: INK }}>
                {viaEmailApp ? "Your email app should be opening" : "Message sent"}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
                {viaEmailApp ? (
                  <>
                    Press send there to reach us. If nothing opened, write to{" "}
                    <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold underline" style={{ color: BLUE }}>{CONTACT_EMAIL}</a>{" "}
                    or message us on WhatsApp.
                  </>
                ) : (
                  "Thanks for reaching out. We'll reply to the email address you gave us."
                )}
              </p>
              <button
                onClick={reset}
                className="mt-6 rounded-full px-5 py-2.5 text-sm font-semibold transition hover:bg-slate-50"
                style={{ border: `1px solid ${LINE}`, color: INK }}
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="h-name" className="mb-2 block text-sm font-semibold" style={{ color: INK }}>Name</label>
                  <input
                    id="h-name"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    aria-invalid={!!errors.name}
                    className={input}
                    style={{ borderColor: errors.name ? "#DC2626" : LINE }}
                  />
                  {errors.name && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="h-email" className="mb-2 block text-sm font-semibold" style={{ color: INK }}>Email</label>
                  <input
                    id="h-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    className={input}
                    style={{ borderColor: errors.email ? "#DC2626" : LINE }}
                  />
                  {errors.email && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="h-phone" className="mb-2 block text-sm font-semibold" style={{ color: INK }}>
                  Phone / WhatsApp <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  id="h-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+254 7XX XXX XXX"
                  autoComplete="tel"
                  className={input}
                  style={{ borderColor: LINE }}
                />
              </div>

              <div>
                <label htmlFor="h-message" className="mb-2 block text-sm font-semibold" style={{ color: INK }}>Message</label>
                <textarea
                  id="h-message"
                  rows={5}
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                  placeholder="Tell us about your filings: how many clients or staff, which returns, and what you use today."
                  aria-invalid={!!errors.message}
                  className={`${input} resize-y`}
                  style={{ borderColor: errors.message ? "#DC2626" : LINE }}
                />
                {errors.message && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.message}</p>}
              </div>

              {status === "error" && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>
                    We couldn&rsquo;t send that. Please try again, or email{" "}
                    <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold underline">{CONTACT_EMAIL}</a>.
                  </span>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: INK }}
                >
                  {status === "sending" ? (<><Loader2 size={16} className="animate-spin" /> Sending…</>) : "Send message"}
                </button>
                <p className="mt-4 text-xs text-slate-500">We use your details only to reply to this enquiry.</p>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* ---------------- FAQs ---------------- */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: INK }}>FAQs</h2>

        <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
          {FAQ.map((item, i) => {
            const isOpen = openFaq === i;
            const Icon = isOpen ? MinusCircle : PlusCircle;
            return (
              <div key={item.q}>
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 px-2 py-7 text-left transition hover:bg-slate-50 sm:px-8"
                >
                  <span className="text-[17px] font-medium text-slate-600">{item.q}</span>
                  <Icon size={26} strokeWidth={1.5} className="shrink-0 text-slate-400" />
                </button>
                {isOpen && (
                  <p className="max-w-3xl px-2 pb-7 text-[15px] leading-relaxed text-slate-600 sm:px-8">{item.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}