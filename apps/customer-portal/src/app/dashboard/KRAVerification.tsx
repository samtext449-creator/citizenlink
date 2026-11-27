"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";

// --------------------------------------------------
// KRA Verification: list of KRA services
// Available services open a small form. "Soon" services are locked.
// --------------------------------------------------
type Badge = "FREE" | "NEW" | "SOON";

type FieldConfig = {
  name: string;
  label: string;
  placeholder?: string;
  type?: "text" | "select";
  options?: string[];
  maxLength?: number;
  pattern?: RegExp;
  error?: string;
};

type Service = {
  id: string;
  title: string;
  description: string;
  badge: Badge;
  card: string; // card colours when available
  fields?: FieldConfig[];
};

const PIN_FIELD: FieldConfig = {
  name: "pin",
  label: "KRA PIN",
  placeholder: "A123456789B",
  maxLength: 11,
  pattern: /^[AP]\d{9}[A-Z]$/,
  error: "Enter a valid KRA PIN. Example: A123456789B",
};

const SERVICES: Service[] = [
  {
    id: "find-pin",
    title: "Find My KRA PIN",
    description: "Retrieve your KRA PIN instantly",
    badge: "FREE",
    card: "border-sky-200 bg-sky-50 hover:border-sky-300",
    fields: [
      {
        name: "idNumber",
        label: "National ID number",
        placeholder: "e.g. 12345678",
        maxLength: 9,
        pattern: /^\d{6,9}$/,
        error: "Enter a valid National ID number (6 to 9 digits).",
      },
    ],
  },
  {
    id: "verify-pin",
    title: "Verify KRA PIN",
    description: "Confirm a KRA PIN is valid",
    badge: "NEW",
    card: "border-violet-200 bg-violet-50 hover:border-violet-300",
    fields: [PIN_FIELD],
  },
  {
    id: "obligations",
    title: "Check My Obligations",
    description: "View all your active tax obligations",
    badge: "NEW",
    card: "border-emerald-200 bg-emerald-50 hover:border-emerald-300",
    fields: [PIN_FIELD],
  },
  {
    id: "verify-certificate",
    title: "Verify KRA Certificates and Licenses",
    description: "Verify Fake TCC and eTIMS Invoice",
    badge: "NEW",
    card: "border-rose-200 bg-rose-50 hover:border-rose-300",
    fields: [
      {
        name: "documentType",
        label: "Document type",
        type: "select",
        options: ["Tax Compliance Certificate (TCC)", "eTIMS Invoice"],
      },
      {
        name: "documentNumber",
        label: "Certificate or invoice number",
        placeholder: "Enter the number on the document",
        maxLength: 40,
        pattern: /^[A-Za-z0-9\-\/]{4,40}$/,
        error: "Enter a valid document number.",
      },
    ],
  },
  {
    id: "exemption",
    title: "Tax Exemption Status",
    description: "Check if you are exempted from Income Tax",
    badge: "NEW",
    card: "border-yellow-200 bg-yellow-50 hover:border-yellow-300",
    fields: [PIN_FIELD],
  },
  {
    id: "rental-returns",
    title: "Rental Tax Returns",
    description: "Filing for rental income properties",
    badge: "SOON",
    card: "",
  },
  {
    id: "verify-supplier",
    title: "Verify Supplier",
    description: "Confirm supplier tax compliance status",
    badge: "SOON",
    card: "",
  },
  {
    id: "tax-compliance",
    title: "Check My Tax Compliance",
    description: "View your overall tax compliance",
    badge: "SOON",
    card: "",
  },
  {
    id: "nil-automation",
    title: "Nil Tax Automation",
    description: "Automate your nil tax returns seamlessly",
    badge: "SOON",
    card: "",
  },
  {
    id: "landlord",
    title: "Landlord Tax Management",
    description: "Manage and file your rental income tax",
    badge: "SOON",
    card: "",
  },
];

const BADGE_STYLES: Record<Badge, string> = {
  FREE: "bg-sky-100 text-sky-700",
  NEW: "bg-red-100 text-red-600",
  SOON: "bg-slate-200 text-slate-500",
};

export default function KRAVerificationPage() {
  const [active, setActive] = useState<Service | null>(null);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          KRA Verification
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Check and verify your tax details with KRA.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SERVICES.map((service) => {
          const soon = service.badge === "SOON";

          return (
            <button
              key={service.id}
              type="button"
              disabled={soon}
              onClick={() => setActive(service)}
              className={`rounded-xl border p-5 text-left transition ${
                soon
                  ? "cursor-not-allowed border-dashed border-slate-200 bg-slate-50/70"
                  : `${service.card} shadow-sm hover:-translate-y-0.5 hover:shadow-md`
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3
                  className={`text-[15px] font-bold leading-snug ${
                    soon ? "text-slate-400" : "text-slate-900"
                  }`}
                >
                  {service.title}
                </h3>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    BADGE_STYLES[service.badge]
                  }`}
                >
                  {service.badge}
                </span>
              </div>
              <p
                className={`mt-2 text-xs ${
                  soon ? "text-slate-400" : "text-slate-600"
                }`}
              >
                {service.description}
              </p>
            </button>
          );
        })}
      </section>

      {active && (
        <ServiceModal service={active} onClose={() => setActive(null)} />
      )}
    </div>
  );
}

// --------------------------------------------------
// Service form + result
// --------------------------------------------------
function ServiceModal({
  service,
  onClose,
}: {
  service: Service;
  onClose: () => void;
}) {
  const fields = service.fields || [];

  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    fields.forEach((f) => {
      initial[f.name] = f.type === "select" ? f.options?.[0] || "" : "";
    });
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, any> | null>(null);

  function setValue(name: string, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
    setError(null);
  }

  async function handleSubmit() {
    for (const f of fields) {
      const v = (values[f.name] || "").trim();
      if (f.pattern && !f.pattern.test(v)) {
        setError(f.error || `Please check ${f.label}.`);
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      // Each service needs a server route that calls KRA.
      const res = await fetch(`/api/kra/${service.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await res.json().catch(() => ({}));

      if (res.status === 404) {
        setError("This service is not available yet. Please try again later.");
        return;
      }
      if (!res.ok || body?.success === false) {
        setError(body?.message || "We could not complete this request.");
        return;
      }

      setResult(body?.data && typeof body.data === "object" ? body.data : {});
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{service.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{service.description}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {!result && (
          <div className="mt-5 space-y-4">
            {fields.map((f) => (
              <div key={f.name}>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                  {f.label}
                </label>
                {f.type === "select" ? (
                  <select
                    value={values[f.name]}
                    onChange={(e) => setValue(f.name, e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    {f.options?.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={values[f.name]}
                    onChange={(e) =>
                      setValue(
                        f.name,
                        f.name === "pin"
                          ? e.target.value.toUpperCase()
                          : e.target.value
                      )
                    }
                    placeholder={f.placeholder}
                    maxLength={f.maxLength}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                )}
              </div>
            ))}

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle size={17} className="shrink-0" />
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={submitting}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0B1B36] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {submitting && <Loader2 size={15} className="animate-spin" />}
                {submitting ? "Checking..." : "Continue"}
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-5">
            <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
              <CheckCircle2 size={17} />
              Request completed
            </div>

            {Object.keys(result).length > 0 && (
              <dl className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100 text-sm">
                {Object.entries(result).map(([key, val]) => (
                  <div key={key} className="flex justify-between gap-4 px-4 py-2.5">
                    <dt className="capitalize text-slate-500">
                      {key.replace(/_/g, " ")}
                    </dt>
                    <dd className="text-right font-medium text-slate-800">
                      {typeof val === "object" ? JSON.stringify(val) : String(val)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="mt-5 flex justify-end">
              <button
                onClick={onClose}
                className="rounded-xl bg-[#0B1B36] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}