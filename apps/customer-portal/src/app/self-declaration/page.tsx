"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Figtree, Newsreader } from "next/font/google";
import { ArrowLeft, ArrowRight, Check, Loader2, X } from "lucide-react";

const heading = Newsreader({ subsets: ["latin"], weight: ["400", "500", "600"] });
const body = Figtree({ subsets: ["latin"], weight: ["400", "500", "600"] });

// Change these if your routes are named differently
const DASHBOARD_ROUTE = "/dashboard";
const LOGIN_ROUTE = "/login";

type TaxInfo = {
  kra_pin: string;
  obligation_status: "Active" | "Inactive";
  holder_full_name: string;
};

// Flat, underline-style fields: no boxes, no cards
const fieldClass =
  "w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2.5 text-[15px] text-slate-900 placeholder-slate-400 outline-none transition focus:border-[#0B1B36] focus:ring-0 disabled:text-slate-500";
const labelClass = "block text-sm text-slate-500";

export default function SelfDeclarationPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [email, setEmail] = useState("");

  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [taxInfo, setTaxInfo] = useState<TaxInfo | null>(null);

  const [county, setCounty] = useState("");
  const [subCounty, setSubCounty] = useState("");
  const [poBox, setPoBox] = useState("");
  const [zipCode, setZipCode] = useState("");

  const [termsOpen, setTermsOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);

  // Make sure the user is signed in and still needs to complete the profile
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.status === 401) {
          router.replace(LOGIN_ROUTE);
          return;
        }
        const json = await res.json();
        const u = json?.data;
        if (u) {
          if (u.profile_status === "pending_approval" || u.profile_status === "approved") {
            router.replace(DASHBOARD_ROUTE);
            return;
          }
          if (u.email) setEmail(u.email);
          if (u.full_name) setFullName(u.full_name);
        }
      } catch {
        /* stay on the page; submit will surface any real problem */
      } finally {
        setReady(true);
      }
    })();
  }, [router]);

  function handleIdChange(v: string) {
    setIdNumber(v.replace(/\D/g, "").slice(0, 10));
    setVerified(false);
    setTaxInfo(null);
    setVerifyError("");
  }

  async function handleVerify() {
    setVerifying(true);
    setVerifyError("");
    try {
      // TODO: connect to your KRA / ID lookup.
      // Expected: { success: true, data: { full_name, kra_pin, obligation_status, holder_full_name } }
      const res = await fetch("/api/kra/verify-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_number: idNumber }),
      });
      const json = await res.json();
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json?.message || "We couldn't find tax details for that ID number.");
      }
      const d = json.data;
      setTaxInfo({
        kra_pin: d.kra_pin,
        obligation_status: d.obligation_status,
        holder_full_name: d.holder_full_name || d.full_name,
      });
      if (d.full_name && !fullName.trim()) setFullName(d.full_name);
      setVerified(true);
    } catch (e: any) {
      setVerifyError(e?.message || "Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  const step1Ready =
    verified &&
    fullName.trim() !== "" &&
    /^\S+@\S+\.\S+$/.test(email) &&
    county.trim() !== "" &&
    subCounty.trim() !== "" &&
    poBox.trim() !== "" &&
    zipCode.trim() !== "";

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      // TODO: backend should set profile_status = "pending_approval"
      const res = await fetch("/api/profile/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          id_number: idNumber,
          email,
          county,
          sub_county: subCounty,
          po_box: poBox,
          zip_code: zipCode,
          terms_accepted: true,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.message || "We couldn't submit your profile.");
      }
      setDone(true);
    } catch (e: any) {
      setSubmitError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="animate-spin text-slate-300" size={26} />
      </div>
    );
  }

  return (
    <div className={`${body.className} min-h-screen bg-white text-slate-800 lg:flex`}>
      {/* Left rail */}
      <aside className="bg-[#0B1B36] px-6 py-6 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[340px] lg:shrink-0 lg:flex-col lg:justify-between lg:px-10 lg:py-12">
        <div>
          <p className={`${heading.className} text-2xl font-semibold`}>
            Taxflow<span className="text-blue-400">.</span>
          </p>

          <div className="mt-8 hidden lg:block">
            <h1 className={`${heading.className} text-[34px] font-medium leading-tight`}>
              Let's get your tax profile set up.
            </h1>
            <p className="mt-4 max-w-[26ch] text-[15px] leading-relaxed text-slate-300">
              Give us your ID number and we'll pull your tax details from KRA, so there's
              nothing to look up.
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-6 text-sm lg:mt-0 lg:block lg:space-y-3">
          <p className={step === 1 ? "font-semibold text-white" : "text-slate-400"}>
            1. About you
          </p>
          <p className={step === 2 ? "font-semibold text-white" : "text-slate-400"}>
            2. Tax details
          </p>
        </div>
      </aside>

      {/* Form */}
      <main className="flex-1 px-6 py-10 sm:px-12 lg:px-20 lg:py-16">
        <div className="mx-auto max-w-xl">
          {done ? (
            <div className="pt-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-green-700">
                <Check size={22} />
              </div>
              <h2 className={`${heading.className} mt-6 text-3xl font-medium text-slate-900`}>
                Thanks, we've got your details.
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                Your application is now in the approval stage. Taxflow will review it and
                let you know as soon as it's approved.
              </p>
              <button
                onClick={() => router.replace(DASHBOARD_ROUTE)}
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#0B1B36] px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Go to dashboard
                <ArrowRight size={16} />
              </button>
            </div>
          ) : step === 1 ? (
            <div>
              <h2 className={`${heading.className} text-3xl font-medium text-slate-900`}>
                First, tell us about you
              </h2>

              <div className="mt-10 space-y-8">
                <div>
                  <label htmlFor="full_name" className={labelClass}>
                    Full name
                  </label>
                  <input
                    id="full_name"
                    className={fieldClass}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="As it appears on your ID"
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label htmlFor="id_number" className={labelClass}>
                    ID number
                  </label>
                  <div className="flex items-end gap-4">
                    <input
                      id="id_number"
                      inputMode="numeric"
                      className={fieldClass}
                      value={idNumber}
                      onChange={(e) => handleIdChange(e.target.value)}
                      placeholder="12345678"
                    />
                    {idNumber.length >= 7 && (
                      <button
                        type="button"
                        onClick={handleVerify}
                        disabled={verifying || verified}
                        className={`mb-2 shrink-0 text-sm font-semibold ${
                          verified
                            ? "inline-flex items-center gap-1 text-green-700"
                            : "text-blue-700 underline underline-offset-4 hover:text-blue-900 disabled:opacity-60"
                        }`}
                      >
                        {verifying ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Loader2 size={14} className="animate-spin" /> Checking…
                          </span>
                        ) : verified ? (
                          <>
                            <Check size={15} /> Verified
                          </>
                        ) : (
                          "Verify"
                        )}
                      </button>
                    )}
                  </div>
                  {verifyError ? (
                    <p className="mt-2 text-sm text-red-600">{verifyError}</p>
                  ) : !verified ? (
                    <p className="mt-2 text-sm text-slate-400">
                      You'll need to verify your ID before you can continue.
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="email" className={labelClass}>
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={fieldClass}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <h3 className={`${heading.className} mt-14 text-2xl font-medium text-slate-900`}>
                Where do you live?
              </h3>

              <div className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2">
                <div>
                  <label htmlFor="county" className={labelClass}>County</label>
                  <input id="county" className={fieldClass} value={county}
                    onChange={(e) => setCounty(e.target.value)} placeholder="Nairobi" />
                </div>
                <div>
                  <label htmlFor="sub_county" className={labelClass}>Sub-county</label>
                  <input id="sub_county" className={fieldClass} value={subCounty}
                    onChange={(e) => setSubCounty(e.target.value)} placeholder="Westlands" />
                </div>
                <div>
                  <label htmlFor="po_box" className={labelClass}>P.O. Box</label>
                  <input id="po_box" className={fieldClass} value={poBox}
                    onChange={(e) => setPoBox(e.target.value)} placeholder="12345" />
                </div>
                <div>
                  <label htmlFor="zip_code" className={labelClass}>Zip code</label>
                  <input id="zip_code" className={fieldClass} value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)} placeholder="00100" />
                </div>
              </div>

              <div className="mt-12 flex items-center justify-between gap-4">
                <p className="text-sm text-slate-400">
                  {!verified
                    ? "Verify your ID to move on."
                    : !step1Ready
                    ? "A few fields are still empty."
                    : ""}
                </p>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!step1Ready}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0B1B36] px-7 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Next
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className={`${heading.className} text-3xl font-medium text-slate-900`}>
                Here's what we found
              </h2>
              <p className="mt-3 text-[15px] text-slate-500">
                These details came straight from KRA using your ID number, so you can't
                change them here.
              </p>

              <dl className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
                <Row label="ID number" value={idNumber} />
                <Row label="KRA PIN" value={taxInfo?.kra_pin || "—"} />
                <Row label="PIN holder" value={taxInfo?.holder_full_name || "—"} />
                <div className="flex items-center justify-between py-4">
                  <dt className="text-sm text-slate-500">Obligation</dt>
                  <dd
                    className={`flex items-center gap-2 text-[15px] font-semibold ${
                      taxInfo?.obligation_status === "Active"
                        ? "text-green-700"
                        : "text-red-600"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        taxInfo?.obligation_status === "Active"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    />
                    {taxInfo?.obligation_status || "—"}
                  </dd>
                </div>
              </dl>

              <div className="mt-10">
                <p className="text-[15px] text-slate-600">
                  Before you submit, please read our{" "}
                  <button
                    type="button"
                    onClick={() => setTermsOpen(true)}
                    className="font-semibold text-blue-700 underline underline-offset-4 hover:text-blue-900"
                  >
                    terms and conditions
                  </button>
                  .
                </p>
                {termsAccepted && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
                    <Check size={15} /> You've accepted the terms.
                  </p>
                )}
              </div>

              {submitError && <p className="mt-6 text-sm text-red-600">{submitError}</p>}

              <div className="mt-10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900 disabled:opacity-50"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!termsAccepted || submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-7 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {submitting ? "Submitting…" : "Submit"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {termsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="flex max-h-[85vh] w-full max-w-lg flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 pt-6">
              <h2 className={`${heading.className} text-2xl font-medium text-slate-900`}>
                Terms and conditions
              </h2>
              <button
                onClick={() => setTermsOpen(false)}
                aria-label="Close"
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* TODO: replace with your real legal text */}
            <div className="space-y-4 overflow-y-auto px-6 py-5 text-[15px] leading-relaxed text-slate-600">
              <p>
                By submitting this profile, you confirm that the details you gave are
                accurate and belong to you.
              </p>
              <p>
                You allow Taxflow to get your tax information from the Kenya Revenue
                Authority using your ID number, and to use it to set up and run tax
                automations for you.
              </p>
              <p>
                We store your data securely. We don't share it with anyone except where
                we need to in order to complete your filings, or where the law requires it.
              </p>
              <p>
                Taxflow may approve or reject your profile after review. Giving false
                information can lead to your account being suspended.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setTermsOpen(false)}
                className="px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setTermsAccepted(true);
                  setTermsOpen(false);
                }}
                className="rounded-lg bg-[#0B1B36] px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                I agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-4">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-[15px] font-semibold text-slate-900">{value}</dd>
    </div>
  );
}