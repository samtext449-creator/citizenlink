"use client";

import { useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  CheckCircle2,
  Circle,
  Laptop,
  Lock,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";

// --------------------------------------------------
// Types
// --------------------------------------------------

type Tab = "personal" | "security" | "notifications";

type Details = { firstName: string; lastName: string; email: string; phone: string };

type Session = {
  id: string;
  device: string;
  kind: "desktop" | "phone";
  place: string;
  lastActive: string;
  current?: boolean;
};

type Pref = {
  id: string;
  label: string;
  desc: string;
  email: boolean;
  sms: boolean;
  emailLocked?: boolean; // important notices that cannot be switched off by email
};

// Mock data removed
const initialDetails: Details = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};

const initialSessions: Session[] = [];

const initialPrefs: Pref[] = [];

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_FORMAT = /^(?:\+254|0)[17]\d{8}$/;

// --------------------------------------------------
// Page
// --------------------------------------------------

export default function ProfilePage() {
  const [tab, setTab] = useState<Tab>("personal");
  const [notice, setNotice] = useState<string | null>(null);

  // personal details
  const [saved, setSaved] = useState<Details>(initialDetails);
  const [form, setForm] = useState<Details>(initialDetails);

  // security
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [twoStep, setTwoStep] = useState(true);
  const [confirmOff, setConfirmOff] = useState(false);
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  // notifications
  const [savedPrefs, setSavedPrefs] = useState<Pref[]>(initialPrefs);
  const [prefs, setPrefs] = useState<Pref[]>(initialPrefs);

  // ---- personal details ----
  const errors = {
    firstName: form.firstName.trim() ? "" : "Enter your first name.",
    lastName: form.lastName.trim() ? "" : "Enter your last name.",
    email: EMAIL_FORMAT.test(form.email.trim()) ? "" : "Enter a valid email address.",
    phone: PHONE_FORMAT.test(form.phone.replace(/\s/g, ""))
      ? ""
      : "Use a Kenyan number, e.g. 0712 345 678 or +254 712 345 678.",
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);

  function saveDetails() {
    if (hasErrors || !dirty) return;
    const contactChanged = form.email !== saved.email || form.phone !== saved.phone;
    setSaved(form);
    setNotice(
      contactChanged
        ? "Details saved. We'll ask you to verify your new email or phone number."
        : "Your details were saved."
    );
  }

  // ---- password ----
  const rules = [
    { label: "At least 8 characters", ok: next.length >= 8 },
    { label: "Contains a letter and a number", ok: /[A-Za-z]/.test(next) && /\d/.test(next) },
    { label: "Matches the confirmation", ok: next.length > 0 && next === confirm },
  ];
  const sameAsCurrent = next.length > 0 && next === current;
  const canUpdatePassword = current.length > 0 && rules.every((r) => r.ok) && !sameAsCurrent;

  function updatePassword() {
    if (!canUpdatePassword) return;
    // Demo only: a real app would check the current password and update it on the server.
    setCurrent("");
    setNext("");
    setConfirm("");
    setNotice("Your password was updated.");
  }

  // ---- notifications ----
  const prefsDirty = JSON.stringify(prefs) !== JSON.stringify(savedPrefs);
  function setPref(id: string, channel: "email" | "sms", value: boolean) {
    setPrefs((prev) => prev.map((p) => (p.id === id ? { ...p, [channel]: value } : p)));
  }

  const initials = `${saved.firstName[0] ?? ""}${saved.lastName[0] ?? ""}`.toUpperCase() || "?";
  const displayName = saved.firstName || saved.lastName 
    ? `${saved.firstName} ${saved.lastName}`.trim() 
    : "No name provided";
  const displayEmail = saved.email || "No email provided";

  const tabs: [Tab, string][] = [
    ["personal", "Personal details"],
    ["security", "Security"],
    ["notifications", "Notifications"],
  ];

  return (
    <div className="space-y-6">
      {/* Intro */}
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Profile</h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage your personal details, security and notifications.
        </p>
      </section>

      {/* Identity card */}
      <section className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-900">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-slate-900">
            {displayName}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-slate-500">
            {displayEmail}
            {saved.email && <BadgeCheck size={15} className="shrink-0 text-emerald-600" aria-label="Verified" />}
          </p>
          <p className="mt-1 text-xs text-slate-400">Individual account</p>
        </div>
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

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
              tab === id ? "border-[#0B1B36] text-[#0B1B36]" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ---------------- Personal details ---------------- */}
      {tab === "personal" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-900">Personal details</h2>
          <p className="mt-1 text-xs text-slate-400">These details are used on your account and in notifications.</p>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="First name" value={form.firstName} error={errors.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
            <Field label="Last name" value={form.lastName} error={errors.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
            <Field
              label="Email address"
              type="email"
              value={form.email}
              error={errors.email}
              hint="Changing your email will ask you to verify the new address."
              onChange={(v) => setForm({ ...form, email: v })}
            />
            <Field
              label="Phone number"
              type="tel"
              value={form.phone}
              error={errors.phone}
              hint="Verification codes are sent to this number."
              onChange={(v) => setForm({ ...form, phone: v })}
            />
            <Field label="National ID number" value="3••••••8" readOnly hint="To change your ID number, contact support." />
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              onClick={() => setForm(saved)}
              disabled={!dirty}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Discard changes
            </button>
            <button
              onClick={saveDetails}
              disabled={!dirty || hasErrors}
              className="rounded-lg bg-[#0B1B36] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Save changes
            </button>
          </div>
        </section>
      )}

      {/* ---------------- Security ---------------- */}
      {tab === "security" && (
        <div className="space-y-6">
          {/* Password */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-slate-900">Change password</h2>
            <p className="mt-1 text-xs text-slate-400">Use a password you don't use anywhere else.</p>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2 md:max-w-sm">
                <Field label="Current password" type="password" value={current} onChange={setCurrent} autoComplete="current-password" />
              </div>
              <Field
                label="New password"
                type="password"
                value={next}
                onChange={setNext}
                autoComplete="new-password"
                error={sameAsCurrent ? "Your new password must be different from the current one." : ""}
              />
              <Field label="Confirm new password" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
            </div>

            <ul className="mt-4 space-y-1.5 text-xs">
              {rules.map((r) => (
                <li key={r.label} className={`flex items-center gap-2 ${r.ok ? "text-emerald-700" : "text-slate-400"}`}>
                  {r.ok ? <Check size={14} /> : <Circle size={14} />}
                  {r.label}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
              <button
                onClick={updatePassword}
                disabled={!canUpdatePassword}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0B1B36] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Lock size={15} />
                Update password
              </button>
            </div>
          </section>

          {/* Two-step verification */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bold text-slate-900">Two-step verification</h2>
                <p className="mt-1 max-w-xl text-sm text-slate-500">
                  When you sign in on a new device, we send a code to your phone as well as asking for your password.
                </p>
              </div>
              <Toggle
                checked={twoStep}
                label="Two-step verification"
                onChange={(v) => {
                  if (v) setTwoStep(true);
                  else setConfirmOff(true);
                }}
              />
            </div>

            {confirmOff && (
              <div className="mt-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
                <p>Turn off two-step verification? Your account will be easier to break into.</p>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => setConfirmOff(false)}
                    className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold hover:bg-amber-100"
                  >
                    Keep it on
                  </button>
                  <button
                    onClick={() => {
                      setTwoStep(false);
                      setConfirmOff(false);
                    }}
                    className="rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800"
                  >
                    Turn off
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Sessions */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-bold text-slate-900">Where you're signed in</h2>
                <p className="mt-1 text-xs text-slate-400">Sign out of any device you don't recognize.</p>
              </div>
              <button
                onClick={() => {
                  setSessions((prev) => prev.filter((s) => s.current));
                  setNotice("You were signed out of your other devices.");
                }}
                disabled={sessions.length === 0 || sessions.every((s) => s.current)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Sign out other devices
              </button>
            </div>
            
            {sessions.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                No active sessions found.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {sessions.map((s) => {
                  const Icon = s.kind === "phone" ? Smartphone : Laptop;
                  return (
                    <li key={s.id} className="flex items-center justify-between gap-3 p-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="rounded-lg bg-slate-100 p-2.5 text-slate-600">
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                            {s.device}
                            {s.current && (
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                This device
                              </span>
                            )}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {s.place} · {s.lastActive}
                          </p>
                        </div>
                      </div>
                      {!s.current && (
                        <button
                          onClick={() => setSessions((prev) => prev.filter((x) => x.id !== s.id))}
                          className="shrink-0 text-xs font-semibold text-red-600 hover:underline"
                        >
                          Sign out
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Danger zone */}
          <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-red-700">Delete account</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-500">
              This stops your workflows, unlinks your KRA accounts and removes your documents. It can't be undone.
            </p>
            <button
              onClick={() => setDeleteOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <Trash2 size={16} />
              Delete my account
            </button>
          </section>
        </div>
      )}

      {/* ---------------- Notifications ---------------- */}
      {tab === "notifications" && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-bold text-slate-900">Notification preferences</h2>
            <p className="mt-1 text-xs text-slate-400">Choose how you'd like to hear from TaxFlow.</p>
          </div>

          {prefs.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              No notification preferences available.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Notification</th>
                    <th className="px-5 py-3 text-center font-medium">Email</th>
                    <th className="px-5 py-3 text-center font-medium">SMS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prefs.map((p) => (
                    <tr key={p.id}>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">{p.label}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {p.desc}
                          {p.emailLocked && " Email can't be turned off."}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-center">
                          <Toggle checked={p.email} disabled={p.emailLocked} label={`${p.label} by email`} onChange={(v) => setPref(p.id, "email", v)} />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-center">
                          <Toggle checked={p.sms} label={`${p.label} by SMS`} onChange={(v) => setPref(p.id, "sms", v)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 p-5">
            <button
              onClick={() => setPrefs(savedPrefs)}
              disabled={!prefsDirty}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Discard changes
            </button>
            <button
              onClick={() => {
                setSavedPrefs(prefs);
                setNotice("Your notification preferences were saved.");
              }}
              disabled={!prefsDirty}
              className="rounded-lg bg-[#0B1B36] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Save preferences
            </button>
          </div>
        </section>
      )}

      <p className="text-center text-xs text-slate-400">Sample profile data, not a real account.</p>

      {/* Delete dialog */}
      {deleteOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-red-50 p-2.5 text-red-600">
                <AlertTriangle size={20} />
              </div>
              <h3 id="delete-title" className="text-lg font-bold text-slate-900">
                Delete your account?
              </h3>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>Your workflows stop and no more returns are filed.</li>
              <li>Your linked KRA accounts are unlinked.</li>
              <li>Your documents and submission history are removed.</li>
              <li>Any active subscription is cancelled.</li>
            </ul>
            <label className="mt-5 block text-sm font-semibold text-slate-800">
              Type DELETE to confirm
              <input
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-red-500"
              />
            </label>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => {
                  setDeleteOpen(false);
                  setDeleteText("");
                }}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Keep my account
              </button>
              <button
                onClick={() => {
                  // Demo only: a real app would send the deletion request to the server here.
                  setDeleteOpen(false);
                  setDeleteText("");
                  setNotice("Your account deletion request was received.");
                }}
                disabled={deleteText !== "DELETE"}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Delete account
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

function Field({
  label,
  value,
  onChange,
  type = "text",
  error,
  hint,
  readOnly,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  error?: string;
  hint?: string;
  readOnly?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-800">
      {label}
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        autoComplete={autoComplete}
        onChange={(e) => onChange?.(e.target.value)}
        className={`mt-2 w-full rounded-lg border px-3 py-2.5 text-sm font-normal outline-none focus:border-[#0B1B36] ${
          readOnly ? "border-slate-200 bg-slate-50 text-slate-500" : error ? "border-red-300" : "border-slate-200"
        }`}
      />
      {error ? (
        <span className="mt-1.5 block text-xs font-normal text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs font-normal text-slate-400">{hint}</span>
      ) : null}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-[#0B1B36]" : "bg-slate-300"} ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`}
      />
    </button>
  );
}