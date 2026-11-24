"use client";

import { useState, useEffect } from "react";
import {
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Landmark,
  Mail,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  Smartphone,
  Workflow as WorkflowIcon,
  X,
  AlertCircle,
  User,
  Building,
  Loader2,
  CreditCard
} from "lucide-react";

// --------------------------------------------------
// Types and sample data
// --------------------------------------------------

type WfStatus = "active" | "draft" | "attention";
type Tab = "all" | "active" | "drafts" | "templates";

type WorkflowItem = {
  id: string;
  templateId: string;
  name: string;
  pin: string | null;
  frequency: string;
  status: WfStatus;
  note?: string;
  lastRun: string;
  nextRun: string;
};

const TEMPLATES = [
  { id: "nil", name: "Automate Nil Returns", description: "Automate monthly nil return filing for taxpayers with no income to declare.", service: "Nil Returns", price: 200, serviceStatus: "active", schedule: "Monthly · due by the 20th", integrations: ["itax", "email"], obligation: "Nil Returns" },
  { id: "tot", name: "Automate Turnover Tax", description: "Manage turnover tax filing for eligible small businesses.", service: "Turnover Tax", price: 300, serviceStatus: "available", schedule: "Monthly · due by the 20th", integrations: ["sheets", "itax"], obligation: "Turnover Tax" },
  { id: "paye", name: "Automate PAYE", description: "Automate PAYE returns for your employees.", service: "PAYE", price: 400, serviceStatus: "expired", schedule: "Monthly · due by the 9th", integrations: ["sheets", "itax"], obligation: "PAYE" },
  { id: "vat", name: "Automate VAT", description: "Prepare and submit VAT returns on schedule.", service: "VAT", price: 600, serviceStatus: "available", schedule: "Monthly · due by the 20th", integrations: ["sheets", "itax"], obligation: "VAT" },
  { id: "itr", name: "Automate Income Tax", description: "File your annual Individual Income Tax return.", service: "Income Tax", price: 250, serviceStatus: "available", schedule: "Annual · due by 30 June", integrations: ["docs", "itax"], obligation: "Income Tax" },
  { id: "mri", name: "Automate Rental Income", description: "File Monthly Rental Income tax for your properties.", service: "Rental Income", price: 250, serviceStatus: "available", schedule: "Monthly · due by the 20th", integrations: ["sheets", "itax"], obligation: "Rental Income" },
  { id: "wht", name: "Automate Withholding Tax", description: "Compute and file Withholding Tax on payments to suppliers.", service: "Withholding Tax", price: 350, serviceStatus: "available", schedule: "Monthly · due by the 20th", integrations: ["sheets", "itax"], obligation: "Withholding Tax" },
  { id: "cit", name: "Automate Corporation Tax", description: "Manage Corporation Tax instalments for your company.", service: "Corporation Tax", price: 700, serviceStatus: "available", schedule: "Quarterly instalments · due on the 20th", integrations: ["sheets", "itax"], obligation: "Corporation Tax" },
];

const INTEGRATIONS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  itax: { label: "KRA iTax", icon: Landmark, color: "text-blue-700" },
  email: { label: "Email", icon: Mail, color: "text-slate-600" },
  docs: { label: "Documents", icon: FileText, color: "text-sky-600" },
  drive: { label: "Drive", icon: FolderOpen, color: "text-amber-600" },
  sheets: { label: "Sheets", icon: FileSpreadsheet, color: "text-green-600" },
  mpesa: { label: "M-Pesa", icon: Smartphone, color: "text-green-700" },
  sms: { label: "SMS", icon: MessageSquare, color: "text-indigo-600" },
  calendar: { label: "Reminders", icon: CalendarClock, color: "text-rose-600" },
};

const GALLERY = [
  { id: "g1", templateId: "nil", title: "File monthly Nil Returns on KRA iTax and email you the acknowledgement receipt", integrations: ["itax", "email", "docs", "calendar"] },
  { id: "g3", templateId: "tot", title: "Calculate Turnover Tax from your monthly sales and file it on KRA iTax", integrations: ["sheets", "itax", "docs", "email"] },
  { id: "g5", templateId: "paye", title: "Prepare PAYE returns from your payroll sheet and file them on KRA iTax", integrations: ["sheets", "itax", "docs", "email", "calendar"] },
  { id: "g7", templateId: "vat", title: "Prepare VAT returns from your sales and purchase records and submit to KRA", integrations: ["sheets", "itax", "docs", "email", "drive", "calendar"] },
  { id: "g9", templateId: "itr", title: "Gather your income documents and file your annual Individual Income Tax return on KRA iTax", integrations: ["docs", "itax", "drive", "email", "calendar"] },
  { id: "g11", templateId: "mri", title: "Calculate Monthly Rental Income tax from your rent records and file it on KRA iTax", integrations: ["sheets", "itax", "docs", "email"] },
  { id: "g13", templateId: "wht", title: "Compute Withholding Tax on supplier payments and file it on KRA iTax", integrations: ["sheets", "itax", "docs", "email", "calendar"] },
  { id: "g15", templateId: "cit", title: "Calculate quarterly Corporation Tax instalments and file them on KRA iTax", integrations: ["sheets", "itax", "docs", "email", "calendar"] },
];

// Mock data array removed as requested
const initialWorkflows: WorkflowItem[] = [];

const statusMeta: Record<WfStatus, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-emerald-50 text-emerald-700" },
  draft: { label: "Setup required", cls: "bg-amber-100 text-amber-700" },
  attention: { label: "Needs attention", cls: "bg-red-50 text-red-700" },
};

const PIN_FORMAT = /^[AP]\d{9}[A-Z]$/;
const maskPin = (pin: string) => `${pin.slice(0, 3)}•••••••${pin.slice(-1)}`;
const money = (n: number) => `KSh ${n.toLocaleString("en-KE")}`;

// --------------------------------------------------
// Main Component
// --------------------------------------------------

export default function WorkflowsPage({ onGoToPricing }: { onGoToPricing?: () => void }) {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>(initialWorkflows);
  const [tab, setTab] = useState<Tab>("templates");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate page refresh loading for all cards
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); 
    return () => clearTimeout(timer);
  }, []);

  // Page state: 'list' or 'setup'
  const [view, setView] = useState<"list" | "setup">("list");
  const [setupData, setSetupData] = useState<{ templateId: string; editingId?: string } | null>(null);

  // ---- Actions ----
  function startSetup(templateId: string, wf?: WorkflowItem) {
    setSetupData({ templateId, editingId: wf?.id });
    setView("setup");
  }

  function handleSaveSetup(status: WfStatus, formData: any) {
    const tpl = TEMPLATES.find((t) => t.id === setupData?.templateId)!;
    const item: WorkflowItem = {
      id: setupData?.editingId ?? `w${Date.now()}`,
      templateId: tpl.id,
      name: tpl.name,
      pin: formData.pin,
      frequency: "Monthly",
      status,
      note: status === "draft" ? "Review and activate to start filing." : undefined,
      lastRun: "Not run yet",
      nextRun: status === "active" ? "20 Dec 2026" : "Not scheduled",
    };

    setWorkflows((prev) =>
      setupData?.editingId ? prev.map((w) => (w.id === setupData.editingId ? item : w)) : [...prev, item]
    );
    setView("list");
    setSetupData(null);
    setTab(status === "active" ? "active" : "drafts");
    setNotice(status === "active" ? `${item.name} is now active.` : `${item.name} saved as a draft.`);
  }

  // --------------------------------------------------
  // Render: Setup View
  // --------------------------------------------------
  if (view === "setup" && setupData) {
    return (
      <WorkflowSetup 
        templateId={setupData.templateId}
        editingWorkflow={workflows.find(w => w.id === setupData.editingId)}
        existingWorkflows={workflows}
        onCancel={() => { setView("list"); setSetupData(null); }}
        onSave={handleSaveSetup}
      />
    );
  }

  // --------------------------------------------------
  // Render: List View
  // --------------------------------------------------
  const visible = workflows.filter((w) =>
    tab === "active" ? w.status === "active" : tab === "drafts" ? w.status === "draft" : true
  );

  const gallery = GALLERY.filter(
    (g) => (category === "all" || g.templateId === category) && g.title.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="space-y-8 rounded-2xl bg-[#F7F9F8]">
      {/* Intro */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Workflows</h1>
          <p className="mt-2 text-sm text-slate-500">Create and manage your tax automations.</p>
        </div>
        <button onClick={() => setTab("templates")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1B36] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
          <Plus size={18} /> Create workflow
        </button>
      </section>

      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span className="flex items-center gap-2"><CheckCircle2 size={17} />{notice}</span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss"><X size={16} /></button>
        </div>
      )}

      {/* Tabs */}
      <section>
        <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
          {([["templates", "Templates"], ["all", "All workflows"], ["active", "Active"], ["drafts", "Drafts"]] as [Tab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${tab === id ? "border-[#0B1B36] text-[#0B1B36]" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Workflows List */}
        {tab !== "templates" && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {visible.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-semibold text-slate-800">No workflows here yet</p>
                <p className="mt-1 text-sm text-slate-500">Start from a template to create your first automation.</p>
                <button onClick={() => setTab("templates")} className="mt-4 rounded-lg bg-[#0B1B36] px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Browse templates</button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {visible.map((w) => {
                  const meta = statusMeta[w.status];
                  return (
                    <div key={w.id} className="flex flex-col gap-4 p-5 transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-700"><WorkflowIcon size={20} /></div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{w.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{w.pin ? `KRA PIN: ${maskPin(w.pin)}` : "KRA account not linked"} · {w.frequency}</p>
                          {w.note && <p className={`mt-1 text-xs ${w.status === "attention" ? "text-red-600" : "text-amber-700"}`}>{w.note}</p>}
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400"><Clock3 size={12} /> Last run: {w.lastRun} · Next run: {w.nextRun}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${meta.cls}`}>{meta.label}</span>
                        {w.status === "active" && <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white">Manage</button>}
                        {w.status === "draft" && <button onClick={() => startSetup(w.templateId, w)} className="rounded-lg bg-[#0B1B36] px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">Continue setup</button>}
                        {w.status === "attention" && <button onClick={onGoToPricing} className="rounded-lg bg-[#0B1B36] px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">Renew service</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Templates */}
        {tab === "templates" && (
          <div className="mt-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative lg:w-80">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search templates" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#0B1B36]" />
              </div>
              <div className="flex flex-wrap gap-2">
                {[{ id: "all", name: "All" }, ...TEMPLATES].map((c) => (
                  <button key={c.id} onClick={() => setCategory(c.id)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${category === c.id ? "bg-[#0B1B36] text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>{c.name}</button>
                ))}
              </div>
            </div>

            {gallery.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No templates match your search.</div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {gallery.map((g) => {
                  const svc = TEMPLATES.find((t) => t.id === g.templateId)!;
                  const shown = g.integrations.slice(0, 3);
                  const extra = g.integrations.length - shown.length;

                  if (isLoading) {
                    return (
                      <div key={g.id} className="flex flex-col overflow-hidden rounded-lg bg-[#EEEEEE]">
                        <div className="flex flex-1 flex-col p-5 animate-pulse">
                          <div className="flex items-start justify-between gap-2">
                            <div className="h-6 w-3/4 rounded bg-slate-300"></div>
                          </div>
                          <div className="mt-3 h-4 w-full rounded bg-slate-300"></div>
                          <div className="mt-1.5 h-4 w-5/6 rounded bg-slate-300"></div>
                          <div className="mt-4 h-3 w-1/2 rounded bg-slate-300"></div>
                          <div className="mt-2 h-3 w-2/3 rounded bg-slate-300"></div>
                        </div>
                        <div className="border-t border-black/5 p-5">
                          <div className="h-4 w-1/3 rounded bg-slate-300 animate-pulse"></div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={g.id} className="flex flex-col overflow-hidden rounded-lg bg-[#EEEEEE] transition hover:bg-[#E6E6E6]">
                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-xl font-bold text-slate-900">{svc.name}</h3>
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{g.title}</p>
                        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500"><CalendarClock size={13} className="text-slate-400" />{svc.schedule}</p>
                        <p className="mt-1 text-[11px] text-slate-400">Connects {shown.map((k) => INTEGRATIONS[k].label).join(", ")}{extra > 0 && ` and ${extra} more`}</p>
                      </div>
                      <div className="border-t border-black/5">
                        <button onClick={() => startSetup(g.templateId)} className="flex w-full items-center justify-between px-5 py-2.5 text-sm font-medium text-[#0B1B36] transition hover:bg-black/5">
                          Set up automation
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

// --------------------------------------------------
// Setup Page Component (Full Screen Overlay)
// --------------------------------------------------

function WorkflowSetup({
  templateId,
  editingWorkflow,
  existingWorkflows,
  onCancel,
  onSave,
}: {
  templateId: string;
  editingWorkflow?: WorkflowItem;
  existingWorkflows: WorkflowItem[];
  onCancel: () => void;
  onSave: (status: WfStatus, form: any) => void;
}) {
  const tpl = TEMPLATES.find((t) => t.id === templateId)!;
  
  // Step State
  const [currentStep, setCurrentStep] = useState(1);
  const STEPS = [
    { num: 1, label: "Automation Details" },
    { num: 2, label: "KRA Verification" },
    { num: 3, label: "Subscription & Activation" },
  ];

  // --- STEP 2 STATE (KRA) ---
  const [accountType, setAccountType] = useState<"individual" | "business">("individual");
  const [pinInput, setPinInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasVerified, setHasVerified] = useState(false);
  const [verifiedData, setVerifiedData] = useState<any>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  // --- STEP 3 STATE (PAYMENT) ---
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Derived
  const newPinUpper = pinInput.trim().toUpperCase();
  const usedPins = existingWorkflows.filter((w) => w.id !== editingWorkflow?.id && w.pin).map((w) => w.pin as string);
  const pinTaken = usedPins.includes(newPinUpper);

  // Action: Verify KRA PIN
  function handleVerifyPin() {
    setPinError(null);
    if (!PIN_FORMAT.test(newPinUpper)) {
      setPinError("Invalid KRA PIN format. It should be a letter, 9 digits, and a letter.");
      return;
    }
    if (pinTaken) {
      setPinError("This KRA PIN is already connected to another workflow.");
      return;
    }

    setIsVerifying(true);
    // Simulate API Call to KRA
    setTimeout(() => {
      setIsVerifying(false);
      
      // MOCK LOGIC: If PIN ends with 'Z', simulate mismatch for Nil Returns
      const mockObligation = newPinUpper.endsWith("Z") ? "VAT" : "Nil Returns";
      
      setVerifiedData({
        pin: newPinUpper,
        firstName: "John",
        middleName: "M.",
        surname: "Doe",
        obligation: mockObligation,
        matches: mockObligation === tpl.obligation // Using tpl.obligation for matching
      });
      setHasVerified(true);
    }, 1500);
  }

  // Action: Process Payment
  function handleProcessPayment() {
    setIsProcessingPayment(true);
    // Simulate Payment API
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      
      // Auto submit after short delay so user sees the success state
      setTimeout(() => {
        onSave("active", { pin: newPinUpper, mode: "auto" });
      }, 1500);
    }, 2000);
  }

  const canProceedStep2 = hasVerified && verifiedData?.matches === true;

  return (
    <div className="fixed inset-0 z-[100] flex bg-white">
      
      {/* LEFT SIDEBAR - Progress Nav */}
      <div className="hidden w-64 flex-col border-r border-slate-200 bg-[#F8FAFC] md:flex">
        <div className="p-6 border-b border-slate-200">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Form Navigation</p>
        </div>
        <div className="flex-1 p-6 space-y-6">
          {STEPS.map((step) => (
            <div key={step.num} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${currentStep === step.num ? "bg-emerald-500 text-white" : currentStep > step.num ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                  {currentStep > step.num ? <Check size={14} /> : step.num}
                </div>
                {step.num !== STEPS.length && (
                  <div className={`mt-1 h-full w-px ${currentStep > step.num ? "bg-emerald-200" : "bg-slate-200"}`} />
                )}
              </div>
              <div>
                <p className={`text-sm font-semibold ${currentStep === step.num ? "text-slate-900" : "text-slate-500"}`}>{step.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT MAIN CONTENT */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-8 py-4 bg-white sticky top-0 z-10">
          <h1 className="text-lg font-semibold text-slate-800">
            {tpl.name}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">Step {currentStep} / {STEPS.length}</span>
            <button onClick={onCancel} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="mx-auto w-full max-w-3xl px-8 py-10 pb-32">
          
          {/* STEP 1: INSTRUCTIONS */}
          {currentStep === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">
                  {tpl.name} Setup Instructions
                </h2>
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-800 leading-relaxed">
                  Review the instructions carefully before proceeding. You will be asked to verify your KRA PIN and configure submission preferences in the next steps.
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900">How long does it take to get started?</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Once your workflow is activated, TaxFlow will automatically prepare the necessary returns based on your schedule. You can choose to manually review each return before it is filed, or let it file automatically.
                </p>
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                  All workflows must be authorized. Manual filing is not supported.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900">How it works</h3>
                <ol className="list-decimal pl-5 text-sm text-slate-600 space-y-2 marker:text-slate-400">
                  <li>Verify your KRA PIN and tax obligation type.</li>
                  <li>Choose the payment method for the service fee (billed to your subscription).</li>
                  <li>Authorize TaxFlow to securely file on your behalf.</li>
                  <li>Our system automatically prepares and files your return on schedule.</li>
                  <li>Download your acknowledgement receipt from the Documents page.</li>
                </ol>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900">Requirements for setup</h3>
                <ol className="list-decimal pl-5 text-sm text-slate-600 space-y-2 marker:text-slate-400">
                  <li>A valid KRA PIN linked to the correct obligation.</li>
                  <li>An active TaxFlow subscription that covers this service.</li>
                  <li>Authorization to file on your behalf.</li>
                  <li>Any necessary supporting documents for specific tax types.</li>
                </ol>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900">Pricing Table</h3>
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-700">Service</th>
                        <th className="px-4 py-3 font-semibold text-slate-700 text-right">Fee (KSh)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-4 py-3 text-slate-600">{tpl.name}</td>
                        <td className="px-4 py-3 text-slate-600 text-right font-mono">{tpl.price.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PIN VERIFICATION */}
          {currentStep === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Error Banner for Mismatch */}
              {hasVerified && !verifiedData.matches && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3 text-red-800 shadow-sm">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">Obligation Mismatch</h4>
                    <p className="text-sm mt-1">
                      The KRA PIN you entered is registered for <strong>{verifiedData.obligation}</strong>, but you are trying to set up a <strong>{tpl.name}</strong> workflow. Please enter a PIN registered for {tpl.name}.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">KRA PIN Verification</h2>
                <p className="text-sm text-slate-500">We will verify this PIN with iTax to ensure it matches the selected automation ({tpl.name}).</p>
              </div>

              <section className="space-y-6">
                {/* Account Type */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Account Type</label>
                  <div className="flex gap-4">
                    <label className={`flex flex-1 cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${accountType === "individual" ? "border-[#0B1B36] bg-slate-50" : "border-slate-200 hover:border-slate-300"}`}>
                      <input type="radio" checked={accountType === "individual"} onChange={() => { setAccountType("individual"); setHasVerified(false); }} />
                      <User size={18} className="text-slate-600" />
                      <span className="font-semibold text-slate-800">Individual</span>
                    </label>
                    <label className={`flex flex-1 cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${accountType === "business" ? "border-[#0B1B36] bg-slate-50" : "border-slate-200 hover:border-slate-300"}`}>
                      <input type="radio" checked={accountType === "business"} onChange={() => { setAccountType("business"); setHasVerified(false); }} />
                      <Building size={18} className="text-slate-600" />
                      <span className="font-semibold text-slate-800">Business</span>
                    </label>
                  </div>
                </div>

                {/* PIN Input */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Enter KRA PIN</label>
                  <div className="flex gap-3">
                    <input
                      value={pinInput}
                      onChange={(e) => { setPinInput(e.target.value.toUpperCase()); setHasVerified(false); setPinError(null); }}
                      placeholder="e.g. A123456789Z"
                      maxLength={11}
                      className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-mono uppercase outline-none focus:border-[#0B1B36] focus:ring-1 focus:ring-[#0B1B36]"
                    />
                    <button
                      onClick={handleVerifyPin}
                      disabled={!pinInput || isVerifying}
                      className="rounded-xl bg-[#0B1B36] px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isVerifying ? <Loader2 size={18} className="animate-spin" /> : "Verify PIN"}
                    </button>
                  </div>
                  {pinError && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14}/> {pinError}</p>}
                </div>

                {/* Auto-filled Data */}
                {hasVerified && verifiedData && (
                  <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm mb-2">
                      <CheckCircle2 size={18} />
                      PIN verified successfully via iTax
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 mb-1">First Name</p>
                        <p className="font-semibold text-slate-900">{verifiedData.firstName}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">Surname</p>
                        <p className="font-semibold text-slate-900">{verifiedData.surname}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">Middle Name</p>
                        <p className="font-semibold text-slate-900">{verifiedData.middleName}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">Registered Obligation</p>
                        <p className={`font-semibold ${verifiedData.matches ? "text-emerald-700" : "text-red-600"}`}>
                          {verifiedData.obligation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* STEP 3: PAYMENT */}
          {currentStep === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Subscription & Activation</h2>
                <p className="text-sm text-slate-500">Confirm your payment details to activate this automation.</p>
              </div>

              {paymentSuccess ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-10 text-center space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-emerald-900">Payment Successful!</h3>
                  <p className="text-emerald-700">Your workflow is now active and has been submitted for processing.</p>
                  <p className="text-sm text-emerald-600 animate-pulse">Redirecting...</p>
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    <div className="bg-slate-50 p-5 border-b border-slate-200">
                      <h3 className="font-bold text-slate-900">Order Summary</h3>
                    </div>
                    <div className="p-5 space-y-4 text-sm">
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-slate-500">Service</span>
                        <span className="font-semibold text-slate-900 text-right">{tpl.name}</span>
                      </div>
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-slate-500">KRA PIN</span>
                        <span className="font-semibold text-slate-900 text-right font-mono">{maskPin(pinInput)}</span>
                      </div>
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-slate-500">Taxpayer</span>
                        <span className="font-semibold text-slate-900 text-right">{verifiedData?.firstName} {verifiedData?.surname}</span>
                      </div>
                      <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-slate-500 font-semibold">Total Due Today</span>
                        <span className="font-bold text-xl text-slate-900">{money(tpl.price)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Payment Method</h3>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#0B1B36] bg-slate-50 p-4">
                      <input type="radio" checked readOnly />
                      <Smartphone size={20} className="text-green-600" />
                      <span className="font-semibold text-slate-800 flex-1">M-Pesa</span>
                      <span className="text-xs text-slate-500">Pay via STK Push</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 opacity-50">
                      <input type="radio" disabled />
                      <CreditCard size={20} className="text-slate-400" />
                      <span className="font-semibold text-slate-800 flex-1">Credit / Debit Card</span>
                      <span className="text-xs text-slate-500">Coming soon</span>
                    </label>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input type="checkbox" defaultChecked className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                      <span className="text-sm text-slate-600 leading-relaxed group-hover:text-slate-800">
                        I authorize TaxFlow to charge my payment method and securely file returns on my behalf.
                      </span>
                    </label>
                  </div>
                </>
              )}
            </div>
          )}

        </div>

        {/* Footer Action Bar */}
        <div className="sticky bottom-0 border-t border-slate-200 bg-white px-8 py-4 flex items-center justify-between mt-auto">
          <div>
            {currentStep > 1 ? (
              <button
                onClick={() => setCurrentStep((s) => s - 1)}
                disabled={paymentSuccess || isProcessingPayment}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Back
              </button>
            ) : (
              <button
                onClick={onCancel}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep === 1 && (
              <button
                disabled
                className="rounded-xl bg-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-500 cursor-not-allowed shadow-sm"
              >
                Coming Soon
              </button>
            )}

            {currentStep === 2 && (
              <button
                onClick={() => setCurrentStep(3)}
                disabled={!canProceedStep2}
                className="rounded-xl bg-[#0B1B36] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Step
              </button>
            )}

            {currentStep === 3 && !paymentSuccess && (
              <button
                onClick={handleProcessPayment}
                disabled={isProcessingPayment}
                className="rounded-xl bg-emerald-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    Pay {money(tpl.price)} & Activate
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}