"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2, X, CheckCircle2, Circle, AlertCircle } from "lucide-react";

// Change these if your routes are named differently
const DASHBOARD_ROUTE = "/dashboard";
const LOGIN_ROUTE = "/login";

const XECOFLOW_PAY_BASE = process.env.NEXT_PUBLIC_XECOFLOW_PAY_URL || 'https://xecoflow-pay.onrender.com'

type TaxInfo = {
  kra_pin: string;
  obligation_status: "Active" | "Inactive";
  holder_full_name: string;
  obligations: string[];
};

const SERVICES = [
  { id: "nil_return", name: "Nil return", obligation: "income_tax", obligationName: "Income Tax" },
  { id: "income_tax_return", name: "Income tax return", obligation: "income_tax", obligationName: "Income Tax" },
  { id: "vat_return", name: "VAT return", obligation: "vat", obligationName: "VAT" },
  { id: "paye_return", name: "PAYE return", obligation: "paye", obligationName: "PAYE" },
  { id: "mri_return", name: "Monthly rental income return", obligation: "mri", obligationName: "Rental Income" },
  { id: "turnover_tax", name: "Turnover tax return", obligation: "turnover_tax", obligationName: "Turnover Tax" },
];

// Updated to match the clean, bordered look from the reference image
const fieldClass =
  "w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-[15px] text-slate-900 placeholder-slate-400 outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:bg-slate-50 disabled:text-slate-500";
const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

export default function SelfDeclarationPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const [fullName, setFullName] = useState(""); // Populated from DB on load
  const [idNumber, setIdNumber] = useState("");
  const [email, setEmail] = useState("");

  // New Fields
  const [dob, setDob] = useState("");
  const [taxpayerType, setTaxpayerType] = useState("KE");
  const [notificationChannel, setNotificationChannel] = useState("email");
  const [emergencyContact, setEmergencyContact] = useState("");

  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [taxInfo, setTaxInfo] = useState<TaxInfo | null>(null);

  const [county, setCounty] = useState("");
  const [subCounty, setSubCounty] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [poBox, setPoBox] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [phone, setPhone] = useState("");

  const [serviceId, setServiceId] = useState("");

  const [termsOpen, setTermsOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);

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
          if (u.full_name) setFullName(u.full_name); // Setting the DB full name here
        }
      } catch {
        /* stay on the page */
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
      // 1. Fetch KRA PIN and Taxpayer Name using ID
      const pinRes = await fetch(`${XECOFLOW_PAY_BASE}/v1/kratax/pin/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          taxpayerType, 
          taxpayerId: idNumber.trim(),
          turnstileToken: "bypass" // Assuming backend still expects this key
        }),
      });

      const pinData = await pinRes.json().catch(() => ({}));

      if (!pinRes.ok || !pinData.success) {
        throw new Error(pinData?.error?.message || "We couldn't verify that ID number. Please check and try again.");
      }

      const kraPin = pinData.data.kraPin;
      const kraTaxpayerName = pinData.data.taxpayerName;

      // 2. Compare against DB name (fullName state populated from /api/auth/me)
      const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normalizedKraName = normalize(kraTaxpayerName);
      const normalizedDbName = normalize(fullName);

      // Substring check to allow for middle names being added/removed slightly
      if (!normalizedKraName.includes(normalizedDbName) && !normalizedDbName.includes(normalizedKraName)) {
        throw new Error(`The name on your KRA record (${kraTaxpayerName}) does not match the name on your account (${fullName}). Please contact support.`);
      }

      // 3. Fetch Obligations in the background
      const obRes = await fetch(`${XECOFLOW_PAY_BASE}/v1/kratax/pin/obligations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          kraPin: kraPin,
          turnstileToken: "bypass"
        }),
      });

      const obData = await obRes.json().catch(() => ({}));

      if (!obRes.ok || !obData.success) {
        throw new Error(obData?.error?.message || "Could not fetch obligations for this PIN.");
      }

      // 4. Map the obligations to our internal service keys
      const rawObligations = obData.data.obligations || [];
      const mappedObligations = rawObligations.map((ob: any) => {
        const name = (ob.name || '').toLowerCase();
        if (name.includes('income tax')) return 'income_tax';
        if (name.includes('vat')) return 'vat';
        if (name.includes('paye')) return 'paye';
        if (name.includes('rental')) return 'mri';
        if (name.includes('turnover')) return 'turnover_tax';
        return ob.name;
      });

      // 5. Success - Update State
      setTaxInfo({
        kra_pin: kraPin,
        obligation_status: "Active", 
        holder_full_name: kraTaxpayerName,
        obligations: mappedObligations,
      });

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
    dob !== "" &&
    taxpayerType !== "" &&
    notificationChannel !== "" &&
    emergencyContact.trim() !== "" &&
    county.trim() !== "" &&
    subCounty.trim() !== "" &&
    buildingName.trim() !== "" &&
    poBox.trim() !== "" &&
    zipCode.trim() !== "" &&
    phone.replace(/\D/g, "").length >= 9;

  const selectedService = SERVICES.find((s) => s.id === serviceId) || null;
  const eligible =
    !!selectedService && !!taxInfo?.obligations.includes(selectedService.obligation);
  const notEligible = !!selectedService && !eligible;

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/profile/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          id_number: idNumber,
          email,
          date_of_birth: dob,
          taxpayer_type: taxpayerType,
          notification_channel: notificationChannel,
          emergency_contact: emergencyContact,
          county,
          sub_county: subCounty,
          building_name: buildingName,
          po_box: poBox,
          zip_code: zipCode,
          phone,
          service: serviceId,
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-slate-400" size={26} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      {/* Top Header Area */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold text-slate-900">Profile Setup</h1>
        </div>
      </div>

      {/* Steps Indicator Area */}
      <div className="bg-white border-b border-slate-200 px-6 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl flex">
          <div 
            className={`flex items-center gap-2 py-4 px-4 border-b-2 text-sm font-medium transition-colors ${
              step === 1 ? "border-green-500 text-green-700 bg-green-50" : "border-transparent text-slate-500"
            }`}
          >
            {step > 1 ? <CheckCircle2 size={18} className="text-green-500" /> : <Circle size={18} />}
            Personal Details
          </div>
          <div 
            className={`flex items-center gap-2 py-4 px-4 border-b-2 text-sm font-medium transition-colors ${
              step === 2 ? "border-green-500 text-green-700 bg-green-50" : "border-transparent text-slate-500"
            }`}
          >
            {done ? <CheckCircle2 size={18} className="text-green-500" /> : <Circle size={18} />}
            Tax Details
          </div>
        </div>
      </div>

      {/* Main Form Content */}
      <main className="mx-auto max-w-6xl px-6 py-10 sm:px-10 lg:px-16">
        <div className="bg-white border border-slate-200 p-6 sm:p-10 shadow-sm">
          
          {done ? (
            <div className="max-w-2xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700 mb-6">
                <Check size={24} />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Thanks, we've got your details.
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                Your application is now in the approval stage. Taxflow will review it and
                let you know as soon as it's approved.
              </p>
              <button
                onClick={() => router.replace(DASHBOARD_ROUTE)}
                className="mt-8 inline-flex items-center gap-2 rounded bg-green-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                Go to dashboard
                <ArrowRight size={16} />
              </button>
            </div>
          ) : step === 1 ? (
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-6">
                Profile Information
              </h2>

              <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
                
                {/* Full Name (Disabled input, sourced from DB) */}
                <div>
                  <label htmlFor="full_name" className={labelClass}>
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="full_name"
                    className={`${fieldClass} bg-slate-50 cursor-not-allowed`}
                    value={fullName}
                    readOnly
                    title="This name is linked to your account and cannot be changed."
                  />
                  <p className="mt-1 text-[11px] text-slate-500">From your account profile.</p>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className={labelClass}>
                    Email ID <span className="text-red-500">*</span>
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

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className={labelClass}>
                    Telephone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    className={fieldClass}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s]/g, ""))}
                    placeholder="0712 345 678"
                    autoComplete="tel"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label htmlFor="dob" className={labelClass}>
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="dob"
                    type="date"
                    className={fieldClass}
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                </div>

                {/* Taxpayer Type */}
                <div>
                  <label htmlFor="taxpayer_type" className={labelClass}>
                    Taxpayer Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="taxpayer_type"
                    className={`${fieldClass} cursor-pointer`}
                    value={taxpayerType}
                    onChange={(e) => setTaxpayerType(e.target.value)}
                  >
                    <option value="KE">Kenyan Citizen</option>
                    <option value="NKE">Kenyan Resident</option>
                    <option value="NKENR">Non-Resident</option>
                    <option value="COMP">Company</option>
                  </select>
                </div>

                {/* Preferred Notification Channel */}
                <div>
                  <label htmlFor="notification_channel" className={labelClass}>
                    Preferred Notification Channel <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="notification_channel"
                    className={`${fieldClass} cursor-pointer`}
                    value={notificationChannel}
                    onChange={(e) => setNotificationChannel(e.target.value)}
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>

                {/* Emergency Contact */}
                <div>
                  <label htmlFor="emergency_contact" className={labelClass}>
                    Emergency Contact <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="emergency_contact"
                    type="tel"
                    inputMode="tel"
                    className={fieldClass}
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value.replace(/[^\d+\s]/g, ""))}
                    placeholder="0712 345 678"
                  />
                </div>

                {/* ID Number & Verification */}
                <div className="md:col-span-2">
                  <label htmlFor="id_number" className={labelClass}>
                    ID Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        id="id_number"
                        inputMode="numeric"
                        className={fieldClass}
                        value={idNumber}
                        onChange={(e) => handleIdChange(e.target.value)}
                        placeholder="12345678"
                        disabled={verifying || verified}
                      />
                      {idNumber.length >= 7 && !verified && (
                        <button
                          type="button"
                          onClick={handleVerify}
                          disabled={verifying}
                          className={`shrink-0 rounded px-6 py-2.5 text-sm font-semibold transition ${
                            verifying
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                              : "bg-[#0a2540] text-white hover:bg-[#112d4e] shadow-sm"
                          }`}
                        >
                          {verifying ? <Loader2 size={16} className="animate-spin" /> : "Verify"}
                        </button>
                      )}
                      {verified && (
                        <div className="shrink-0 inline-flex items-center gap-1.5 rounded bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 border border-green-200">
                          <CheckCircle2 size={16} /> Verified
                        </div>
                      )}
                    </div>
                    
                    {verifyError ? (
                      <p className="text-sm text-red-600 flex items-center gap-1.5 bg-red-50 p-2 rounded border border-red-200">
                        <AlertCircle size={14}/> {verifyError}
                      </p>
                    ) : !verified && idNumber.length < 7 ? (
                      <p className="text-xs text-slate-500">Enter your ID number to verify.</p>
                    ) : null}
                  </div>
                </div>

                {/* County */}
                <div>
                  <label htmlFor="county" className={labelClass}>
                    County <span className="text-red-500">*</span>
                  </label>
                  <input 
                    id="county" 
                    className={fieldClass} 
                    value={county}
                    onChange={(e) => setCounty(e.target.value)} 
                    placeholder="Nairobi" 
                  />
                </div>

                {/* Sub-county */}
                <div>
                  <label htmlFor="sub_county" className={labelClass}>
                    Sub-county <span className="text-red-500">*</span>
                  </label>
                  <input 
                    id="sub_county" 
                    className={fieldClass} 
                    value={subCounty}
                    onChange={(e) => setSubCounty(e.target.value)} 
                    placeholder="Westlands" 
                  />
                </div>

                {/* Building Name */}
                <div>
                  <label htmlFor="building_name" className={labelClass}>
                    Building Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    id="building_name" 
                    className={fieldClass} 
                    value={buildingName}
                    onChange={(e) => setBuildingName(e.target.value)} 
                    placeholder="e.g. Rift Plaza" 
                  />
                </div>

                {/* P.O. Box */}
                <div>
                  <label htmlFor="po_box" className={labelClass}>
                    P.O. Box <span className="text-red-500">*</span>
                  </label>
                  <input 
                    id="po_box" 
                    className={fieldClass} 
                    value={poBox}
                    onChange={(e) => setPoBox(e.target.value)} 
                    placeholder="12345" 
                  />
                </div>

                {/* Zip Code */}
                <div>
                  <label htmlFor="zip_code" className={labelClass}>
                    Zip Code <span className="text-red-500">*</span>
                  </label>
                  <input 
                    id="zip_code" 
                    className={fieldClass} 
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)} 
                    placeholder="00100" 
                  />
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                <p className="text-sm text-slate-500">
                  {!verified
                    ? "Please verify your ID number to proceed."
                    : !step1Ready
                    ? "Please fill in all required fields."
                    : ""}
                </p>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!step1Ready}
                  className="inline-flex items-center gap-2 rounded bg-green-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  CONTINUE
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-900 disabled:opacity-50"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
                <h2 className="text-xl font-semibold text-slate-900">
                  Your Tax Details
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {/* Left Column - Read Only Data */}
                <div>
                  <p className="text-sm text-slate-500 mb-4">
                    These details are pulled directly from KRA and cannot be changed here.
                  </p>
                  <dl className="divide-y divide-slate-200 border border-slate-200 rounded bg-slate-50">
                    <Row label="ID Number" value={idNumber} />
                    <Row label="KRA PIN" value={taxInfo?.kra_pin || "—"} />
                    <Row label="PIN Holder" value={taxInfo?.holder_full_name || "—"} />
                    <div className="flex items-center justify-between px-4 py-3">
                      <dt className="text-sm font-medium text-slate-600">Obligation Status</dt>
                      <dd
                        className={`flex items-center gap-2 text-sm font-semibold ${
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
                </div>

                {/* Right Column - Form Input */}
                <div className="space-y-6">
                  <div>
                    <label htmlFor="service" className={labelClass}>
                      Service you want to automate <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="service"
                      value={serviceId}
                      onChange={(e) => setServiceId(e.target.value)}
                      className={`${fieldClass} cursor-pointer`}
                    >
                      <option value="">Choose a service</option>
                      {SERVICES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>

                    {notEligible && selectedService && (
                      <div className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm leading-relaxed text-red-700">
                        This PIN may not be eligible for {selectedService.name.toLowerCase()}.
                        It isn't registered for the {selectedService.obligationName} obligation.
                        Pick another service, or check your obligations on iTax.
                      </div>
                    )}
                    {eligible && selectedService && (
                      <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
                        <Check size={16} /> Your PIN is eligible for this service.
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <label className="flex cursor-pointer items-start gap-3 text-[15px] leading-relaxed text-slate-600">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-green-600 focus:ring-green-500"
                      />
                      <span>
                        I have read and agree to the{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setTermsOpen(true);
                          }}
                          className="font-semibold text-green-700 underline underline-offset-4 hover:text-green-800"
                        >
                          terms and conditions
                        </button>
                        .
                      </span>
                    </label>
                  </div>

                  {submitError && <p className="text-sm text-red-600">{submitError}</p>}

                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!eligible || !termsAccepted || submitting}
                      className="inline-flex items-center gap-2 rounded bg-green-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting && <Loader2 size={16} className="animate-spin" />}
                      {submitting ? "SUBMITTING…" : "CONTINUE"}
                      {!submitting && <ArrowRight size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Terms Modal */}
      {termsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-lg bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-slate-900">
                Terms and conditions
              </h2>
              <button
                onClick={() => setTermsOpen(false)}
                aria-label="Close"
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

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
                className="rounded bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  setTermsAccepted(true);
                  setTermsOpen(false);
                }}
                className="rounded bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
              >
                I AGREE
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
    <div className="flex items-center justify-between px-4 py-3">
      <dt className="text-sm font-medium text-slate-600">{label}</dt>
      <dd className="text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}