"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  CalendarClock,
  FileCheck2,
  Loader2,
  Printer,
  ShieldCheck,
} from "lucide-react";

// --------------------------------------------------
// My Tax Profile: tax card report and status
// Shows what KRA holds for the user. Nothing is invented here:
// the data comes from /api/tax-profile.
// --------------------------------------------------
type Obligation = {
  name: string;
  status: string;
  effective_from?: string;
  effective_to?: string | null;
};

type TaxProfile = {
  taxpayer_name?: string;
  kra_pin?: string;
  taxpayer_type?: string;
  status?: string;
  registered_on?: string;
  tax_station?: string;
  obligations?: Obligation[];
  compliance?: {
    status?: string;
    pending_returns?: number;
    next_due_date?: string;
  };
  tcc?: {
    status?: string;
    expires_on?: string;
  };
  updated_at?: string;
};

function statusStyle(status?: string) {
  const s = (status || "").toLowerCase();
  if (["active", "compliant", "valid", "verified"].includes(s))
    return "bg-green-50 text-green-700 border-green-200";
  if (["dormant", "pending", "expiring"].includes(s))
    return "bg-yellow-50 text-yellow-800 border-yellow-200";
  if (["inactive", "cancelled", "non-compliant", "expired", "invalid"].includes(s))
    return "bg-red-50 text-red-700 border-red-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function maskPin(pin?: string) {
  if (!pin) return "-";
  return pin.length === 11 ? `${pin.slice(0, 3)}*****${pin.slice(-3)}` : pin;
}

export default function MyTaxProfilePage({
  onNavigate,
}: {
  onNavigate?: (page: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<TaxProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/tax-profile");

        // 404 = nothing linked/verified yet, or the route is not built yet
        if (res.status === 404) {
          setProfile(null);
          return;
        }
        if (!res.ok) {
          setError("We could not load your tax profile. Please try again.");
          return;
        }

        const body = await res.json();
        setProfile(body?.data || null);
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-400">
        <Loader2 className="animate-spin" size={26} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            My Tax Profile
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Your tax card report and current status with KRA.
          </p>
        </div>

        {profile && (
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:self-auto"
          >
            <Printer size={16} />
            Print report
          </button>
        )}
      </section>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={17} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Empty state */}
      {!profile && !error && (
        <section className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="rounded-full bg-blue-50 p-4 text-blue-700">
            <ShieldCheck size={30} />
          </div>
          <h2 className="mt-5 text-lg font-bold text-slate-900">
            No tax profile yet
          </h2>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            Verify your KRA PIN first. Your tax card, obligations and
            compliance status will appear here.
          </p>
          {onNavigate && (
            <button
              onClick={() => onNavigate("KRA Verification")}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0B1B36] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <BadgeCheck size={17} />
              Go to KRA Verification
            </button>
          )}
        </section>
      )}

      {/* Report */}
      {profile && (
        <>
          {/* Tax card */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Taxpayer
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {profile.taxpayer_name || "-"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {profile.taxpayer_type || "Individual"}
                </p>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 self-start rounded-full border px-3.5 py-1 text-xs font-bold ${statusStyle(
                  profile.status
                )}`}
              >
                <BadgeCheck size={14} />
                {profile.status || "Unknown"}
              </span>
            </div>

            <dl className="mt-6 grid grid-cols-1 gap-5 border-t border-slate-100 pt-5 sm:grid-cols-3">
              <Detail label="KRA PIN" value={maskPin(profile.kra_pin)} />
              <Detail label="Registered on" value={formatDate(profile.registered_on)} />
              <Detail label="Tax station" value={profile.tax_station || "-"} />
            </dl>
          </section>

          {/* Status tiles */}
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Tile
              icon={ShieldCheck}
              label="Tax compliance"
              value={profile.compliance?.status || "Unknown"}
              badge={statusStyle(profile.compliance?.status)}
            />
            <Tile
              icon={FileCheck2}
              label="Pending returns"
              value={String(profile.compliance?.pending_returns ?? "-")}
              badge="bg-slate-50 text-slate-700 border-slate-200"
              hint={
                profile.compliance?.next_due_date
                  ? `Next due ${formatDate(profile.compliance.next_due_date)}`
                  : undefined
              }
            />
            <Tile
              icon={CalendarClock}
              label="Tax Compliance Certificate"
              value={profile.tcc?.status || "Not available"}
              badge={statusStyle(profile.tcc?.status)}
              hint={
                profile.tcc?.expires_on
                  ? `Expires ${formatDate(profile.tcc.expires_on)}`
                  : undefined
              }
            />
          </section>

          {/* Obligations */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h3 className="font-bold text-slate-900">Tax obligations</h3>
              <p className="mt-1 text-xs text-slate-400">
                Obligations registered against your PIN
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3">Obligation</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Effective from</th>
                    <th className="px-5 py-3">Effective to</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(profile.obligations || []).length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-10 text-center text-sm text-slate-400"
                      >
                        No obligations found.
                      </td>
                    </tr>
                  ) : (
                    (profile.obligations || []).map((o, i) => (
                      <tr key={`${o.name}-${i}`} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {o.name}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-block rounded-full border px-3 py-1 text-[11px] font-semibold ${statusStyle(
                              o.status
                            )}`}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-600">
                          {formatDate(o.effective_from)}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-600">
                          {formatDate(o.effective_to)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {profile.updated_at && (
            <p className="text-xs text-slate-400">
              Last updated {formatDate(profile.updated_at)}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd>
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  badge,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  badge: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
          <Icon size={19} />
        </div>
        <p className="text-sm font-medium text-slate-600">{label}</p>
      </div>
      <span
        className={`mt-4 inline-block rounded-full border px-3 py-1 text-sm font-bold ${badge}`}
      >
        {value}
      </span>
      {hint && <p className="mt-2 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}