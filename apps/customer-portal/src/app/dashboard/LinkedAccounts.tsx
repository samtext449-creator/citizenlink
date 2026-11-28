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
  User,
  X,
  Briefcase,
  Check,
} from "lucide-react";

// --------------------------------------------------
// Types
// --------------------------------------------------

type AcctStatus = "connected" | "attention";

type Account = {
  id: string;
  pin: string;
  name: string;
  type: "Individual" | "Company";
  status: AcctStatus;
  lastVerified: string;
  note?: string;
  obligations: string[];
};

type AvailableKraAccount = {
  kra_pin: string;
  taxpayer_name: string;
  taxpayer_type: "Individual" | "Company";
  obligations: string[];
};

const STATUS_META: Record<AcctStatus, { label: string; cls: string }> = {
  connected: { label: "Connected", cls: "bg-emerald-50 text-emerald-700" },
  attention: { label: "Re-authentication needed", cls: "bg-amber-100 text-amber-700" },
};

const maskPin = (pin: string) => `${pin.slice(0, 3)}•••••••${pin.slice(-1)}`;
const today = () =>
  new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

// --------------------------------------------------
// Page
// --------------------------------------------------

export default function LinkedAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [dialog, setDialog] = useState(false);
  const [unlinkPin, setUnlinkPin] = useState<string | null>(null);
  const [verifyingPin, setVerifyingPin] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch linked accounts on mount
  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await fetch("/api/taxflow/linked-accounts", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setAccounts(data.accounts || []);
        }
      } catch (err) {
        console.error("Failed to load linked accounts:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAccounts();
  }, []);

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

  function handleLinkSuccess(newAccount: Account) {
    setAccounts((prev) => [...prev, newAccount]);
    setDialog(false);
    setNotice(`${maskPin(newAccount.pin)} was linked successfully.`);
  }

  async function unlink(pin: string) {
    try {
      await fetch("/api/taxflow/linked-accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kra_pin: pin }),
      });
      setAccounts((prev) => prev.filter((a) => a.pin !== pin));
      setUnlinkPin(null);
      setNotice(`${maskPin(pin)} was unlinked.`);
    } catch {
      setNotice("Failed to unlink account. Please try again.");
    }
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
            Connect your KRA accounts so Taxflow can file on your behalf.
          </p>
        </div>
        <button
          onClick={() => setDialog(true)}
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
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
      ) : accounts.length === 0 ? (
        <section className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="rounded-2xl bg-blue-50 p-4 text-blue-700">
            <Link2 size={28} />
          </div>
          <p className="mt-4 font-semibold text-slate-800">No KRA accounts linked</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Link a KRA account to start automating your filings.
          </p>
          <button
            onClick={() => setDialog(true)}
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
                    <dt className="text-slate-400">Obligations</dt>
                    <dd className="mt-1 font-semibold text-slate-700 truncate">{a.obligations.join(", ") || "None"}</dd>
                  </div>
                </dl>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                  {a.status === "attention" ? (
                    <button
                      onClick={() => { /* Trigger reauth logic if needed */ }}
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

      {/* LINK DIALOG */}
      {dialog && (
        <LinkWizard
          onClose={() => setDialog(false)}
          onSuccess={handleLinkSuccess}
          existingPins={accounts.map((a) => a.pin)}
        />
      )}

      {/* Unlink confirmation */}
      {unlinking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              Unlink {maskPin(unlinking.pin)}?
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>Your workflows using this PIN will pause.</li>
              <li>Your documents and submission history stay available.</li>
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
// Link Wizard (3 Steps)
// --------------------------------------------------

function LinkWizard({
  onClose,
  onSuccess,
  existingPins,
}: {
  onClose: () => void;
  onSuccess: (account: Account) => void;
  existingPins: string[];
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // Step 1: Auth State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Step 2: PIN Selection State
  const [availableAccounts, setAvailableAccounts] = useState<AvailableKraAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AvailableKraAccount | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState("");

  // Step 1: Verify Taxflow Identity
  async function handleVerifyIdentity(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setIsVerifying(true);

    try {
      const res = await fetch("/api/taxflow/verify-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid email or password.");
      }

      // Fetch the available KRA accounts for this verified user
      const accountsRes = await fetch(`/api/taxflow/available-kra-pins?merchant_id=${data.merchant_id}`);
      const accountsData = await accountsRes.json();

      if (!accountsRes.ok) {
        throw new Error("Could not fetch available KRA accounts.");
      }

      // Filter out ones already linked
      const newAccounts = (accountsData.accounts || []).filter(
        (acc: AvailableKraAccount) => !existingPins.includes(acc.kra_pin)
      );

      if (newAccounts.length === 0) {
        throw new Error("No new KRA PINs found for this account. You may have already linked them all.");
      }

      setAvailableAccounts(newAccounts);
      setStep(2);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsVerifying(false);
    }
  }

  // Step 2: Link Selected PIN
  async function handleLinkAccount() {
    if (!selectedAccount) return;
    setLinkError("");
    setIsLinking(true);

    try {
      const res = await fetch("/api/taxflow/link-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kra_pin: selectedAccount.kra_pin,
          taxpayer_name: selectedAccount.taxpayer_name,
          taxpayer_type: selectedAccount.taxpayer_type,
          obligations: selectedAccount.obligations,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to link account.");
      }

      onSuccess({
        id: data.id || Math.random().toString(),
        pin: selectedAccount.kra_pin,
        name: selectedAccount.taxpayer_name,
        type: selectedAccount.taxpayer_type,
        status: "connected",
        lastVerified: today(),
        obligations: selectedAccount.obligations,
      });
      setStep(3);
    } catch (err: any) {
      setLinkError(err.message);
    } finally {
      setIsLinking(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
        >
          <X size={18} />
        </button>

        {/* STEP 1: Verify Identity */}
        {step === 1 && (
          <form onSubmit={handleVerifyIdentity}>
            <h3 className="text-lg font-bold text-slate-900">Verify your identity</h3>
            <p className="mt-1 text-sm text-slate-500">
              Enter your Taxflow email and password to view your available KRA accounts.
            </p>

            <div className="mt-5 space-y-4">
              <label className="block text-sm font-semibold text-slate-800">
                Email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#0B1B36]"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-800">
                Password
                <div className="relative mt-1.5">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#0B1B36]"
                  />
                </div>
              </label>
            </div>

            {authError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle size={16} /> {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying || !email || !password}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B1B36] py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {isVerifying && <Loader2 size={16} className="animate-spin" />}
              {isVerifying ? "Verifying…" : "Continue"}
            </button>
          </form>
        )}

        {/* STEP 2: Select KRA Account */}
        {step === 2 && (
          <div>
            <h3 className="text-lg font-bold text-slate-900">Select a KRA account</h3>
            <p className="mt-1 text-sm text-slate-500">
              We found these KRA accounts associated with your Taxflow profile. Choose one to link.
            </p>

            <div className="mt-5 space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {availableAccounts.map((acc) => (
                <button
                  key={acc.kra_pin}
                  onClick={() => setSelectedAccount(acc)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                    selectedAccount?.kra_pin === acc.kra_pin
                      ? "border-[#0B1B36] bg-slate-50 ring-1 ring-[#0B1B36]"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className={`mt-0.5 rounded-full p-1 ${selectedAccount?.kra_pin === acc.kra_pin ? "bg-[#0B1B36] text-white" : "border border-slate-300 text-transparent"}`}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{acc.taxpayer_name}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{acc.kra_pin}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {acc.obligations.map((ob, i) => (
                        <span key={i} className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 uppercase tracking-wide">
                          {ob}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {linkError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle size={16} /> {linkError}
              </div>
            )}

            <div className="mt-6 flex justify-between gap-3">
              <button
                onClick={() => setStep(1)}
                disabled={isLinking}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleLinkAccount}
                disabled={!selectedAccount || isLinking}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#0B1B36] py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {isLinking && <Loader2 size={16} className="animate-spin" />}
                {isLinking ? "Linking…" : "Link Account"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Success */}
        {step === 3 && (
          <div className="text-center py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">Account Linked Successfully</h3>
            <p className="mt-1 text-sm text-slate-500">
              You can now create workflows for this KRA PIN.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-lg bg-[#0B1B36] py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Done
            </button>
          </div>
        )}

      </div>
    </div>
  );
}