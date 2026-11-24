"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Check,
  CreditCard,
  Download,
  Info,
  RefreshCw,
  Smartphone,
  X,
} from "lucide-react";

// --------------------------------------------------
// Sample data (illustrative only, not real TaxFlow prices)
// --------------------------------------------------

const BASE_PRICE = 500;
const RENEWAL_DATE = "20 December 2026";

type ServiceStatus = "active" | "available" | "expired";

const services: {
  id: string;
  name: string;
  description: string;
  price: number;
  status: ServiceStatus;
  detail: string;
}[] = [
  {
    id: "nil",
    name: "Nil Returns",
    description: "Automated monthly filing for taxpayers with no income to declare.",
    price: 200,
    status: "active",
    detail: "Renews 20 Dec 2026 · 1 workflow using this service",
  },
  {
    id: "tot",
    name: "Turnover Tax",
    description: "Filing assistance for eligible taxpayers with small business turnover.",
    price: 300,
    status: "available",
    detail: "Not subscribed",
  },
  {
    id: "paye",
    name: "PAYE",
    description: "Payroll tax filing automation for employers.",
    price: 400,
    status: "expired",
    detail: "Expired 05 Nov 2026 · 1 workflow paused",
  },
  {
    id: "vat",
    name: "VAT",
    description: "VAT return preparation and submission automation.",
    price: 600,
    status: "available",
    detail: "Not subscribed",
  },
  {
    id: "itr",
    name: "Income Tax",
    description: "Annual Individual Income Tax return filing.",
    price: 250,
    status: "available",
    detail: "Not subscribed",
  },
  {
    id: "mri",
    name: "Rental Income",
    description: "Monthly Rental Income tax filing for your properties.",
    price: 250,
    status: "available",
    detail: "Not subscribed",
  },
  {
    id: "wht",
    name: "Withholding Tax",
    description: "Compute and file Withholding Tax on supplier payments.",
    price: 350,
    status: "available",
    detail: "Not subscribed",
  },
  {
    id: "cit",
    name: "Corporation Tax",
    description: "Corporation Tax instalment management for companies.",
    price: 700,
    status: "available",
    detail: "Not subscribed",
  },
];

// Data removed for Payment History only
const payments: any[] = [];

const statusStyles: Record<ServiceStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-50 text-emerald-700" },
  available: { label: "Available", className: "bg-slate-100 text-slate-600" },
  expired: { label: "Expired", className: "bg-amber-100 text-amber-700" },
};

const money = (n: number) => `KSh ${n.toLocaleString("en-KE")}`;

// --------------------------------------------------
// Page
// --------------------------------------------------

export default function MySubscriptionPage() {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [defaultMethod, setDefaultMethod] = useState("mpesa");

  const activeServices = services.filter((s) => s.status === "active");
  const serviceTotal = activeServices.reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="space-y-8">
      {/* Intro */}
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          My Subscription
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage your TaxFlow plan, services and payments.
        </p>
      </section>

      {/* 1. Overview */}
      <section
        className="rounded-2xl p-6 text-white shadow-sm sm:p-8"
        style={{ backgroundImage: "linear-gradient(to bottom right, #4A3426, #2B1D15)" }}
      >
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <p className="text-sm text-[#D9C7B3]">Current subscription</p>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                  cancelled ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {cancelled ? "Cancels on 20 Dec 2026" : "Active"}
              </span>
            </div>

            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">TaxFlow Individual</h2>

            <div className="mt-6 grid grid-cols-2 gap-5 border-t border-white/15 pt-5 sm:grid-cols-4">
              <Detail label="Base price" value={`${money(BASE_PRICE)} / month`} />
              <Detail label={cancelled ? "Access ends" : "Next renewal"} value={RENEWAL_DATE} />
              <Detail label="Billing cycle" value="Monthly" />
              <Detail label="Payment method" value="M-Pesa" />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() =>
                  document
                    .getElementById("manage-subscription")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition hover:opacity-90"
                style={{ backgroundColor: "#F3EBDD", color: "#3B2A20" }}
              >
                Manage subscription
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Hybrid charge breakdown (Mock data removed for services here) */}
          <div className="rounded-xl bg-white/10 p-5">
            <p className="text-sm font-semibold">Your next charge</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-[#E8DAC8]">
                <dt>Base subscription</dt>
                <dd>{money(BASE_PRICE)}</dd>
              </div>
              <div className="flex justify-between border-t border-white/15 pt-3 font-semibold">
                <dt>Total on 20 Dec</dt>
                <dd>{cancelled ? money(0) : money(BASE_PRICE)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* 2. Services */}
      <section>
        <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Services</h2>
            <p className="mt-1 text-sm text-slate-500">
              Add the services you need on top of your base subscription.
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-slate-600">
          <Info size={18} className="mt-0.5 shrink-0 text-blue-700" />
          <p>
            A service gives you <strong className="font-semibold text-slate-800">access</strong> to
            a type of filing. A <strong className="font-semibold text-slate-800">workflow</strong> is
            the automation you set up using that access. Subscribing to a service does not create a
            workflow, and a workflow only runs while its service is active.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {services.map((s) => {
            const style = statusStyles[s.status];
            return (
              <div
                key={s.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-slate-900">{s.name}</h3>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${style.className}`}
                  >
                    {style.label}
                  </span>
                </div>

                <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.description}</p>

                <p className="mt-4 text-xl font-bold text-slate-900">
                  {money(s.price)}
                  <span className="text-sm font-medium text-slate-400"> / month</span>
                </p>
                <p className="mt-1 text-xs text-slate-400">{s.detail}</p>

                <div className="mt-5">
                  {s.status === "active" && (
                    <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                      Manage
                    </button>
                  )}
                  {s.status === "available" && (
                    <button className="rounded-lg bg-[#0B1B36] px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                      Subscribe
                    </button>
                  )}
                  {s.status === "expired" && (
                    <button className="inline-flex items-center gap-2 rounded-lg bg-[#0B1B36] px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                      <RefreshCw size={15} />
                      Renew
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Billing history (Mock data removed) */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-bold text-slate-900">Payment history</h2>
          <p className="mt-1 text-xs text-slate-400">
            Every charge on your account, with a receipt for each.
          </p>
        </div>

        {payments.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No payment history found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium">Reference</th>
                  <th className="px-5 py-3 font-medium">Method</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.ref} className="transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">{p.date}</td>
                    <td className="px-5 py-4 font-medium text-slate-800">{p.description}</td>
                    <td className="px-5 py-4 text-slate-500">{p.ref}</td>
                    <td className="px-5 py-4 text-slate-500">{p.method}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-slate-800">
                      {money(p.amount)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        className="inline-flex items-center gap-1.5 rounded-lg p-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                        aria-label={`Download receipt ${p.ref}`}
                      >
                        <Download size={15} />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 4. Payment methods + 5. Management */}
      <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        {/* Payment methods */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-900">Payment methods</h2>
          <p className="mt-1 text-xs text-slate-400">
            Your default method is used for renewals.
          </p>

          <div className="mt-5 space-y-3">
            <MethodRow
              icon={Smartphone}
              name="M-Pesa"
              detail="+254 7•• ••• 123"
              isDefault={defaultMethod === "mpesa"}
              onMakeDefault={() => setDefaultMethod("mpesa")}
              actionLabel="Change number"
            />
            <MethodRow
              icon={CreditCard}
              name="Card"
              detail="Visa and Mastercard"
              comingSoon
            />
          </div>
        </div>

        {/* Subscription management */}
        <div
          id="manage-subscription"
          className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="font-bold text-slate-900">Manage subscription</h2>
          <p className="mt-1 text-xs text-slate-400">
            Cancel at any time. You keep access until the end of your billing period.
          </p>

          <div className="mt-5 divide-y divide-slate-100">
            <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {cancelled ? "Subscription cancelled" : "Cancel subscription"}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {cancelled
                    ? "You keep full access until 20 Dec 2026. You can resume before then."
                    : "You keep access until the end of your billing period."}
                </p>
              </div>
              {cancelled ? (
                <button
                  onClick={() => setCancelled(false)}
                  className="shrink-0 rounded-lg bg-[#0B1B36] px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Resume subscription
                </button>
              ) : (
                <button
                  onClick={() => setCancelOpen(true)}
                  className="shrink-0 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Cancel subscription
                </button>
              )}
            </div>
          </div>

          <div className="mt-2 rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <CalendarClock size={17} className="text-slate-500" />
              If a subscription or service expires
            </div>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600">
              <li>Workflows that use the expired service pause. Nothing is deleted.</li>
              <li>Scheduled filings for that service stop until you renew.</li>
              <li>Your documents and submission history stay available.</li>
              <li>Renew at any time and your workflows resume.</li>
            </ul>
          </div>
        </div>
      </section>

      <p className="text-center text-xs text-slate-400">
        Prices and details shown are examples, not final TaxFlow pricing.
      </p>

      {/* Cancel dialog */}
      {cancelOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
                  <AlertTriangle size={20} />
                </div>
                <h3 id="cancel-title" className="text-lg font-bold text-slate-900">
                  Cancel your subscription?
                </h3>
              </div>
              <button
                onClick={() => setCancelOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-4 text-sm text-slate-600">Here is what will happen:</p>
            <ul className="mt-3 space-y-3 text-sm text-slate-600">
              <CancelPoint>
                You keep full access until <strong className="text-slate-800">20 Dec 2026</strong>.
                You won't be charged again.
              </CancelPoint>
              <CancelPoint>
                Your active workflow (Nil Returns) will pause after that date.
              </CancelPoint>
              <CancelPoint>
                Filings scheduled after 20 Dec 2026 will not be submitted. We'll remind you 7 days
                before.
              </CancelPoint>
              <CancelPoint>
                Your documents and submission history stay available.
              </CancelPoint>
              <CancelPoint>Resubscribe any time and your workflows resume.</CancelPoint>
            </ul>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setCancelOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Keep subscription
              </button>
              <button
                onClick={() => {
                  setCancelled(true);
                  setCancelOpen(false);
                }}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Cancel subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------
// Small components
// --------------------------------------------------

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#D9C7B3]">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function MethodRow({
  icon: Icon,
  name,
  detail,
  isDefault,
  onMakeDefault,
  actionLabel,
  comingSoon,
}: {
  icon: React.ElementType;
  name: string;
  detail: string;
  isDefault?: boolean;
  onMakeDefault?: () => void;
  actionLabel?: string;
  comingSoon?: boolean;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-xl border p-4 ${
        isDefault ? "border-blue-200 bg-blue-50/40" : "border-slate-100"
      } ${comingSoon ? "opacity-70" : ""}`}
    >
      <div className="rounded-lg bg-blue-50 p-2.5 text-blue-700">
        <Icon size={19} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">{name}</p>
        <p className="mt-0.5 text-xs text-slate-400">{detail}</p>
      </div>

      {comingSoon ? (
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
          Coming soon
        </span>
      ) : isDefault ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-[11px] font-semibold text-blue-800">
          <Check size={12} />
          Default
        </span>
      ) : (
        <button
          onClick={onMakeDefault}
          className="text-xs font-semibold text-blue-700 hover:underline"
        >
          Make default
        </button>
      )}

      {actionLabel && (
        <button className="text-xs font-semibold text-slate-500 hover:text-slate-800">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function CancelPoint({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <Check size={16} className="mt-0.5 shrink-0 text-slate-400" />
      <span>{children}</span>
    </li>
  );
}