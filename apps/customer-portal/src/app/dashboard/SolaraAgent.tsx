"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  Loader2,
  Plus,
  Workflow as WorkflowIcon,
  X,
} from "lucide-react";

// --------------------------------------------------
// Solara AI: the agent that follows the user around Taxflow.
//
// - A floating button on every page opens a side panel.
// - It knows which page the user is on and suggests things for it.
// - It can send the user to the right page (action buttons).
// - The conversation survives page changes, because this component
//   lives in the dashboard shell, not inside a single page.
//
// Brain: askAgent() calls POST /api/agent. Until that route exists it
// falls back to a small local helper that ONLY routes people to the
// right page. It never invents tax answers.
// --------------------------------------------------

const INK = "#0B1B36";
const LINE = "#E2E8F0";
const MUTED = "#64748B";
const BORDER = "#CBD5E1";

type AgentAction = { label: string; page: string };
type Msg = { id: number; role: "user" | "assistant"; text: string; actions?: AgentAction[] };
type AgentReply = { text: string; actions?: AgentAction[] };

// Suggested questions that change with the page the user is on
const PAGE_PROMPTS: Record<string, string[]> = {
  Overview: ["What should I do first?", "How do I automate my nil returns?", "Where do I verify my KRA PIN?"],
  Workflows: ["Which automation fits me?", "How do I set up a workflow?"],
  "My Tax Profile": ["What does my tax status mean?", "Where can I see my obligations?"],
  "KRA Verification": ["How do I find my KRA PIN?", "What does verify KRA PIN do?"],
  "My Submissions": ["Where is my filing receipt?", "Why would a filing fail?"],
  "Linked Accounts": ["How do I link a KRA account?", "Is linking safe?"],
  "My Subscription": ["How do I renew?", "What does my plan include?"],
  Profile: ["How do I change my phone number?", "How do I secure my account?"],
  "Help & Support": ["How do I contact support?"],
};

// --------------------------------------------------
// Brain
// --------------------------------------------------

type Intent = { keys: string[]; page: string; text: string; label: string };

const INTENTS: Intent[] = [
  {
    keys: ["verify", "kra pin", "find my pin", "pin", "tcc", "certificate", "etims", "exempt"],
    page: "KRA Verification",
    text: "You can find or verify a KRA PIN, check obligations and verify certificates in KRA Verification.",
    label: "Open KRA Verification",
  },
  {
    keys: ["status", "tax card", "compliance", "obligation", "tax profile"],
    page: "My Tax Profile",
    text: "Your tax card and current status are in My Tax Profile.",
    label: "Open My Tax Profile",
  },
  {
    keys: ["nil", "vat", "paye", "rental", "rent", "turnover", "withholding", "corporation", "income tax", "automate", "automation", "workflow", "file", "return"],
    page: "Workflows",
    text: "You can set up and manage tax automations in Workflows.",
    label: "Open Workflows",
  },
  {
    keys: ["submission", "submitted", "receipt", "failed", "acknowledgement"],
    page: "My Submissions",
    text: "Your filings and their status are in My Submissions.",
    label: "Open My Submissions",
  },
  {
    keys: ["link", "linked", "connect account"],
    page: "Linked Accounts",
    text: "You can connect and manage your KRA accounts in Linked Accounts.",
    label: "Open Linked Accounts",
  },
  {
    keys: ["subscription", "billing", "renew", "price", "plan", "payment", "pay "],
    page: "My Subscription",
    text: "Your plan and billing are in My Subscription.",
    label: "Open My Subscription",
  },
  {
    keys: ["password", "email", "phone", "security", "my profile", "account settings"],
    page: "Profile",
    text: "You can update your details and security settings in Profile.",
    label: "Open Profile",
  },
  {
    keys: ["help", "support", "contact", "problem"],
    page: "Help & Support",
    text: "Help articles and ways to reach us are in Help & Support.",
    label: "Open Help & Support",
  },
];

const TAX_WORDS = ["tax", "kra", "deadline", "due", "deduct", "relief", "penalty", "itax", "filing"];

// Routing only. No tax answers are made up here.
function localReply(text: string, currentPage: string): AgentReply {
  const q = ` ${text.toLowerCase()} `;

  let best: { intent: Intent; score: number } | null = null;
  for (const intent of INTENTS) {
    const score = intent.keys.reduce((s, k) => (q.includes(k) ? s + 1 : s), 0);
    if (score > 0 && (!best || score > best.score)) best = { intent, score };
  }

  if (best) {
    const { intent } = best;
    const already = intent.page === currentPage;
    return {
      text: already
        ? `${intent.text} You are already on that page. Detailed tax answers are coming soon.`
        : `${intent.text} Detailed tax answers are coming soon.`,
      actions: already ? [] : [{ label: intent.label, page: intent.page }],
    };
  }

  if (TAX_WORDS.some((w) => q.includes(w))) {
    return {
      text: "Detailed answers on tax rules, deadlines and deductions are coming soon. For now I can take you to the right page in Taxflow. What are you trying to do?",
    };
  }

  return {
    text: "I focus on Kenyan tax and your Taxflow account, so I can't help with that. I can point you to a page, such as Workflows or KRA Verification.",
  };
}

async function askAgent(
  history: { role: "user" | "assistant"; text: string }[],
  context: { page: string }
): Promise<AgentReply> {
  try {
    // Real model, once the server route exists. Expected response:
    // { text: string, actions?: { label: string, page: string }[] }
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history, context }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.text) return { text: data.text, actions: data.actions };
    }
  } catch {
    // fall through to the local helper
  }

  await new Promise((r) => setTimeout(r, 600));
  const last = [...history].reverse().find((m) => m.role === "user")?.text || "";
  return localReply(last, context.page);
}

// --------------------------------------------------
// Component
// --------------------------------------------------

export default function SolaraAgent({
  activePage,
  onNavigate,
  userName,
}: {
  activePage: string;
  onNavigate: (page: string) => void;
  userName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const idRef = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending, open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function send(text: string) {
    const t = text.trim();
    if (!t || pending) return;

    const userMsg: Msg = { id: ++idRef.current, role: "user", text: t };
    const history = [...messages, userMsg].map((m) => ({ role: m.role, text: m.text }));

    setMessages((m) => [...m, userMsg]);
    setInput("");
    setPending(true);

    const reply = await askAgent(history, { page: activePage });

    setMessages((m) => [
      ...m,
      { id: ++idRef.current, role: "assistant", text: reply.text, actions: reply.actions },
    ]);
    setPending(false);
  }

  function runAction(a: AgentAction) {
    onNavigate(a.page);
    // On phones the panel covers the page, so close it. On larger screens keep it open.
    if (typeof window !== "undefined" && window.innerWidth < 640) setOpen(false);
  }

  const prompts = PAGE_PROMPTS[activePage] ?? PAGE_PROMPTS.Overview;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Open Solara AI"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
        style={{ backgroundColor: INK }}
      >
        <WorkflowIcon size={17} />
        Ask Solara
      </button>
    );
  }

  return (
    <>
      {/* Backdrop on phones only */}
      <div className="fixed inset-0 z-[55] bg-black/40 sm:hidden" onClick={() => setOpen(false)} />

      <aside
        role="dialog"
        aria-label="Solara AI"
        className="fixed right-0 top-0 z-[60] flex h-full w-full flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200 sm:w-[400px]"
        style={{ borderLeft: `1px solid ${LINE}` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${LINE}` }}>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded" style={{ backgroundColor: INK }}>
              <WorkflowIcon size={13} className="text-white" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold" style={{ color: INK }}>Solara AI</p>
              <p className="text-[11px]" style={{ color: MUTED }}>You are on {activePage}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMessages([])}
              disabled={messages.length === 0}
              aria-label="New chat"
              title="New chat"
              className="rounded-lg p-2 transition hover:bg-slate-100 disabled:opacity-40"
              style={{ color: MUTED }}
            >
              <Plus size={17} />
            </button>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="rounded-lg p-2 transition hover:bg-slate-100"
              style={{ color: MUTED }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Conversation */}
        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
          {messages.length === 0 && (
            <div>
              <h2 className="text-lg font-semibold" style={{ color: INK }}>
                Hi{userName ? ` ${userName}` : ""}, how can I help?
              </h2>
              <p className="mt-1 text-sm" style={{ color: MUTED }}>
                Ask about your tax tasks in Taxflow. Here are some ideas for this page:
              </p>
              <div className="mt-4 flex flex-col gap-2">
                {prompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="rounded-lg bg-white px-3.5 py-2.5 text-left text-[13px] font-medium transition hover:bg-slate-50"
                    style={{ border: `1px solid ${BORDER}`, color: INK }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div
                  className="max-w-[85%] rounded-lg px-3.5 py-2.5 text-[14px]"
                  style={{ backgroundColor: "#F1F5F9", border: `1px solid ${LINE}`, color: INK }}
                >
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={m.id}>
                <p className="text-[14px] leading-relaxed text-slate-700">{m.text}</p>
                {m.actions && m.actions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.actions.map((a) => (
                      <button
                        key={a.label}
                        onClick={() => runAction(a)}
                        className="inline-flex items-center gap-2 rounded px-3.5 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
                        style={{ backgroundColor: INK }}
                      >
                        {a.label} <ArrowRight size={14} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          )}

          {pending && (
            <div className="flex items-center gap-2 text-[13px]" style={{ color: MUTED }}>
              <Loader2 size={14} className="animate-spin" /> Thinking…
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="px-4 pb-4 pt-2">
          <div className="rounded-lg bg-white" style={{ border: `2px solid ${INK}` }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={2}
              placeholder="Ask Solara AI"
              className="block w-full resize-none bg-transparent px-3 pt-2.5 text-sm text-slate-800 outline-none placeholder:text-[#94A3B8]"
            />
            <div className="flex justify-end px-2.5 pb-2.5">
              <button
                onClick={() => send(input)}
                disabled={pending || !input.trim()}
                aria-label="Send"
                className="flex h-7 w-7 items-center justify-center rounded text-white transition disabled:cursor-not-allowed disabled:bg-[#E2E8F0] disabled:text-[#94A3B8]"
                style={{ backgroundColor: INK }}
              >
                <ArrowUp size={15} />
              </button>
            </div>
          </div>
          <p className="mt-2 text-center text-[11px]" style={{ color: MUTED }}>
            Solara AI can make mistakes. Check important details.
          </p>
        </div>
      </aside>
    </>
  );
}