import { useEffect, useMemo, useState, useCallback } from "react";
import { FiSearch, FiStar, FiDownload, FiEye, FiArrowLeft, FiAlertCircle } from "react-icons/fi";

import Button from "../components/ui/Button.jsx";
import Chip from "../components/ui/Chip.jsx";
import Container from "../components/ui/Container.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import GenerateNotesDialog from "../components/GenerateNotesDialog.jsx";
import MarginRail from "../components/ui/MarginRail.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Panel from "../components/ui/Panel.jsx";
import { Select } from "../components/ui/Field.jsx";
import { getUserNotes, getNoteById, downloadNotePdf } from "../services/api.js";

const railDate = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" });
const fullDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

const sorts = {
  newest: { label: "Newest first", compare: (a, b) => new Date(b.createdAt) - new Date(a.createdAt) },
  oldest: { label: "Oldest first", compare: (a, b) => new Date(a.createdAt) - new Date(b.createdAt) },
  longest: { label: "Longest first", compare: (a, b) => (b.content?.length ?? 0) - (a.content?.length ?? 0) },
};

const ALL = "All subjects";

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function renderNotesHtml(raw) {
  const escaped = escapeHtml(raw || "");
  let html = escaped.replace(/```([\s\S]*?)```/g, (_, code) => `<pre class="overflow-x-auto rounded-lg bg-ink p-4 text-sm leading-relaxed text-white"><code>${code.trim()}</code></pre>`);
  html = html.replace(/(^.*\|.*$\n?)+/gm, (block) => {
    const rows = block.trim().split("\n").filter((l) => l.includes("|"));
    if (rows.length < 2) return block;
    const parseRow = (line) => line.split("|").map((c) => c.trim()).filter(Boolean);
    const header = parseRow(rows[0]);
    const isSep = rows[1] && /^[-|:\s]+$/.test(rows[1]);
    const bodyRows = isSep ? rows.slice(2) : rows.slice(1);
    const thead = `<thead><tr>${header.map((c) => `<th class="border border-line bg-brand-tint px-3 py-2 text-left text-sm font-semibold">${c}</th>`).join("")}</tr></thead>`;
    const tbody = bodyRows.length ? `<tbody>${bodyRows.map((r) => `<tr>${parseRow(r).map((c) => `<td class="border border-line px-3 py-2 text-sm">${c}</td>`).join("")}</tr>`).join("")}</tbody>` : "";
    return `<div class="overflow-x-auto rounded-lg border border-line"><table class="w-full border-collapse text-sm">${thead}${tbody}</table></div>`;
  });
  html = html.replace(/^###\s+(.+)$/gm, `<h3 class="mt-6 text-lg font-bold text-ink">$1</h3>`);
  html = html.replace(/^##\s+(.+)$/gm, `<h2 class="mt-6 text-xl font-bold text-ink">$1</h2>`);
  html = html.replace(/^#\s+(.+)$/gm, `<h1 class="mt-6 text-2xl font-bold text-ink">$1</h1>`);
  html = html.replace(/\*\*(.+?)\*\*/g, `<strong class="font-semibold text-ink">$1</strong>`);
  html = html.replace(/^\s*[-*]\s+(.+)$/gm, `<div class="flex gap-2"><span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"></span><span class="flex-1">$1</span></div>`);
  html = html.replace(/^\s*\d+\.\s+(.+)$/gm, `<div class="flex gap-2"><span class="font-semibold text-brand">$&</span></div>`);
  html = html.split(/\n{2,}/).map((chunk) => {
    const t = chunk.trim();
    if (!t) return "";
    if (t.startsWith("<h") || t.startsWith("<pre") || t.startsWith("<div") || t.startsWith("<table")) return t;
    return `<p class="leading-relaxed text-ink-2">${t.replace(/\n/g, "<br/>")}</p>`;
  }).join("\n");
  return html;
}

const Notes = () => {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState(ALL);
  const [sort, setSort] = useState("newest");
  const [briefOpen, setBriefOpen] = useState(false);

  const [notes, setNotes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Detail view
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserNotes();
      setNotes(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Failed to load notes.");
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchNotes(); }, [fetchNotes]);

  const subjects = useMemo(() => {
    if (!notes) return [ALL];
    return [ALL, ...new Set(notes.map((n) => n.subject).filter(Boolean))];
  }, [notes]);

  const filtered = useMemo(() => {
    if (!notes) return [];
    const needle = query.trim().toLowerCase();
    return notes
      .filter((n) => subject === ALL || n.subject === subject)
      .filter((n) => !needle || `${n.topic} ${n.subject} ${n.excerpt || n.content || ""}`.toLowerCase().includes(needle))
      .sort(sorts[sort].compare);
  }, [notes, query, subject, sort]);

  const filtersApplied = query.trim() !== "" || subject !== ALL;

  const openDetail = async (note) => {
    setSelected(note);
    setDetail(null);
    setDetailLoading(true);
    try {
      const full = await getNoteById(note._id || note.id);
      setDetail(full);
    } catch (e) {
      setDetail({ error: e.response?.data?.error || e.message });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDownload = async (note) => {
    const id = note?._id || note?.id || detail?._id;
    if (!id) return;
    setPdfBusy(true);
    try {
      await downloadNotePdf(id, note?.topic || detail?.topic);
    } catch (e) {
      setError(e.message || "PDF download failed.");
    } finally {
      setPdfBusy(false);
    }
  };

  // Detail overlay
  if (selected) {
    const display = detail || selected;
    const content = display.content || detail?.content || "";
    return (
      <Container className="py-14 sm:py-20">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={() => { setSelected(null); setDetail(null); }}>
            <FiArrowLeft aria-hidden="true" /> Back to notes
          </Button>
          <Button variant="accent" onClick={() => handleDownload(display)} disabled={pdfBusy}>
            <FiDownload aria-hidden="true" /> {pdfBusy ? "Preparing…" : "Download PDF"}
          </Button>
        </div>

        <Panel className="mt-6" padding="snug">
          <div className="flex flex-wrap gap-2">
            {display.subject ? <Chip>{display.subject}</Chip> : null}
            {display.format ? <Chip>{display.format}</Chip> : null}
            {display.examType ? <Chip>{display.examType}</Chip> : null}
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl" style={{ overflowWrap: "anywhere" }}>{display.topic || display.title}</h1>
          {display.createdAt ? <p className="mt-2 text-fine text-ink-3">{fullDate.format(new Date(display.createdAt))}</p> : null}
        </Panel>

        {detailLoading ? (
          <Panel className="mt-6 flex items-center justify-center py-16" padding="snug">
            <span className="inline-flex items-center gap-3 text-ink-3">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-brand" aria-hidden="true" />
              Loading notes…
            </span>
          </Panel>
        ) : display.error ? (
          <Panel className="mt-6 border-brand/20" padding="snug">
            <p className="inline-flex items-center gap-2 font-medium text-brand"><FiAlertCircle aria-hidden="true" /> {display.error}</p>
          </Panel>
        ) : (
          <Panel className="mt-6 overflow-hidden" padding="snug">
            <div className="max-h-[70vh] overflow-auto rounded-xl border border-line bg-white p-6 sm:p-8" style={{ overflowWrap: "anywhere" }}>
              <div className="prose max-w-none space-y-4 text-[0.9375rem] leading-relaxed" dangerouslySetInnerHTML={{ __html: renderNotesHtml(content) }} />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="accent" onClick={() => handleDownload(display)} disabled={pdfBusy}>
                <FiDownload aria-hidden="true" /> Download PDF
              </Button>
              <Button variant="outline" onClick={() => { setSelected(null); setDetail(null); }}>Back</Button>
            </div>
          </Panel>
        )}
      </Container>
    );
  }

  return (
    <Container className="py-14 sm:py-20">
      <PageHeader
        title="Notes"
        standfirst="Every set of notes ExaminAI has generated for you, newest first. Search across titles and subjects, or narrow to one paper."
        actions={<Button variant="accent" onClick={() => setBriefOpen(true)}>Generate new notes</Button>}
      />

      <Panel padding="snug" className="mt-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <label htmlFor="note-search" className="sr-only">Search notes</label>
            <FiSearch aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3" />
            <input id="note-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search titles and subjects" className="w-full rounded-chip border border-line-firm bg-sheet py-2.5 pr-3.5 pl-10 text-[0.9375rem] text-ink transition-colors placeholder:text-ink-3/70 hover:border-ink-3 focus:border-ink" />
          </div>
          <div className="sm:w-52">
            <label htmlFor="note-sort" className="sr-only">Sort notes</label>
            <Select id="note-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              {Object.entries(sorts).map(([value, option]) => (<option key={value} value={value}>{option.label}</option>))}
            </Select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
          {subjects.map((name) => (
            <Chip key={name} as="button" type="button" active={subject === name} aria-pressed={subject === name} onClick={() => setSubject(name)}>{name}</Chip>
          ))}
        </div>
      </Panel>

      {loading ? (
        <Panel className="mt-8 flex items-center justify-center py-16" padding="snug">
          <span className="inline-flex items-center gap-3 text-ink-3">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-brand" aria-hidden="true" />
            Loading your notes…
          </span>
        </Panel>
      ) : error ? (
        <Panel className="mt-8 border-brand/20" padding="snug">
          <p className="inline-flex items-center gap-2 font-medium text-brand"><FiAlertCircle aria-hidden="true" /> {error}</p>
          <div className="mt-4"><Button variant="outline" onClick={fetchNotes}>Retry</Button></div>
        </Panel>
      ) : (
        <>
          <p aria-live="polite" className="mt-8 text-fine text-ink-3">
            {notes.length === 0 ? "No notes yet" : filtered.length === notes.length ? `${notes.length} sets of notes` : `${filtered.length} of ${notes.length} sets of notes`}
          </p>

          {filtered.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title={filtersApplied ? "Nothing matched that" : notes.length === 0 ? "No notes generated yet" : "Nothing matched"}
                action={
                  filtersApplied ? (
                    <Button variant="outline" onClick={() => { setQuery(""); setSubject(ALL); }}>Clear search and filters</Button>
                  ) : (
                    <Button variant="accent" onClick={() => setBriefOpen(true)}>Generate your first notes</Button>
                  )
                }
              >
                {filtersApplied ? "Try a shorter search, or pick a different subject." : "Paste a chapter or upload your slides, and the notes will appear here."}
              </EmptyState>
            </div>
          ) : (
            <ul className="mt-4 space-y-4">
              {filtered.map((note) => (
                <li key={note._id || note.id}>
                  <NoteCard note={note} onOpen={openDetail} onDownload={handleDownload} pdfBusy={pdfBusy} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <GenerateNotesDialog open={briefOpen} onClose={() => setBriefOpen(false)} />
    </Container>
  );
};

function NoteCard({ note, onOpen, onDownload, pdfBusy }) {
  const created = note.createdAt ? new Date(note.createdAt) : null;
  const excerpt = note.excerpt || (note.content ? note.content.slice(0, 220).replace(/\n/g, " ").trim() + "…" : "");
  const words = note.words ?? (note.content ? note.content.split(/\s+/).filter(Boolean).length : 0);
  return (
    <Panel as="article" padding="snug" className="transition-colors hover:border-line-firm">
      <MarginRail
        screenReaderLabel="Generated on"
        locator={created ? <time dateTime={note.createdAt} title={fullDate.format(created)}>{railDate.format(created)}</time> : null}
      >
        <div className="flex flex-wrap items-center gap-2">
          {note.subject ? <Chip>{note.subject}</Chip> : null}
          {note.examType ? <Chip>{note.examType}</Chip> : null}
          {note.format ? <Chip>{note.format}</Chip> : null}
          {note.starred ? <span className="inline-flex items-center gap-1 text-fine text-brand"><FiStar aria-hidden="true" /> Starred</span> : null}
        </div>
        <h2 className="mt-3 text-lg font-bold tracking-tight text-ink sm:text-xl" style={{ overflowWrap: "anywhere" }}>{note.topic || note.title}</h2>
        {excerpt ? <p className="mt-2 max-w-[64ch] font-read text-[1rem] leading-relaxed text-ink-2" style={{ overflowWrap: "anywhere" }}>{excerpt}</p> : null}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="flex flex-wrap gap-x-7 gap-y-1 text-fine text-ink-3">
            {words ? <span data-numeric>{words.toLocaleString("en-IN")} words</span> : null}
            <span>{created ? fullDate.format(created) : ""}</span>
          </span>
          <span className="flex gap-2">
            <Button variant="outline" onClick={() => onOpen(note)}><FiEye aria-hidden="true" /> View</Button>
            <Button variant="accent" onClick={() => onDownload(note)} disabled={pdfBusy}><FiDownload aria-hidden="true" /> PDF</Button>
          </span>
        </div>
      </MarginRail>
    </Panel>
  );
}

export default Notes;
