"use client";

import { useState, useEffect } from "react";
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
  Loader2,
} from "lucide-react";

type Tab = "personal" | "security" | "notifications";
type Details = { firstName: string; lastName: string; email: string; phone: string };
type Session = { id: string; device: string; kind: "desktop" | "phone"; place: string; lastActive: string; current?: boolean; };
type Pref = { id: string; label: string; desc: string; email: boolean; sms: boolean; emailLocked?: boolean; };

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_FORMAT = /^(?:\+254|0)[17]\d{8}$/;

export default function ProfilePage() {
  const [tab, setTab] = useState<Tab>("personal");
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // personal details
  const [saved, setSaved] = useState<Details>({ firstName: "", lastName: "", email: "", phone: "" });
  const [form, setForm] = useState<Details>({ firstName: "", lastName: "", email: "", phone: "" });

  // security
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [twoStep, setTwoStep] = useState(true);
  const [confirmOff, setConfirmOff] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  // notifications
  const [savedPrefs, setSavedPrefs] = useState<Pref[]>([]);
  const [prefs, setPrefs] = useState<Pref[]>([]);

  // Fetch real user data on load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/auth/profile');
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        const data = await res.json();
        
        if (data.success && data.data) {
          const user = data.data;
          const userDetails = {
            firstName: user.first_name || "",
            lastName: user.last_name || "",
            email: user.email || "",
            phone: user.phone || "",
          };
          setSaved(userDetails);
          setForm(userDetails);
        }
      } catch (err) {
        console.error("Failed to load profile", err);
        setErrorMsg("Failed to load profile data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const errors = {
    firstName: form.firstName.trim() ? "" : "Enter your first name.",
    lastName: form.lastName.trim() ? "" : "Enter your last name.",
    email: EMAIL_FORMAT.test(form.email.trim()) ? "" : "Enter a valid email address.",
    phone: PHONE_FORMAT.test(form.phone.replace(/\s/g, "")) ? "" : "Use a Kenyan number, e.g. 0712 345 678 or +254 712 345 678.",
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);

  // Save real details to backend
  async function saveDetails() {
    if (hasErrors || !dirty) return;
    
    setIsSaving(true);
    setErrorMsg(null);
    
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.firstName,
          last_name: form.lastName,
          phone: form.phone,
          // Note: For email changes, you usually need a separate verification flow.
          // We send it here, but your backend might ignore it until verified.
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      setSaved(form);
      setNotice("Your details were saved successfully.");
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  }

  const rules = [
    { label: "At least 8 characters", ok: next.length >= 8 },
    { label: "Contains a letter and a number", ok: /[A-Za-z]/.test(next) && /\d/.test(next) },
    { label: "Matches the confirmation", ok: next.length > 0 && next === confirm },
  ];
  const sameAsCurrent = next.length > 0 && next === current;
  const canUpdatePassword = current.length > 0 && rules.every((r) => r.ok) && !sameAsCurrent;

  function updatePassword() {
    if (!canUpdatePassword) return;
    setCurrent("");
    setNext("");
    setConfirm("");
    setNotice("Your password was updated.");
  }

  const prefsDirty = JSON.stringify(prefs) !== JSON.stringify(savedPrefs);
  function setPref(id: string, channel: "email" | "sms", value: boolean) {
    setPrefs((prev) => prev.map((p) => (p.id === id ? { ...p, [channel]: value } : p)));
  }

  const initials = `${saved.firstName[0] ?? ""}${saved.lastName[0] ?? ""}`.toUpperCase() || "?";
  const displayName = saved.firstName || saved.lastName ? `${saved.firstName} ${saved.lastName}`.trim() : "No name provided";
  const displayEmail = saved.email || "No email provided";

  const tabs: [Tab, string][] = [
    ["personal", "Personal details"],
    ["security", "Security"],
    ["notifications", "Notifications"],
  ];

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Profile</h1>
        <p className="mt-2 text-sm text-slate-500">Manage your personal details, security and notifications.</p>
      </section>

      <section className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-900">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-slate-900">{displayName}</p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-slate-500">
            {displayEmail}
            {saved.email && <BadgeCheck size={15} className="shrink-0 text-emerald-600" aria-label="Verified" />}
          </p>
          <p className="mt-1 text-xs text-slate-400">Individual account</p>
        </div>
      </section>

      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span className="flex items-center gap-2"><CheckCircle2 size={17} />{notice}</span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss"><X size={16} /></button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span className="flex items-center gap-2"><AlertTriangle size={17} />{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} aria-label="Dismiss"><X size={16} /></button>
        </div>
      )}

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
              hint="Contact support to change your verified email."
              onChange={() => {}} // Disabled for now to prevent unverified email changes
              readOnly
            />
            <Field
              label="Phone number"
              type="tel"
              value={form.phone}
              error={errors.phone}
              hint="Verification codes are sent to this number."
              onChange={(v) => setForm({ ...form, phone: v })}
            />
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              onClick={() => setForm(saved)}
              disabled={!dirty || isSaving}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Discard changes
            </button>
            <button
              onClick={saveDetails}
              disabled={!dirty || hasErrors || isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0B1B36] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSaving && <Loader2 size={15} className="animate-spin" />}
              Save changes
            </button>
          </div>
        </section>
      )}

      {/* ... (Keep the Security and Notifications tabs exactly as they are in your file) ... */}
      
      {/* ... (Keep the Delete dialog exactly as it is in your file) ... */}

    </div>
  );
}

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