"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  ArrowRight,
  ArrowUp,
  BellRing,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Landmark,
  Lock,
  Mail,
  MessageSquare,
  Smartphone,
  Workflow as WorkflowIcon,
  X,
  AlertCircle,
  User,
  Building,
  Loader2,
  CreditCard,
} from "lucide-react";

// --------------------------------------------------
// Types and sample data
// --------------------------------------------------

type WfStatus = "active" | "draft" | "attention";
type Tab = "all" | "active" | "drafts";

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
  { id: "nil", name: "Automate Nil Returns", description: "Automate monthly nil return filing for taxpayers with no income to declare.", service: "Nil Returns", price: 200, serviceStatus: "active", schedule: "Monthly · due by the 20th", integrations: ["itax", "email"], obligation: "Nil Returns", keywords: ["nil", "no income", "zero", "monthly return"] },
  { id: "tot", name: "Automate Turnover Tax", description: "Manage turnover tax filing for eligible small businesses.", service: "Turnover Tax", price: 300, serviceStatus: "available", schedule: "Monthly · due by the 20th", integrations: ["sheets", "itax"], obligation: "Turnover Tax", keywords: ["turnover", "tot", "sales", "small business"] },
  { id: "paye", name: "Automate PAYE", description: "Automate PAYE returns for your employees.", service: "PAYE", price: 400, serviceStatus: "expired", schedule: "Monthly · due by the 9th", integrations: ["sheets", "itax"], obligation: "PAYE", keywords: ["paye", "payroll", "employee", "salary", "salaries"] },
  { id: "vat", name: "Automate VAT", description: "Prepare and submit VAT returns on schedule.", service: "VAT", price: 600, serviceStatus: "available", schedule: "Monthly · due by the 20th", integrations: ["sheets", "itax"], obligation: "VAT", keywords: ["vat", "value added", "purchases"] },
  { id: "itr", name: "Automate Income Tax", description: "File your annual Individual Income Tax return.", service: "Income Tax", price: 250, serviceStatus: "available", schedule: "Annual · due by 30 June", integrations: ["docs", "itax"], obligation: "Income Tax", keywords: ["income tax", "itr", "annual", "individual", "p9"] },
  { id: "mri", name: "Automate Rental Income", description: "File Monthly Rental Income tax for your properties.", service: "Rental Income", price: 250, serviceStatus: "available", schedule: "Monthly · due by the 20th", integrations: ["sheets", "itax"], obligation: "Rental Income", keywords: ["rent", "rental", "mri", "landlord", "property", "tenant"] },
  { id: "wht", name: "Automate Withholding Tax", description: "Compute and file Withholding Tax on payments to suppliers.", service: "Withholding Tax", price: 350, serviceStatus: "available", schedule: "Monthly · due by the 20th", integrations: ["sheets", "itax"], obligation: "Withholding Tax", keywords: ["withholding", "wht", "supplier", "suppliers"] },
  { id: "cit", name: "Automate Corporation Tax", description: "Manage Corporation Tax instalments for your company.", service: "Corporation Tax", price: 700, serviceStatus: "available", schedule: "Quarterly · due on the 20th", integrations: ["sheets", "itax"], obligation: "Corporation Tax", keywords: ["corporation", "corporate", "company", "instalment", "installment", "cit"] },
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

// Short, scannable headlines (two lines max) and a muted band colour per template
const GALLERY = [
  { id: "g1", templateId: "nil", headline: "File monthly nil returns and email the receipt", band: "#CDDACA", integrations: ["email", "docs", "itax"] },
  { id: "g3", templateId: "tot", headline: "Work out turnover tax from your sales and file it", band: "#CBD9E3", integrations: ["sheets", "docs", "itax"] },
  { id: "g5", templateId: "paye", headline: "Prepare PAYE from your payroll sheet and file it", band: "#E8DBBB", integrations: ["sheets", "docs", "itax"] },
  { id: "g7", templateId: "vat", headline: "Prepare VAT from sales and purchases and submit", band: "#E7C5C8", integrations: ["sheets", "drive", "itax"] },
  { id: "g9", templateId: "itr", headline: "Gather income documents and file your annual return", band: "#D9CFE4", integrations: ["docs", "drive", "itax"] },
  { id: "g11", templateId: "mri", headline: "Calculate rental income tax from your rent records", band: "#C8DDD8", integrations: ["sheets", "docs", "itax"] },
  { id: "g13", templateId: "wht", headline: "Work out withholding tax on supplier payments", band: "#EBD3C0", integrations: ["sheets", "docs", "itax"] },
  { id: "g15", templateId: "cit", headline: "Calculate quarterly corporation tax instalments", band: "#CFD4E7", integrations: ["sheets", "docs", "itax"] },
];

const initialWorkflows: WorkflowItem[] = [];

const statusMeta: Record<WfStatus, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-emerald-50 text-emerald-700" },
  draft: { label: "Setup required", cls: "bg-amber-100 text-amber-700" },
  attention: { label: "Needs attention", cls: "bg-red-50 text-red-700" },
};

const PIN_FORMAT = /^[AP]\d{9}[A-Z]$/;
const maskPin = (pin: string) => `${pin.slice(0, 3)}•••••••${pin.slice(-1)}`;
const money = (n: number) => `KSh ${n.toLocaleString("en-KE")}`;

// Palette: warm paper, one ink colour, one quiet green accent.
const INK = "#0B1B36";
const PAPER = "#FBFAF8";
const LINE = "#E6E2DB";
const MUTED = "#6F6A62";

// Rank templates against free text the person typed
function matchTemplates(text: string) {
  const q = text.trim().toLowerCase();
  if (q.length < 2) return [];
  return TEMPLATES.map((t) => {
    let score = 0;
    if (t.name.toLowerCase().includes(q) || t.service.toLowerCase().includes(q)) score += 3;
    t.keywords.forEach((k) => {
      if (q.includes(k)) score += 2;
      else if (k.includes(q)) score += 1;
    });
    q.split(/\s+/).forEach((w) => {
      if (w.length > 2 && t.keywords.some((k) => k.includes(w))) score += 1;
    });
    return { t, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.t);
}

// --------------------------------------------------
// Main Component
// --------------------------------------------------

export default function WorkflowsPage({
  onGoToPricing,
  onLinkPin,
  userName = "Sam",
}: {
  onGoToPricing?: () => void;
  onLinkPin?: () => void;
  userName?: string;
}) {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>(initialWorkflows);
  const [tab, setTab] = useState<Tab>("all");
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [promptFocused, setPromptFocused] = useState(false);
  const [promoHidden, setPromoHidden] = useState(false);
  const [rail, setRail] = useState({ left: false, right: true });
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  function updateRail() {
    const el = railRef.current;
    if (!el) return;
    setRail({
      left: el.scrollLeft > 8,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 8,
    });
  }
  useEffect(() => {
    updateRail();
    window.addEventListener("resize", updateRail);
    return () => window.removeEventListener("resize", updateRail);
  }, [isLoading, promoHidden]);

  function scrollRail(dir: 1 | -1) {
    railRef.current?.scrollBy({ left: dir * 640, behavior: "smooth" });
  }

  const [view, setView] = useState<"list" | "setup">("list");
  const [setupData, setSetupData] = useState<{ templateId: string; editingId?: string } | null>(null);

  const promptMatches = useMemo(() => matchTemplates(prompt), [prompt]);

  // ---- Actions ----
  function startSetup(templateId: string, wf?: WorkflowItem) {
    setSetupData({ templateId, editingId: wf?.id });
    setView("setup");
  }

  function submitPrompt() {
    if (!prompt.trim()) return;
    if (promptMatches.length > 0) {
      startSetup(promptMatches[0].id);
      setPrompt("");
    } else {
      setNotice("We couldn't match that to a tax automation. Try a tax type such as VAT, PAYE or nil returns, or pick from the templates below.");
      railRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
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
        editingWorkflow={workflows.find((w) => w.id === setupData.editingId)}
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

  const showDropdown = promptFocused && promptMatches.length > 0;

  const scratch = [
    { icon: WorkflowIcon, title: "Workflow", sub: "Automated tax filing", onClick: () => railRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }) },
    { icon: MessageSquare, title: "Solara AI", sub: "Describe it, we set it up", onClick: () => promptRef.current?.focus() },
    { icon: BellRing, title: "Reminders", sub: "Coming soon", disabled: true },
    { icon: FileText, title: "Document request", sub: "Coming soon", disabled: true },
  ];

  return (
    <div className="space-y-12 rounded-2xl pb-10" style={{ backgroundColor: PAPER }}>
      {/* ---------------- Hero ---------------- */}
      <section className="relative px-4 pt-14 sm:pt-16">
        {/* faint dot field that fades out toward the edges */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(11,27,54,0.16) 1px, transparent 1px)",
            backgroundSize: "14px 14px",
            WebkitMaskImage: "radial-gradient(ellipse 60% 70% at 50% 45%, #000 10%, transparent 75%)",
            maskImage: "radial-gradient(ellipse 60% 70% at 50% 45%, #000 10%, transparent 75%)",
          }}
        />

        <div className="relative mx-auto max-w-[750px]">
          <h1 className="text-center text-[28px] font-medium tracking-[-0.01em] sm:text-[32px]" style={{ color: INK }}>
            Hi {userName}, what are we automating?
          </h1>
          <p className="mt-3 text-center text-sm" style={{ color: MUTED }}>
            Describe your idea and <span className="font-semibold" style={{ color: "#1E6B4F" }}>Solara AI</span>, your coworker, will build it for you.
          </p>

          <div className="relative mt-8">
            <div
              className="rounded-md bg-white shadow-[0_1px_2px_rgba(11,27,54,0.05)] transition-colors focus-within:border-[#0B1B36]"
              style={{ border: `1px solid #D8D3CB` }}
            >
              <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: `1px solid ${LINE}` }}>
                <span className="flex h-5 w-5 items-center justify-center rounded" style={{ backgroundColor: INK }}>
                  <WorkflowIcon size={12} className="text-white" />
                </span>
                <span className="text-sm font-semibold" style={{ color: INK }}>Solara AI</span>
              </div>

              <textarea
                ref={promptRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onFocus={() => setPromptFocused(true)}
                onBlur={() => setTimeout(() => setPromptFocused(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitPrompt();
                  }
                }}
                rows={3}
                placeholder="Enter a tax type or describe what to file, e.g. monthly rental income"
                className="block w-full resize-none bg-transparent px-3 pt-3 text-sm text-slate-800 outline-none placeholder:text-[#8B867D]"
              />

              <div className="flex justify-end px-3 pb-3">
                <button
                  onClick={submitPrompt}
                  disabled={!prompt.trim()}
                  aria-label="Start automation"
                  className="flex h-7 w-7 items-center justify-center rounded text-white transition disabled:cursor-not-allowed disabled:bg-[#ECE8E1] disabled:text-[#A29D93]"
                  style={{ backgroundColor: INK }}
                >
                  <ArrowUp size={15} />
                </button>
              </div>
            </div>

            {showDropdown && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1.5 overflow-hidden rounded-md bg-white shadow-lg" style={{ border: `1px solid ${LINE}` }}>
                {promptMatches.map((t, i) => (
                  <button
                    key={t.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { startSetup(t.id); setPrompt(""); }}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-[#F6F4F0]"
                    style={i > 0 ? { borderTop: `1px solid ${LINE}` } : undefined}
                  >
                    <span>
                      <span className="block text-sm font-semibold" style={{ color: INK }}>{t.name}</span>
                      <span className="block text-xs" style={{ color: MUTED }}>{t.schedule}</span>
                    </span>
                    <ArrowRight size={15} style={{ color: MUTED }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="mt-3 text-center text-xs" style={{ color: MUTED }}>
            Solara AI can make mistakes. Please double-check before you activate anything.
          </p>
        </div>
      </section>

      {notice && (
        <div className="mx-auto flex max-w-[750px] items-center justify-between gap-3 rounded-md px-4 py-3 text-sm" style={{ backgroundColor: "#EEF3EF", border: "1px solid #D5E2D8", color: "#1E4D36" }}>
          <span className="flex items-center gap-2"><CheckCircle2 size={16} className="shrink-0" />{notice}</span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss"><X size={15} /></button>
        </div>
      )}

      {/* ---------------- Start from scratch ---------------- */}
      <section className="px-1">
        <h2 className="text-[17px] font-semibold" style={{ color: INK }}>Start from scratch</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {scratch.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.title}
                onClick={s.onClick}
                disabled={s.disabled}
                className="flex items-center gap-3 rounded-md bg-white px-4 py-4 text-left transition hover:border-[#C7C1B6] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-[#E6E2DB]"
                style={{ border: `1px solid ${LINE}` }}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: "#E6EEE8", color: "#1E6B4F" }}>
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold" style={{ color: INK }}>{s.title}</span>
                  <span className="block text-[13px] leading-snug" style={{ color: MUTED }}>{s.sub}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ---------------- Made for your obligations (carousel) ---------------- */}
      <section className="px-1">
        <h2 className="text-[17px] font-semibold" style={{ color: INK }}>Made for your tax obligations</h2>

        <div className="relative mt-4">
          <div
            ref={railRef}
            onScroll={updateRail}
            className="flex snap-x gap-4 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {/* Promo card */}
            {!promoHidden && (
              <div className="flex w-[300px] shrink-0 snap-start flex-col rounded-md bg-white p-5" style={{ border: `1px solid ${LINE}` }}>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: INK }}>
                  <Landmark size={20} className="text-white" />
                </span>
                <h3 className="mt-5 text-[17px] font-semibold leading-snug" style={{ color: INK }}>Show only what applies to you</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: MUTED }}>
                  Link your KRA PIN and we will highlight the automations that match your registered obligations.
                </p>
                <div className="mt-5 flex items-center gap-4">
                  <button
                    onClick={() => (onLinkPin ? onLinkPin() : setNotice("KRA PIN linking is not connected yet."))}
                    className="inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    style={{ backgroundColor: INK }}
                  >
                    Link KRA PIN <ArrowRight size={15} />
                  </button>
                  <button onClick={() => setPromoHidden(true)} className="text-sm" style={{ color: MUTED }}>Not now</button>
                </div>
                <p className="mt-auto flex items-center gap-2 pt-6 text-[13px]" style={{ color: MUTED }}>
                  <Lock size={14} /> Takes 2 minutes · unlink anytime
                </p>
              </div>
            )}

            {/* Template cards */}
            {GALLERY.map((g) => {
              const svc = TEMPLATES.find((t) => t.id === g.templateId)!;

              if (isLoading) {
                return (
                  <div key={g.id} className="w-[300px] shrink-0 snap-start overflow-hidden rounded-md bg-white" style={{ border: `1px solid ${LINE}` }}>
                    <div className="h-[134px] animate-pulse bg-[#ECE8E1]" />
                    <div className="animate-pulse p-4">
                      <div className="h-4 w-11/12 rounded bg-[#ECE8E1]" />
                      <div className="mt-2 h-4 w-2/3 rounded bg-[#ECE8E1]" />
                      <div className="mt-5 h-3 w-1/2 rounded bg-[#ECE8E1]" />
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={g.id}
                  onClick={() => startSetup(g.templateId)}
                  className="group w-[300px] shrink-0 snap-start overflow-hidden rounded-md bg-white text-left transition hover:border-[#C7C1B6] hover:shadow-[0_4px_14px_rgba(11,27,54,0.07)]"
                  style={{ border: `1px solid ${LINE}` }}
                >
                  <div
                    className="flex h-[134px] items-center justify-center"
                    style={{
                      backgroundColor: g.band,
                      backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.32) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.32) 1px, transparent 1px)",
                      backgroundSize: "16px 16px",
                    }}
                  >
                    <div className="flex items-center gap-2 rounded-lg bg-white p-2 shadow-[0_1px_3px_rgba(11,27,54,0.08)]">
                      {g.integrations.filter((k) => k !== "itax").map((k) => {
                        const Icon = INTEGRATIONS[k].icon;
                        return (
                          <span key={k} className="flex h-10 w-10 items-center justify-center rounded-md" style={{ border: `1px solid ${LINE}` }}>
                            <Icon size={19} className={INTEGRATIONS[k].color} />
                          </span>
                        );
                      })}
                      <ArrowRight size={15} className="mx-0.5" style={{ color: MUTED }} />
                      <span className="flex h-10 w-10 items-center justify-center rounded-md" style={{ backgroundColor: INK }}>
                        <Landmark size={19} className="text-white" />
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="min-h-[2.75rem] text-[17px] font-semibold leading-snug" style={{ color: INK }}>{g.headline}</h3>
                    <div className="mt-3 flex items-center gap-1.5 text-[13px]" style={{ color: MUTED }}>
                      <CalendarClock size={14} />{svc.schedule}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* edge fade + arrows */}
          {rail.right && (
            <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-20" style={{ background: `linear-gradient(to right, transparent, ${PAPER})` }} />
          )}
          {rail.left && (
            <button
              onClick={() => scrollRail(-1)}
              aria-label="Scroll left"
              className="absolute left-0 top-[67px] z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition hover:bg-[#F6F4F0]"
              style={{ border: `1px solid ${LINE}`, color: INK }}
            >
              <ChevronLeft size={18} />
            </button>
          )}
          {rail.right && (
            <button
              onClick={() => scrollRail(1)}
              aria-label="Scroll right"
              className="absolute right-0 top-[67px] z-10 flex h-9 w-9 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition hover:bg-[#F6F4F0]"
              style={{ border: `1px solid ${LINE}`, color: INK }}
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </section>

      {/* ---------------- Your workflows ---------------- */}
      <section className="px-1">
        <h2 className="text-[17px] font-semibold" style={{ color: INK }}>Your workflows</h2>

        <div className="mt-3 flex gap-6" style={{ borderBottom: `1px solid ${LINE}` }}>
          {([["all", "All"], ["active", "Active"], ["drafts", "Drafts"]] as [Tab, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="-mb-px border-b-2 py-2.5 text-sm font-medium transition"
              style={tab === id ? { borderColor: INK, color: INK } : { borderColor: "transparent", color: MUTED }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 overflow-hidden rounded-md bg-white" style={{ border: `1px solid ${LINE}` }}>
          {visible.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-semibold" style={{ color: INK }}>Nothing here yet</p>
              <p className="mx-auto mt-1 max-w-sm text-sm" style={{ color: MUTED }}>
                Describe what you need in the box above or pick a template to set up your first automation.
              </p>
              <button
                onClick={() => railRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
                className="mt-4 rounded px-4 py-2 text-sm font-semibold transition hover:bg-[#F6F4F0]"
                style={{ border: `1px solid #D8D3CB`, color: INK }}
              >
                Browse templates
              </button>
            </div>
          ) : (
            <div>
              {visible.map((w, i) => {
                const meta = statusMeta[w.status];
                return (
                  <div
                    key={w.id}
                    className="flex flex-col gap-4 p-5 transition hover:bg-[#FAF9F6] md:flex-row md:items-center md:justify-between"
                    style={i > 0 ? { borderTop: `1px solid ${LINE}` } : undefined}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: "#E6EEE8", color: "#1E6B4F" }}>
                        <WorkflowIcon size={18} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold" style={{ color: INK }}>{w.name}</p>
                        <p className="mt-0.5 text-[13px]" style={{ color: MUTED }}>{w.pin ? `KRA PIN ${maskPin(w.pin)}` : "KRA account not linked"} · {w.frequency}</p>
                        {w.note && <p className={`mt-1 text-xs ${w.status === "attention" ? "text-red-600" : "text-amber-700"}`}>{w.note}</p>}
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs" style={{ color: MUTED }}><Clock3 size={12} /> Last run {w.lastRun} · Next run {w.nextRun}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.cls}`}>{meta.label}</span>
                      {w.status === "active" && <button className="rounded px-4 py-2 text-sm font-semibold transition hover:bg-[#F6F4F0]" style={{ border: "1px solid #D8D3CB", color: INK }}>Manage</button>}
                      {w.status === "draft" && <button onClick={() => startSetup(w.templateId, w)} className="rounded px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90" style={{ backgroundColor: INK }}>Continue setup</button>}
                      {w.status === "attention" && <button onClick={onGoToPricing} className="rounded px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90" style={{ backgroundColor: INK }}>Renew service</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// --------------------------------------------------
// Setup Page Component (Full Screen Overlay) - unchanged
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
    setTimeout(() => {
      setIsVerifying(false);
      const mockObligation = newPinUpper.endsWith("Z") ? "VAT" : "Nil Returns";
      setVerifiedData({
        pin: newPinUpper,
        firstName: "John",
        middleName: "M.",
        surname: "Doe",
        obligation: mockObligation,
        matches: mockObligation === tpl.obligation,
      });
      setHasVerified(true);
    }, 1500);
  }

  function handleProcessPayment() {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
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
        <div className="flex items-center justify-between border-b border-slate-200 px-8 py-4 bg-white sticky top-0 z-10">
          <h1 className="text-lg font-semibold text-slate-800">{tpl.name}</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">Step {currentStep} / {STEPS.length}</span>
            <button onClick={onCancel} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-3xl px-8 py-10 pb-32">
          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">{tpl.name} Setup Instructions</h2>
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

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                  {pinError && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {pinError}</p>}
                </div>

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

          {/* STEP 3 */}
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
              <button onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">
                Cancel
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep === 1 && (
              <button disabled className="rounded-xl bg-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-500 cursor-not-allowed shadow-sm">
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
                  <>Pay {money(tpl.price)} & Activate</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}