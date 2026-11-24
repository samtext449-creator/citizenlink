"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Info,
  Landmark,
  Link2,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  User,
  X,
} from "lucide-react";

// --------------------------------------------------
// Types
// --------------------------------------------------

type AcctStatus = "connected" | "attention";

type Account = {
  pin: string;
  name: string;
  type: "Individual" | "Company";
  status: AcctStatus;
  lastVerified: string;
  note?: string;
  workflow: string | null; // one workflow per KRA PIN
};

// Mock data removed
const initialAccounts: Account[] = [];

const STATUS_META: Record<AcctStatus, { label: string; cls: string }> = {
  connected: { label: "Connected", cls: "bg-emerald-50 text-emerald-700" },
  attention: { label: "Re-authentication needed", cls: "bg-amber-100 text-amber-700" },
};

const PIN_FORMAT = /^[AP]\d{9}[A-Z]$/;
const maskPin = (pin: string) => `${pin.slice(0, 3)}•••••••${pin.slice(-1)}`;
const today = () =>
  new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

// --------------------------------------------------
// Verification (demo stubs)
// --------------------------------------------------

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const demoVerifyPassword = async (pw: string) => {
  await wait(900);
  return pw.length > 0;
};
const demoSendOtp = async (_pin: string) => {
  await wait(700);
  return true;
};
const demoVerifyOtp = async (code: string, _pin: string) => {
  await wait(900);
  return code === "123456";
};

type Auth = {
  verifyPassword: (password: string) => Promise<boolean>;
  sendOtp: (pin: string) => Promise<boolean>;
  verifyOtp: (code: string, pin: string) => Promise<boolean>;
};

const PHONE_HINT = "+254 7•• ••• 123";
const RESEND_SECONDS = 30;
const MAX_CODE_ATTEMPTS = 5;

// --------------------------------------------------
// Page
// --------------------------------------------------

export default function LinkedAccountsPage({
  verifyPassword = demoVerifyPassword,
  sendOtp = demoSendOtp,
  verifyOtp = demoVerifyOtp,
}: Partial<Auth>) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [dialog, setDialog] = useState<{ reauthPin?: string } | null>(null);
  const [unlinkPin, setUnlinkPin] = useState<string | null>(null);
  const [verifyingPin, setVerifyingPin] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const unlinking = accounts.find((a) => a.pin === unlinkPin) ?? null;

  function verify(pin: string) {
    setVerifyingPin(pin);
    setTimeout(() => {
      setAccounts((prev) =>
        prev.map((a) => (a.pin === pin ? { ...a, status: "connected", lastVerified: today(), note: undefined } : a))
      );
      setVerifyingPin(null);
      setNotice(`${maskPin(pin)} was verified.`);
    }, 1200);
  }

  function linked(pin: string, isReauth: boolean) {
    setAccounts((prev) =>
      isReauth
        ? prev.map((a) => (a.pin === pin ? { ...a, status: "connected", lastVerified: today(), note: undefined } : a))
        : [
            ...prev,
            {
              pin,
              name: "Name from KRA iTax",
              type: pin.startsWith("P") ? "Company" : "Individual",
              status: "connected",
              lastVerified: today(),
              workflow: null,
            },
          ]
    );
    setDialog(null);
    setNotice(isReauth ? `${maskPin(pin)} was reconnected.` : `${maskPin(pin)} was linked.`);
  }

  function unlink(pin: string) {
    setAccounts((prev) => prev.filter((a) => a.pin !== pin));
    setUnlinkPin(null);
    setNotice(`${maskPin(pin)} was unlinked.`);
  }

  return (
    <div className="space-y-6">
      {/* Intro */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Linked Accounts
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Connect your KRA accounts so TaxFlow can file on your behalf.
          </p>
        </div>
        <button
          onClick={() => setDialog({})}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1B36] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <Plus size={18} />
          Link KRA account
        </button>
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

      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-slate-600">
        <Info size={18} className="mt-0.5 shrink-0 text-blue-700" />
        <p>
          Each KRA PIN can have <strong className="font-semibold text-slate-800">one workflow</strong>.
          Linking an account does not start any filing until you create and activate a workflow for it.
        </p>
      </div>

      {/* Accounts */}
      {accounts.length === 0 ? (
        <section className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="rounded-2xl bg-blue-50 p-4 text-blue-700">
            <Link2 size={28} />
          </div>
          <p className="mt-4 font-semibold text-slate-800">No KRA accounts linked</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Link a KRA account to start automating your filings.
          </p>
          <button
            onClick={() => setDialog({})}
            className="mt-5 rounded-lg bg-[#0B1B36] px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Link KRA account
          </button>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {accounts.map((a) => {
            const meta = STATUS_META[a.status];
            const TypeIcon = a.type === "Company" ? Building2 : User;
            const busy = verifyingPin === a.pin;
            return (
              <div key={a.pin} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                      <Landmark size={22} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-900">{a.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">KRA PIN: {maskPin(a.pin)}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${meta.cls}`}>
                    {meta.label}
                  </span>
                </div>

                {a.note && (
                  <div className="mt-4 flex gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                    <p>{a.note}</p>
                  </div>
                )}

                <dl className="mt-4 grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <dt className="text-slate-400">Type</dt>
                    <dd className="mt-1 flex items-center gap-1.5 font-semibold text-slate-700">
                      <TypeIcon size={13} className="text-slate-400" />
                      {a.type}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Last verified</dt>
                    <dd className="mt-1 font-semibold text-slate-700">{a.lastVerified}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Workflow</dt>
                    <dd className="mt-1 font-semibold text-slate-700">{a.workflow ?? "None yet"}</dd>
                  </div>
                </dl>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                  {a.status === "attention" ? (
                    <button
                      onClick={() => setDialog({ reauthPin: a.pin })}
                      className="rounded-lg bg-[#0B1B36] px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Re-authenticate
                    </button>
                  ) : (
                    <button
                      onClick={() => verify(a.pin)}
                      disabled={busy}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                      {busy ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                      {busy ? "Verifying…" : "Verify connection"}
                    </button>
                  )}
                  <button
                    onClick={() => setUnlinkPin(a.pin)}
                    className="ml-auto rounded-lg px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    Unlink
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}

      <p className="text-center text-xs text-slate-400">
        Sample accounts are not real account data.
      </p>

      {/* Link / re-authenticate dialog */}
      {dialog && (
        <LinkDialog
          reauthPin={dialog.reauthPin}
          existingPins={accounts.map((a) => a.pin)}
          auth={{ verifyPassword, sendOtp, verifyOtp }}
          onClose={() => setDialog(null)}
          onDone={(pin) => linked(pin, !!dialog.reauthPin)}
        />
      )}

      {/* Unlink confirmation */}
      {unlinking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="unlink-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 id="unlink-title" className="text-lg font-bold text-slate-900">
              Unlink {maskPin(unlinking.pin)}?
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {unlinking.workflow ? (
                <li>
                  Your <strong className="text-slate-800">{unlinking.workflow}</strong> workflow will pause, and
                  scheduled filings for this PIN will stop.
                </li>
              ) : (
                <li>No workflow uses this account, so nothing will stop running.</li>
              )}
              <li>Your documents and submission history stay available.</li>
              <li>You can link this account again at any time.</li>
            </ul>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setUnlinkPin(null)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Keep linked
              </button>
              <button
                onClick={() => unlink(unlinking.pin)}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Unlink account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------
// Link dialog: PIN + TaxFlow password, then a one-time code
// --------------------------------------------------

function LinkDialog({
  reauthPin,
  existingPins,
  auth,
  onClose,
  onDone,
}: {
  reauthPin?: string;
  existingPins: string[];
  auth: Auth;
  onClose: () => void;
  onDone: (pin: string) => void;
}) {
  const [step, setStep] = useState<"details" | "otp">("details");
  const [pin, setPin] = useState(reauthPin ?? "");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const pinUpper = pin.trim().toUpperCase();
  const formatOk = PIN_FORMAT.test(pinUpper);
  const taken = !reauthPin && existingPins.includes(pinUpper);
  const canContinue = formatOk && !taken && password.length > 0 && consent && !busy;

  async function submitDetails() {
    if (!canContinue) return;
    setBusy(true);
    setPasswordError("");
    try {
      const ok = await auth.verifyPassword(password);
      if (!ok) {
        setPassword("");
        setPasswordError("That password is incorrect. Try again.");
        setBusy(false);
        return;
      }
      setPassword("");
      await auth.sendOtp(pinUpper);
      setCode("");
      setCodeError("");
      setAttempts(0);
      setCooldown(RESEND_SECONDS);
      setStep("otp");
    } catch {
      setPasswordError("Something went wrong. Please try again.");
    }
    setBusy(false);
  }

  async function submitCode() {
    if (code.length !== 6 || busy) return;
    setBusy(true);
    setCodeError("");
    try {
      const ok = await auth.verifyOtp(code, pinUpper);
      if (ok) {
        onDone(pinUpper);
        return;
      }
      const used = attempts + 1;
      setAttempts(used);
      setCode("");
      if (used >= MAX_CODE_ATTEMPTS) {
        setStep("details");
        setPasswordError("Too many incorrect codes. Enter your password to get a new one.");
      } else {
        setCodeError(`That code is incorrect. ${MAX_CODE_ATTEMPTS - used} attempts left.`);
      }
    } catch {
      setCodeError("Something went wrong. Please try again.");
    }
    setBusy(false);
  }

  async function resend() {
    if (cooldown > 0 || busy) return;
    setBusy(true);
    setCodeError("");
    try {
      await auth.sendOtp(pinUpper);
      setCooldown(RESEND_SECONDS);
    } catch {
      setCodeError("Could not send a new code. Please try again.");
    }
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="link-title">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 id="link-title" className="text-lg font-bold text-slate-900">
            {step === "otp"
              ? "Enter verification code"
              : reauthPin
              ? "Re-authenticate account"
              : "Link KRA account"}
          </h3>
          <button onClick={onClose} disabled={busy} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {step === "details" ? (
          <>
            <p className="mt-2 text-sm text-slate-500">
              Confirm it's you with your TaxFlow password. We'll then send a code to your phone.
            </p>

            <label className="mt-5 block text-sm font-semibold text-slate-800">
              KRA PIN
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                readOnly={!!reauthPin}
                maxLength={11}
                placeholder="e.g. A123456789B"
                className={`mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal uppercase outline-none focus:border-[#0B1B36] ${
                  reauthPin ? "bg-slate-50 text-slate-500" : ""
                }`}
              />
            </label>
            {pin && !formatOk && !reauthPin && (
              <p className="mt-2 text-xs text-slate-500">A KRA PIN is a letter, 9 digits and a letter.</p>
            )}
            {formatOk && taken && <p className="mt-2 text-xs text-red-600">This KRA PIN is already linked.</p>}

            <label className="mt-4 block text-sm font-semibold text-slate-800">
              TaxFlow password
              <div className="relative mt-2">
                <Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError("");
                  }}
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm font-normal outline-none focus:border-[#0B1B36]"
                />
              </div>
            </label>
            {passwordError ? (
              <p className="mt-2 text-xs text-red-600">{passwordError}</p>
            ) : (
              <p className="mt-2 text-xs text-slate-400">This is your TaxFlow password, not your KRA iTax password.</p>
            )}

            <label className="mt-5 flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span className="flex gap-2">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-slate-500" />
                I own this KRA PIN or am authorized to act on it, and I authorize TaxFlow to file returns for it, only for workflows I activate.
              </span>
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onClose}
                disabled={busy}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitDetails}
                disabled={!canContinue}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0B1B36] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy && <Loader2 size={15} className="animate-spin" />}
                {busy ? "Checking…" : "Continue"}
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => setStep("details")}
              disabled={busy}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft size={14} />
              Back
            </button>

            <div className="mt-4 flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              <Smartphone size={18} className="mt-0.5 shrink-0 text-slate-500" />
              <p>
                We sent a 6-digit code to <strong className="text-slate-800">{PHONE_HINT}</strong> to
                confirm {maskPin(pinUpper)}. The code expires in 5 minutes.
              </p>
            </div>

            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setCodeError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && submitCode()}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="······"
              aria-label="Verification code"
              className="mt-5 w-full rounded-lg border border-slate-200 px-3 py-3 text-center text-xl font-semibold tracking-[0.5em] outline-none focus:border-[#0B1B36]"
            />
            {codeError && <p className="mt-2 text-xs text-red-600">{codeError}</p>}

            <div className="mt-3 text-xs text-slate-500">
              {cooldown > 0 ? (
                <span>Didn't get it? You can request a new code in {cooldown}s.</span>
              ) : (
                <button onClick={resend} disabled={busy} className="font-semibold text-blue-700 hover:underline">
                  Send a new code
                </button>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onClose}
                disabled={busy}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitCode}
                disabled={code.length !== 6 || busy}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0B1B36] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy && <Loader2 size={15} className="animate-spin" />}
                {busy ? "Verifying…" : reauthPin ? "Verify and reconnect" : "Verify and link"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}