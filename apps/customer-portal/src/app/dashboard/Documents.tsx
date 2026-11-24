"use client";

import { useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Download,
  File as FileIcon,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Home,
  Move,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";

// --------------------------------------------------
// Types
// --------------------------------------------------

type Category = "receipt" | "return" | "certificate" | "upload";

type FolderItem = {
  id: string;
  name: string;
  createdAt: string;
};

type Doc = {
  id: string;
  name: string;
  category: Category;
  source: string;
  pin: string | null;
  date: string;
  size: number;
  folderId: string | null;
  url?: string;
};

// --------------------------------------------------
// Data
// --------------------------------------------------

const LINKED_PINS: string[] = [];
const initialFolders: FolderItem[] = [];
const initialDocs: Doc[] = [];

const FILTERS: { id: "all" | Category; label: string }[] = [
  { id: "all", label: "All" },
  { id: "receipt", label: "Receipts" },
  { id: "return", label: "Returns" },
  { id: "certificate", label: "Certificates" },
  { id: "upload", label: "Uploads" },
];

const CATEGORY_LABEL: Record<Category, string> = {
  receipt: "Acknowledgement receipt",
  return: "Filed return",
  certificate: "Certificate",
  upload: "Uploaded file",
};

const ALLOWED = ["pdf", "xlsx", "xls", "csv", "jpg", "jpeg", "png"];
const MAX_BYTES = 10 * 1024 * 1024;

// --------------------------------------------------
// Helpers
// --------------------------------------------------

const maskPin = (pin: string) => `${pin.slice(0, 3)}•••••••${pin.slice(-1)}`;

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

function fileStyle(name: string): { Icon: React.ElementType; cls: string } {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return { Icon: FileText, cls: "bg-red-50 text-red-600" };
  if (["xlsx", "xls", "csv"].includes(ext))
    return { Icon: FileSpreadsheet, cls: "bg-emerald-50 text-emerald-700" };
  return { Icon: FileIcon, cls: "bg-slate-100 text-slate-600" };
}

// --------------------------------------------------
// Page
// --------------------------------------------------

export default function DocumentsPage() {
  const [folders, setFolders] = useState<FolderItem[]>(initialFolders);
  const [docs, setDocs] = useState<Doc[]>(initialDocs);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | Category>("all");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [moveDocId, setMoveDocId] = useState<string | null>(null);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentFolder = folders.find((f) => f.id === currentFolderId) ?? null;

  const visibleDocs = [...docs]
    .filter((d) => d.folderId === currentFolderId)
    .filter((d) => filter === "all" || d.category === filter)
    .filter((d) => {
      const q = query.trim().toLowerCase();
      return (
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.source.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const countFor = (id: "all" | Category) => {
    const inFolder = docs.filter((d) => d.folderId === currentFolderId);
    return id === "all"
      ? inFolder.length
      : inFolder.filter((d) => d.category === id).length;
  };

  function showNotice(message: string) {
    setNotice(message);
    setTimeout(() => setNotice(null), 4000);
  }

  function closeUpload() {
    setUploadOpen(false);
    setFile(null);
    setPin("");
    setError("");
    setDragging(false);
  }

  function pick(f: File | undefined | null) {
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED.includes(ext)) {
      setFile(null);
      setError(
        "This file type isn't supported. Use PDF, Excel, CSV, JPG or PNG."
      );
      return;
    }
    if (f.size > MAX_BYTES) {
      setFile(null);
      setError("This file is larger than 10 MB.");
      return;
    }
    setError("");
    setFile(f);
  }

  function submitUpload() {
    if (!file) return;
    const doc: Doc = {
      id: `d${Date.now()}`,
      name: file.name,
      category: "upload",
      source: "Uploaded by you",
      pin: pin || null,
      date: new Date().toISOString().slice(0, 10),
      size: file.size,
      folderId: currentFolderId,
      url: URL.createObjectURL(file),
    };
    setDocs((prev) => [doc, ...prev]);
    setFilter("all");
    setQuery("");
    showNotice(`${file.name} was uploaded.`);
    closeUpload();
  }

  function download(d: Doc) {
    if (!d.url) return;
    const a = document.createElement("a");
    a.href = d.url;
    a.download = d.name;
    a.click();
  }

  function remove(d: Doc) {
    if (d.url) URL.revokeObjectURL(d.url);
    setDocs((prev) => prev.filter((x) => x.id !== d.id));
    setConfirmId(null);
    showNotice(`${d.name} was deleted.`);
  }

  function moveFile(docId: string, targetFolderId: string | null) {
    setDocs((prev) =>
      prev.map((d) =>
        d.id === docId ? { ...d, folderId: targetFolderId } : d
      )
    );
    setMoveDocId(null);
    const targetName =
      targetFolderId === null
        ? "All Documents"
        : folders.find((f) => f.id === targetFolderId)?.name ?? "folder";
    showNotice(`File moved to “${targetName}”.`);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Documents
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Organise receipts, returns, certificates and your uploads.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setUploadOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0B1B36] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Upload size={17} />
            Upload
          </button>
        </div>
      </div>

      {/* Notice */}
      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={17} />
            {notice}
          </span>
          <button onClick={() => setNotice(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Breadcrumb + Search bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 text-sm">
          <button
            onClick={() => setCurrentFolderId(null)}
            className={`font-medium transition ${
              currentFolderId === null
                ? "text-slate-900"
                : "text-slate-500 hover:text-[#0B1B36]"
            }`}
          >
            All Documents
          </button>
          {currentFolder && (
            <>
              <ChevronRight size={14} className="text-slate-300" />
              <span className="font-semibold text-slate-900">
                {currentFolder.name}
              </span>
            </>
          )}
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#0B1B36] focus:ring-2 focus:ring-[#0B1B36]/10"
          />
        </div>
      </div>

      {/* Files section */}
      <section>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-slate-700">
            {currentFolder ? currentFolder.name : "Files"}
            <span className="ml-2 font-normal text-slate-400">
              ({visibleDocs.length})
            </span>
          </h2>

          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  filter === f.id
                    ? "bg-[#0B1B36] text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {f.label}
                {countFor(f.id) > 0 && (
                  <span className="ml-1 opacity-70">({countFor(f.id)})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {visibleDocs.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
              <FolderOpen size={26} />
            </div>
            <p className="mt-4 font-semibold text-slate-800">
              {docs.filter((d) => d.folderId === currentFolderId).length === 0
                ? "No files here yet"
                : "No matching documents"}
            </p>
            <p className="mt-1 max-w-xs text-sm text-slate-500">
              {docs.filter((d) => d.folderId === currentFolderId).length === 0
                ? "Upload a document to get started."
                : "Try a different search or filter."}
            </p>
            <button
              onClick={() => setUploadOpen(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0B1B36] px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Upload size={16} />
              Upload document
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <ul className="divide-y divide-slate-100">
              {visibleDocs.map((d) => {
                const { Icon, cls } = fileStyle(d.name);
                const isUpload = d.category === "upload";

                return (
                  <li
                    key={d.id}
                    className="group flex items-center gap-4 px-4 py-3.5 transition hover:bg-slate-50/80 sm:px-5"
                  >
                    {/* Icon */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cls}`}
                    >
                      <Icon size={18} />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {d.name}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400">
                        <span>{CATEGORY_LABEL[d.category]}</span>
                        <span className="hidden sm:inline">·</span>
                        <span className="hidden sm:inline">{d.source}</span>
                        <span>·</span>
                        <span>{formatDate(d.date)}</span>
                        <span>·</span>
                        <span>{formatSize(d.size)}</span>
                        {d.pin && (
                          <>
                            <span>·</span>
                            <span>{maskPin(d.pin)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                      {confirmId === d.id ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-500">Delete?</span>
                          <button
                            onClick={() => remove(d)}
                            className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            No
                          </button>
                        </div>
                      ) : moveDocId === d.id ? (
                        <div className="flex flex-wrap items-center gap-1">
                          <button
                            onClick={() => moveFile(d.id, null)}
                            className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                          >
                            Root
                          </button>
                          {folders
                            .filter((f) => f.id !== currentFolderId)
                            .map((f) => (
                              <button
                                key={f.id}
                                onClick={() => moveFile(d.id, f.id)}
                                className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                              >
                                {f.name}
                              </button>
                            ))}
                          <button
                            onClick={() => setMoveDocId(null)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => download(d)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => setMoveDocId(d.id)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            title="Move"
                          >
                            <Move size={16} />
                          </button>
                          {isUpload && (
                            <button
                              onClick={() => setConfirmId(d.id)}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      <p className="text-center text-xs text-slate-400">
        Documents from your workflows are added automatically after each filing.
      </p>

      {/* ---------- Upload Dialog ---------- */}
      {uploadOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                Upload document
              </h3>
              <button
                onClick={closeUpload}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {currentFolder
                ? `Uploading into “${currentFolder.name}”.`
                : "File will be added to All Documents."}
            </p>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                pick(e.dataTransfer.files?.[0]);
              }}
              onClick={() => inputRef.current?.click()}
              className={`mt-5 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
                dragging
                  ? "border-[#0B1B36] bg-slate-50"
                  : "border-slate-300 hover:bg-slate-50"
              }`}
            >
              <Upload size={24} className="text-slate-400" />
              {file ? (
                <>
                  <p className="mt-3 text-sm font-semibold text-slate-800">
                    {file.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatSize(file.size)} · click to replace
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-3 text-sm font-semibold text-slate-800">
                    Drop a file here or click to browse
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    PDF, Excel, CSV, JPG or PNG · up to 10 MB
                  </p>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => pick(e.target.files?.[0])}
              />
            </div>

            {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

            <label className="mt-5 block text-sm font-semibold text-slate-800">
              Related KRA PIN{" "}
              <span className="font-normal text-slate-400">(optional)</span>
              <select
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#0B1B36]"
              >
                <option value="">Not linked to a PIN</option>
                {LINKED_PINS.map((p) => (
                  <option key={p} value={p}>
                    {maskPin(p)}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeUpload}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={submitUpload}
                disabled={!file}
                className="rounded-xl bg-[#0B1B36] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}