"use client";

import { useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Circle,
  Download,
  FileCheck2,
  FileText,
  Search,
  X,
} from "lucide-react";

// --------------------------------------------------
// Types and sample data (illustrative, not real account data)
// --------------------------------------------------

type Status = "completed" | "processing" | "attention" | "failed";

type Step = {
  label: string;
  state: "done" | "pending" | "blocked";
  time?: string;
};

type Submission = {
  id: string;
  ref: string;
  service: string;
  period: string;
  pin: string;
  due: string; // ISO date, also used for sorting
  submittedAt: string | null;
  status: Status;
  ack?: string; // KRA acknowledgement number
  amount: number | null;
  docs: string[];
  steps: Step[];
  problem?: { message: string; action: "pricing" | "retry" };
};

// Mock data removed
const initialSubmissions: Submission[] = [];

const STATUS_META: Record<Status, { label: string; cls: string }> = {
  completed: { label: "Completed", cls: "bg-emerald-50 text-emerald-700" },
  processing: { label: "Processing", cls: "bg-sky-100 text-sky-700" },
  attention: { label: "Action required", cls: "bg-amber-100 text-amber-700" },
  failed: { label: "Failed", cls: "bg-red-50 text-red-700" },
};

const FILTERS: { id: "all" | Status; label: string }[] = [
  { id: "all", label: "All" },
  { id: "completed", label: "Completed" },
  { id: "processing", label: "Processing" },
  { id: "attention", label: "Action required" },
  { id: "failed", label: "Failed" },
];

const maskPin = (pin: string) => `${pin.slice(0, 3)}•••••••${pin.slice(-1)}`;
const money = (n: number) => `KSh ${n.toLocaleString("en-KE")}`;
const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// --------------------------------------------------
// Page
// --------------------------------------------------

export default function SubmissionsPage({
  onGoToPricing,
}: {
  onGoToPricing?: () => void;
}) {
  const [subs, setSubs] = useState<Submission[]>(initialSubmissions);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const open = subs.find((s) => s.id === openId) ?? null;

  const visible = [...subs]
    .filter((s) => filter === "all" || s.status === filter)
    .filter((s) => {
      const q = query.trim().toLowerCase();
      return (
        !q ||
        s.ref.toLowerCase().includes(q) ||
        s.service.toLowerCase().includes(q) ||
        s.period.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => b.due.localeCompare(a.due));

  const countFor = (id: "all" | Status) =>
    id === "all" ? subs.length : subs.filter((s) => s.status === id).length;

  function retry(s: Submission) {
    setSubs((prev) =>
      prev.map((x) =>
        x.id === s.id
          ? {
              ...x,
              status: "processing",
              problem: undefined,
              steps: [
                { label: "Prepared", state: "done", time: x.steps[0]?.time },
                { label: "Submitted to KRA", state: "pending" },
                { label: "Acknowledged by KRA", state: "pending" },
              ],
            }
          : x
      )
    );
    setOpenId(null);
    setNotice(`${s.ref} is being submitted again.`);
  }

  return (
    <div className="space-y-6">
      {/* Intro */}
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          My Submissions
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Track every return your workflows have filed or prepared for you.
        </p>
      </section>

      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={17} />
            {notice}
          </span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search and filters */}
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative lg:w-80">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by reference, return or period"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#0B1B36]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                filter === f.id
                  ? "bg-[#0B1B36] text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {f.label} ({countFor(f.id)})
            </button>
          ))}
        </div>
      </section>

      {/* Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center p-12 text-center">
            <div className="rounded-2xl bg-blue-50 p-4 text-blue-700">
              <FileCheck2 size={28} />
            </div>
            <p className="mt-4 font-semibold text-slate-800">
              {subs.length === 0 ? "No submissions yet" : "No submissions match your search"}
            </p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {subs.length === 0
                ? "Submissions appear here once one of your workflows files a return."
                : "Try a different search or filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Reference</th>
                  <th className="px-5 py-3 font-medium">Return</th>
                  <th className="px-5 py-3 font-medium">Period</th>
                  <th className="px-5 py-3 font-medium">KRA PIN</th>
                  <th className="px-5 py-3 font-medium">Submitted</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((s) => {
                  const meta = STATUS_META[s.status];
                  return (
                    <tr key={s.id} className="transition hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-800">{s.ref}</td>
                      <td className="px-5 py-4 text-slate-700">{s.service}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">{s.period}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-500">{maskPin(s.pin)}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {s.submittedAt ? s.submittedAt.split(",")[0] : "Not filed"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold ${meta.cls}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setOpenId(s.id)}
                          className="rounded-lg px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-center text-xs text-slate-400">
        Submissions are created by your workflows. Sample submissions are not real account data.
      </p>

      {/* Details dialog */}
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="submission-title"
        >
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
              <div>
                <h3 id="submission-title" className="text-lg font-bold text-slate-900">
                  {open.service} · {open.period}
                </h3>
                <p className="mt-1 text-xs text-slate-400">{open.ref}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${STATUS_META[open.status].cls}`}>
                  {STATUS_META[open.status].label}
                </span>
                <button onClick={() => setOpenId(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              {open.problem && (
                <div
                  className={`flex gap-3 rounded-xl border p-4 text-sm ${
                    open.status === "failed"
                      ? "border-red-100 bg-red-50 text-red-800"
                      : "border-amber-200 bg-amber-50 text-amber-900"
                  }`}
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p>{open.problem.message}</p>
                </div>
              )}

              <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
                <Row label="KRA PIN" value={maskPin(open.pin)} />
                <Row label="Due date" value={formatDate(open.due)} />
                <Row label="Submitted" value={open.submittedAt ?? "Not filed"} />
                <Row label="KRA acknowledgement" value={open.ack ?? "—"} />
                <Row label="Tax paid" value={open.amount === null ? "—" : money(open.amount)} />
              </dl>

              <div>
                <p className="text-sm font-semibold text-slate-800">Progress</p>
                <ol className="mt-3 space-y-3">
                  {open.steps.map((st) => (
                    <li key={st.label} className="flex items-center gap-3 text-sm">
                      {st.state === "done" && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          <Check size={14} />
                        </span>
                      )}
                      {st.state === "pending" && <Circle size={24} className="text-slate-300" />}
                      {st.state === "blocked" && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600">
                          <X size={14} />
                        </span>
                      )}
                      <span className={st.state === "pending" ? "text-slate-400" : "font-medium text-slate-800"}>
                        {st.label}
                      </span>
                      {st.time && <span className="ml-auto text-xs text-slate-400">{st.time}</span>}
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">Documents</p>
                {open.docs.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-400">No documents were generated for this submission.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {open.docs.map((d) => (
                      <li key={d} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3">
                        <span className="flex min-w-0 items-center gap-2 text-sm text-slate-700">
                          <FileText size={16} className="shrink-0 text-red-600" />
                          <span className="truncate">{d}</span>
                        </span>
                        <button
                          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline"
                          aria-label={`Download ${d}`}
                        >
                          <Download size={14} />
                          Download
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                onClick={() => setOpenId(null)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              {open.problem?.action === "pricing" && (
                <button
                  onClick={onGoToPricing}
                  className="rounded-lg bg-[#0B1B36] px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Renew service
                </button>
              )}
              {open.problem?.action === "retry" && (
                <button
                  onClick={() => retry(open)}
                  className="rounded-lg bg-[#0B1B36] px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Retry submission
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-semibold text-slate-800">{value}</dd>
    </div>
  );
}