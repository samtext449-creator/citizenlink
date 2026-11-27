"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Info,
  Loader2,
  RefreshCw,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";

// --------------------------------------------------
// Data (mock data removed; "-" is shown until real data exists)
// --------------------------------------------------

type Service = {
  id: string;
  name: string;
  description: string;
  price: number | null; // null = coming soon (shown as "-")
};

const services: Service[] = [
  { id: "nil", name: "Nil Returns", description: "Automated monthly filing for taxpayers with no income to declare.", price: 200 },
  { id: "tot", name: "Turnover Tax", description: "Filing assistance for eligible taxpayers with small business turnover.", price: null },
  { id: "paye", name: "PAYE", description: "Payroll tax filing automation for employers.", price: null },
  { id: "vat", name: "VAT", description: "VAT return preparation and submission automation.", price: null },
  { id: "itr", name: "Income Tax", description: "Annual Individual Income Tax return filing.", price: null },
  { id: "mri", name: "Rental Income", description: "Monthly Rental Income tax filing for your properties.", price: null },
  { id: "wht", name: "Withholding Tax", description: "Compute and file Withholding Tax on supplier payments.", price: null },
  { id: "cit", name: "Corporation Tax", description: "Corporation Tax instalment management for companies.", price: null },
];

type PaymentMethod = { id: string; type: "mpesa"; number: string }; // number = 9 digits, no country code
type Subscriptions = Record<string, { renewsOn: string }>;

const money = (n: number) => `KSh ${n.toLocaleString("en-KE")}`;
const maskPhone = (d: string) => `+254 ${d[0]}•• ••• ${d.slice(-3)}`;
const fmtDate = (d: Date, month: "short" | "long") =>
  d.toLocaleDateString("en-GB", { day: "numeric", month, year: "numeric" });

// Accepts 0712345678, 712345678, +254712345678 or 254712345678
function normalizeKePhone(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("254")) d = d.slice(3);
  else if (d.startsWith("0")) d = d.slice(1);
  return /^[17]\d{8}$/.test(d) ? d : null;
}

// --------------------------------------------------
// Page
// --------------------------------------------------

export default function MySubscriptionPage() {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);
  const [payService, setPayService] = useState<Service | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [defaultId, setDefaultId] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscriptions>({});
  const [payments, setPayments] = useState<any[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const defaultMethod = methods.find((m) => m.id === defaultId) ?? null;
  const subscribed = services.filter((s) => subscriptions[s.id]);
  const hasSub = subscribed.length > 0;
  const nextRenewal = hasSub ? subscriptions[subscribed[0].id].renewsOn : "-";
  const nextTotal = subscribed.reduce((sum, s) => sum + (s.price ?? 0), 0);

  function addMethod(number: string, makeDefault: boolean) {
    const id = `m${Date.now()}`;
    setMethods((prev) => [...prev, { id, type: "mpesa", number }]);
    if (makeDefault || methods.length === 0) setDefaultId(id);
    setNotice(`M-Pesa ${maskPhone(number)} added.`);
  }

  function removeMethod(id: string) {
    const rest = methods.filter((m) => m.id !== id);
    setMethods(rest);
    if (id === defaultId) setDefaultId(rest[0]?.id ?? null);
  }

  function completePayment(service: Service, number: string, saveNumber: boolean) {
    const now = new Date();
    const renews = new Date(now);
    renews.setFullYear(now.getFullYear() + 1);

    if (saveNumber && !methods.some((m) => m.number === number)) {
      const id = `m${Date.now()}`;
      setMethods((prev) => [...prev, { id, type: "mpesa", number }]);
      if (methods.length === 0) setDefaultId(id);
    }

    setSubscriptions((prev) => ({ ...prev, [service.id]: { renewsOn: fmtDate(renews, "long") } }));
    setPayments((prev) => [
      {
        ref: `TF${Date.now().toString().slice(-8)}`,
        date: fmtDate(now, "short"),
        description: `${service.name} subscription`,
        method: `M-Pesa ${maskPhone(number)}`,
        amount: service.price,
        status: "Paid",
      },
      ...prev,
    ]);
    setCancelled(false);
    setPayService(null);
    setNotice(`${service.name} subscription is now active.`);
  }

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

      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            {notice}
          </span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      )}

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
                  !hasSub
                    ? "bg-white/15 text-[#E8DAC8]"
                    : cancelled
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {!hasSub ? "Not subscribed" : cancelled ? "Cancels at end of billing period" : "Active"}
              </span>
            </div>

            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">TaxFlow Individual</h2>

            <div className="mt-6 grid grid-cols-2 gap-5 border-t border-white/15 pt-5 sm:grid-cols-3">
              <Detail label={cancelled ? "Access ends" : "Next renewal"} value={nextRenewal} />
              <Detail label="Billing cycle" value={hasSub ? "Yearly" : "-"} />
              <Detail
                label="Payment method"
                value={defaultMethod ? `M-Pesa · •••${defaultMethod.number.slice(-3)}` : "-"}
              />
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
              <button
                onClick={() => setRenewOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                <RefreshCw size={15} />
                Renew / Upgrade subscription
              </button>
            </div>
          </div>

          {/* Next charge */}
          <div className="rounded-xl bg-white/10 p-5">
            <p className="text-sm font-semibold">Your next charge</p>
            <dl className="mt-4 space-y-2 text-sm">
              {subscribed.map((s) => (
                <div key={s.id} className="flex justify-between text-[#E8DAC8]">
                  <dt>{s.name}</dt>
                  <dd>{money(s.price ?? 0)}</dd>
                </div>
              ))}
              <div
                className={`flex justify-between font-semibold ${hasSub ? "border-t border-white/15 pt-3" : ""}`}
              >
                <dt>Total due</dt>
                <dd>{hasSub ? (cancelled ? money(0) : money(nextTotal)) : "-"}</dd>
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
              Subscribe to the services you need for your filings.
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
            const comingSoon = s.price == null;
            const sub = subscriptions[s.id];
            return (
              <div
                key={s.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-slate-900">{s.name}</h3>
                  {sub && (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                      Active
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.description}</p>

                <p className="mt-4 text-xl font-bold text-slate-900">
                  {comingSoon ? (
                    "-"
                  ) : (
                    <>
                      {money(s.price as number)}
                      <span className="text-sm font-medium text-slate-400"> / year</span>
                    </>
                  )}
                </p>
                {sub && <p className="mt-1 text-xs text-slate-400">Renews {sub.renewsOn}</p>}

                <div className="mt-5">
                  {comingSoon ? (
                    <button
                      disabled
                      className="cursor-not-allowed rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400"
                    >
                      Coming soon
                    </button>
                  ) : sub ? (
                    <button
                      onClick={() =>
                        document
                          .getElementById("manage-subscription")
                          ?.scrollIntoView({ behavior: "smooth", block: "start" })
                      }
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Manage
                    </button>
                  ) : (
                    <button
                      onClick={() => setPayService(s)}
                      className="rounded-lg bg-[#0B1B36] px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Subscribe
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Billing history */}
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

          {methods.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
              No payment methods added yet.
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {methods.map((m) => (
                <MethodRow
                  key={m.id}
                  name="M-Pesa"
                  detail={maskPhone(m.number)}
                  isDefault={m.id === defaultId}
                  onMakeDefault={() => setDefaultId(m.id)}
                  onRemove={() => removeMethod(m.id)}
                />
              ))}
            </ul>
          )}

          <AddMethodForm
            existing={methods.map((m) => m.number)}
            hasMethods={methods.length > 0}
            onAdd={addMethod}
          />
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
                  {!hasSub
                    ? "You don't have an active subscription yet."
                    : cancelled
                    ? "You keep full access until the end of your billing period. You can resume before then."
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
                  disabled={!hasSub}
                  className="shrink-0 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
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

      {/* Renew / Upgrade modal */}
      {renewOpen && (
        <RenewModal
          onClose={() => setRenewOpen(false)}
          onContinue={(s) => {
            setRenewOpen(false);
            setPayService(s);
          }}
        />
      )}

      {/* Payment modal */}
      {payService && (
        <PayModal
          service={payService}
          methods={methods}
          defaultId={defaultId}
          onClose={() => setPayService(null)}
          onSuccess={completePayment}
        />
      )}

      {/* Cancel dialog */}
      {cancelOpen && (
        <Modal onClose={() => setCancelOpen(false)} labelledBy="cancel-title">
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
              You keep full access until the end of your billing period. You won't be charged again.
            </CancelPoint>
            <CancelPoint>Your active workflows will pause after that date.</CancelPoint>
            <CancelPoint>
              Filings scheduled after that date will not be submitted. We'll remind you 7 days
              before.
            </CancelPoint>
            <CancelPoint>Your documents and submission history stay available.</CancelPoint>
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
        </Modal>
      )}
    </div>
  );
}

// --------------------------------------------------
// Payment modal (choose method, pay, subscribe)
// --------------------------------------------------

function PayModal({
  service,
  methods,
  defaultId,
  onClose,
  onSuccess,
}: {
  service: Service;
  methods: PaymentMethod[];
  defaultId: string | null;
  onClose: () => void;
  onSuccess: (service: Service, number: string, saveNumber: boolean) => void;
}) {
  const [choice, setChoice] = useState<string>(defaultId ?? "new");
  const [phone, setPhone] = useState("");
  const [save, setSave] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"form" | "processing" | "success">("form");

  const price = service.price as number;
  const busy = phase !== "form";

  function pay() {
    let number: string;
    let isNew = false;

    if (choice === "new") {
      const n = normalizeKePhone(phone);
      if (!n) {
        setError("Enter a valid Safaricom number, e.g. 0712 345 678.");
        return;
      }
      number = n;
      isNew = true;
    } else {
      number = methods.find((m) => m.id === choice)!.number;
    }

    setError(null);
    setPhase("processing");
    // Simulated STK push: replace with your real M-Pesa request
    setTimeout(() => {
      setPhase("success");
      setTimeout(() => onSuccess(service, number, isNew && save), 1500);
    }, 2000);
  }

  return (
    <Modal onClose={busy ? () => {} : onClose} labelledBy="pay-title">
      {phase === "success" ? (
        <div className="space-y-3 py-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={28} />
          </div>
          <h3 id="pay-title" className="text-lg font-bold text-slate-900">
            Payment successful
          </h3>
          <p className="text-sm text-slate-500">Your {service.name} subscription is now active.</p>
        </div>
      ) : (
        <>
          <ModalHeader
            id="pay-title"
            title={`Subscribe to ${service.name}`}
            subtitle="Choose how you want to pay."
            onClose={busy ? () => {} : onClose}
          />

          <div className="mt-5 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Service</span>
              <span className="font-semibold text-slate-800">{service.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Billing</span>
              <span className="font-semibold text-slate-800">Yearly</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="font-semibold text-slate-600">Total due today</span>
              <span className="text-base font-bold text-slate-900">{money(price)}</span>
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-slate-700">Pay with</p>
            <div className="space-y-2">
              {methods.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${
                    choice === m.id ? "border-[#0B1B36] bg-slate-50" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="pay-method"
                    checked={choice === m.id}
                    onChange={() => {
                      setChoice(m.id);
                      setError(null);
                    }}
                    disabled={busy}
                  />
                  <Smartphone size={18} className="text-emerald-700" />
                  <span className="flex-1 text-sm font-semibold text-slate-800">
                    M-Pesa <span className="font-normal text-slate-500">{maskPhone(m.number)}</span>
                  </span>
                  {m.id === defaultId && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                      Default
                    </span>
                  )}
                </label>
              ))}

              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${
                  choice === "new" ? "border-[#0B1B36] bg-slate-50" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="pay-method"
                  checked={choice === "new"}
                  onChange={() => {
                    setChoice("new");
                    setError(null);
                  }}
                  disabled={busy}
                />
                <Smartphone size={18} className="text-emerald-700" />
                <span className="text-sm font-semibold text-slate-800">
                  {methods.length > 0 ? "Use a different M-Pesa number" : "M-Pesa"}
                </span>
              </label>
            </div>

            {choice === "new" && (
              <div className="mt-3">
                <div className="flex overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-[#0B1B36] focus-within:ring-1 focus-within:ring-[#0B1B36]">
                  <span className="flex items-center border-r border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-600">
                    +254
                  </span>
                  <input
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && !busy && pay()}
                    inputMode="tel"
                    placeholder="712 345 678"
                    disabled={busy}
                    aria-label="M-Pesa phone number"
                    className="min-w-0 flex-1 px-4 py-3 text-sm text-slate-800 outline-none"
                  />
                </div>
                <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={save}
                    onChange={(e) => setSave(e.target.checked)}
                    disabled={busy}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Save this number for renewals
                </label>
              </div>
            )}

            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          </div>

          {phase === "processing" && (
            <p className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-800">
              Check your phone and enter your M-Pesa PIN to complete the payment.
            </p>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={onClose}
              disabled={busy}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={pay}
              disabled={busy || (choice === "new" && !phone.trim())}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {phase === "processing" ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Waiting for M-Pesa…
                </>
              ) : (
                <>Pay {money(price)}</>
              )}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

// --------------------------------------------------
// Payment method form (dropdown, then add)
// --------------------------------------------------

function AddMethodForm({
  existing,
  hasMethods,
  onAdd,
}: {
  existing: string[];
  hasMethods: boolean;
  onAdd: (number: string, makeDefault: boolean) => void;
}) {
  const [type, setType] = useState("");
  const [phone, setPhone] = useState("");
  const [makeDefault, setMakeDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const n = normalizeKePhone(phone);
    if (!n) {
      setError("Enter a valid Safaricom number, e.g. 0712 345 678.");
      return;
    }
    if (existing.includes(n)) {
      setError("This number is already saved.");
      return;
    }
    onAdd(n, makeDefault);
    setPhone("");
    setMakeDefault(false);
    setType("");
    setError(null);
  }

  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <label htmlFor="method-type" className="mb-2 block text-sm font-semibold text-slate-700">
        Add a payment method
      </label>
      <div className="relative">
        <select
          id="method-type"
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setError(null);
          }}
          className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 pr-10 text-sm text-slate-800 outline-none focus:border-[#0B1B36] focus:ring-1 focus:ring-[#0B1B36]"
        >
          <option value="" disabled>
            Choose a payment method
          </option>
          <option value="mpesa">M-Pesa</option>
          <option value="card" disabled>
            Credit / debit card (Coming soon)
          </option>
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>

      {type === "mpesa" && (
        <div className="mt-4">
          <label htmlFor="mpesa-phone" className="mb-2 block text-sm font-semibold text-slate-700">
            M-Pesa phone number
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-[#0B1B36] focus-within:ring-1 focus-within:ring-[#0B1B36]">
              <span className="flex items-center border-r border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-600">
                +254
              </span>
              <input
                id="mpesa-phone"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                inputMode="tel"
                placeholder="712 345 678"
                className="min-w-0 flex-1 px-4 py-3 text-sm text-slate-800 outline-none"
              />
            </div>
            <button
              onClick={submit}
              disabled={!phone.trim()}
              className="rounded-xl bg-[#0B1B36] px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add
            </button>
          </div>
          {error ? (
            <p className="mt-2 text-xs text-red-600">{error}</p>
          ) : (
            <p className="mt-2 text-xs text-slate-400">The Safaricom number registered for M-Pesa.</p>
          )}

          {hasMethods && (
            <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={makeDefault}
                onChange={(e) => setMakeDefault(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Set as default payment method
            </label>
          )}
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------
// Modals
// --------------------------------------------------

function Modal({
  children,
  onClose,
  labelledBy,
}: {
  children: React.ReactNode;
  onClose: () => void;
  labelledBy: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ id, title, subtitle, onClose }: { id: string; title: string; subtitle?: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 id={id} className="text-lg font-bold text-slate-900">
          {title}
        </h3>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      <button
        onClick={onClose}
        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
        aria-label="Close"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function RenewModal({
  onClose,
  onContinue,
}: {
  onClose: () => void;
  onContinue: (service: Service) => void;
}) {
  const [serviceId, setServiceId] = useState("");
  const selected = services.find((s) => s.id === serviceId);
  const hasPrice = selected?.price != null;

  const priceText = !selected
    ? ""
    : hasPrice
    ? `${money(selected.price as number)} / year`
    : "-";

  return (
    <Modal onClose={onClose} labelledBy="renew-title">
      <ModalHeader
        id="renew-title"
        title="Renew / Upgrade subscription"
        subtitle="Choose a service to renew or add to your plan."
        onClose={onClose}
      />

      <div className="mt-6 space-y-5">
        <div>
          <label htmlFor="renew-service" className="mb-2 block text-sm font-semibold text-slate-700">
            Service
          </label>
          <div className="relative">
            <select
              id="renew-service"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 pr-10 text-sm text-slate-800 outline-none focus:border-[#0B1B36] focus:ring-1 focus:ring-[#0B1B36]"
            >
              <option value="" disabled>
                Select a service
              </option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.price == null ? " (Coming soon)" : ""}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>

        <div>
          <label htmlFor="renew-price" className="mb-2 block text-sm font-semibold text-slate-700">
            Price
          </label>
          <input
            id="renew-price"
            readOnly
            value={priceText}
            placeholder="Select a service to see the price"
            className="w-full cursor-default rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400"
          />
          {selected && !hasPrice && (
            <p className="mt-2 text-xs text-amber-700">
              This service is coming soon and can't be purchased yet.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={() => selected && hasPrice && onContinue(selected)}
          disabled={!selected || !hasPrice}
          className="rounded-lg bg-[#0B1B36] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue to payment
        </button>
      </div>
    </Modal>
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
  name,
  detail,
  isDefault,
  onMakeDefault,
  onRemove,
}: {
  name: string;
  detail: string;
  isDefault: boolean;
  onMakeDefault: () => void;
  onRemove: () => void;
}) {
  return (
    <li
      className={`flex items-center gap-3 rounded-xl border p-4 transition ${
        isDefault ? "border-slate-300 bg-slate-50" : "border-slate-200 bg-white"
      }`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
        <Smartphone size={19} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">{name}</p>
        <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
      </div>

      {isDefault ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
          <Check size={12} />
          Default
        </span>
      ) : (
        <button
          onClick={onMakeDefault}
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          Make default
        </button>
      )}

      <button
        onClick={onRemove}
        aria-label={`Remove ${name} ${detail}`}
        title="Remove"
        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 size={16} />
      </button>
    </li>
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