import { useEffect, useMemo, useState, useCallback } from "react";
import {
  FiSearch,
  FiStar,
  FiDownload,
  FiEye,
  FiArrowLeft,
  FiAlertCircle,
  FiFile,
  FiCopy,
  FiCheck,
  FiShield,
  FiList,
  FiSliders,
} from "react-icons/fi";

import Button from "../components/ui/Button.jsx";
import Chip from "../components/ui/Chip.jsx";
import Container from "../components/ui/Container.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import GenerateNotesDialog from "../components/GenerateNotesDialog.jsx";
import PdfExportModal from "../components/PdfExportModal.jsx";
import MarginRail from "../components/ui/MarginRail.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Panel from "../components/ui/Panel.jsx";
import { Select } from "../components/ui/Field.jsx";
import { NoteContent } from "../lib/noteRender.jsx";
import { getUserNotes, getNoteById, downloadNotePdf, exportNoteFile } from "../services/api.js";

const railDate = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
});
const fullDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const sorts = {
  newest: {
    label: "Newest first",
    compare: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  },
  oldest: {
    label: "Oldest first",
    compare: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  },
  longest: {
    label: "Longest first",
    compare: (a, b) => (b.content?.length ?? 0) - (a.content?.length ?? 0),
  },
};

const ALL = "All subjects";

const Notes = () => {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState(ALL);
  const [sort, setSort] = useState("newest");
  const [briefOpen, setBriefOpen] = useState(false);
  const [notes, setNotes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  useEffect(() => {
    void fetchNotes();
  }, [fetchNotes]);

  const subjects = useMemo(() => {
    if (!notes) return [ALL];
    return [ALL, ...new Set(notes.map((n) => n.subject).filter(Boolean))];
  }, [notes]);

  const filtered = useMemo(() => {
    if (!notes) return [];
    const needle = query.trim().toLowerCase();
    return notes
      .filter((n) => subject === ALL || n.subject === subject)
      .filter(
        (n) =>
          !needle ||
          `${n.topic} ${n.subject} ${n.excerpt || n.content || ""}`
            .toLowerCase()
            .includes(needle),
      )
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

  const [exportBusy, setExportBusy] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfTargetNote, setPdfTargetNote] = useState(null);
  const [pdfOptions, setPdfOptions] = useState({
    template: "indigo",
    coverStyle: "auto",
    pageSize: "A4",
    orientation: "portrait",
    margins: 45,
  });

  const handleDownload = async (note, customOpts = null) => {
    const id = note?._id || note?.id || detail?._id;
    if (!id) return;
    setPdfBusy(true);
    const opts = customOpts || pdfOptions;
    if (customOpts) setPdfOptions(customOpts);
    try {
      await downloadNotePdf(id, note?.topic || detail?.topic, opts);
      setPdfModalOpen(false);
    } catch (e) {
      setError(e.message || "PDF download failed.");
    } finally {
      setPdfBusy(false);
    }
  };

  const handleExportFormat = async (note, formatType) => {
    const id = note?._id || note?.id || detail?._id;
    if (!id) return;
    setExportBusy(true);
    try {
      await exportNoteFile(id, formatType, note?.topic || detail?.topic);
    } catch (e) {
      setError(e.message || `Export to ${formatType} failed.`);
    } finally {
      setExportBusy(false);
    }
  };

  const handleCopyMarkdown = (content) => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopiedFormat("markdown");
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  if (selected) {
    const display = detail || selected;
    const content = display.content || detail?.content || "";
    return (
      <Container className="py-14 sm:py-20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setSelected(null);
              setDetail(null);
            }}
          >
            <FiArrowLeft aria-hidden="true" /> Back to library
          </Button>

          {/* Quick Export format buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleExportFormat(display, "markdown")}
              disabled={exportBusy}
              className="text-xs"
            >
              <FiFile /> Markdown
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportFormat(display, "html")}
              disabled={exportBusy}
              className="text-xs"
            >
              🌐 HTML
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportFormat(display, "latex")}
              disabled={exportBusy}
              className="text-xs"
            >
              📐 LaTeX
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportFormat(display, "text")}
              disabled={exportBusy}
              className="text-xs"
            >
              📝 Text
            </Button>
            <Button
              variant="accent"
              onClick={() => handleDownload(display)}
              disabled={pdfBusy}
              className="text-xs"
            >
              <FiDownload aria-hidden="true" /> {pdfBusy ? "Preparing…" : "PDF"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPdfTargetNote(display);
                setPdfModalOpen(true);
              }}
              className="text-xs"
              title="Customize PDF theme, cover & layout"
            >
              <FiSliders aria-hidden="true" /> Style PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => handleCopyMarkdown(content)}
              className="text-xs"
            >
              {copiedFormat === "markdown" ? (
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <FiCheck /> Copied!
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <FiCopy /> Copy
                </span>
              )}
            </Button>
          </div>
        </div>

        <Panel className="mt-6" padding="snug">
          <div className="flex flex-wrap gap-2">
            {display.domain ? <Chip tone="accent">{display.domain.toUpperCase()}</Chip> : null}
            {display.moduleType ? <Chip>{display.moduleType}</Chip> : null}
            {display.subject ? <Chip>{display.subject}</Chip> : null}
            {display.audienceLevel ? <Chip>{display.audienceLevel}</Chip> : null}
            {display.format ? <Chip>{display.format}</Chip> : null}
          </div>

          <h1
            className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl"
            style={{ overflowWrap: "anywhere" }}
          >
            {display.topic || display.title}
          </h1>

          {display.createdAt ? (
            <p className="mt-2 text-fine text-ink-3">
              {fullDate.format(new Date(display.createdAt))} &bull; {display.actualWordCount ? `${display.actualWordCount.toLocaleString("en-IN")} words` : ""}
            </p>
          ) : null}

          {/* Student Study Info Strip */}
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-sheet/40 p-3 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-brand">
              ⏱️ ~{Math.max(2, Math.ceil((display.actualWordCount || 1000) / 200))} min read
            </span>
            <span className="text-line-firm">|</span>
            <span className="text-ink-2">
              Audience: <strong className="capitalize">{display.audienceLevel || "Intermediate"}</strong>
            </span>
            <span className="text-line-firm">|</span>
            <span className="text-ink-2">
              Depth: <strong className="capitalize">{display.depthLevel || "Standard"}</strong>
            </span>
            <span className="text-line-firm">|</span>
            <span className="text-emerald-700 font-semibold">
              🧠 Active Recall & Exam Traps Included
            </span>
          </div>

          {/* PDF Customization Options */}
          <div className="mt-5 grid gap-3 border-t border-line pt-5 sm:grid-cols-3">
            <label className="text-fine text-ink-2">
              PDF Template
              <select
                value={pdfOptions.template}
                onChange={(event) =>
                  setPdfOptions({ ...pdfOptions, template: event.target.value })
                }
                className="mt-1 block w-full rounded-chip border border-line bg-sheet px-3 py-2 text-sm text-ink"
              >
                <option value="sketchbook">Handwritten Sketchbook</option>
                <option value="indigo">Modern Indigo</option>
                <option value="emerald">Emerald Clean</option>
                <option value="crimson">Editorial Crimson</option>
                <option value="violet">Royal Violet</option>
                <option value="dark">Midnight Dark</option>
                <option value="print">Print optimized</option>
              </select>
            </label>
            <label className="text-fine text-ink-2">
              Page Size
              <select
                value={pdfOptions.pageSize}
                onChange={(event) =>
                  setPdfOptions({ ...pdfOptions, pageSize: event.target.value })
                }
                className="mt-1 block w-full rounded-chip border border-line bg-sheet px-3 py-2 text-sm text-ink"
              >
                <option value="A4">A4</option>
                <option value="Letter">Letter</option>
              </select>
            </label>
            <label className="text-fine text-ink-2">
              Orientation
              <select
                value={pdfOptions.orientation}
                onChange={(event) =>
                  setPdfOptions({
                    ...pdfOptions,
                    orientation: event.target.value,
                  })
                }
                className="mt-1 block w-full rounded-chip border border-line bg-sheet px-3 py-2 text-sm text-ink"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </label>
          </div>
        </Panel>

        {detailLoading ? (
          <Panel
            className="mt-6 flex items-center justify-center py-16"
            padding="snug"
          >
            <span className="inline-flex items-center gap-3 text-ink-3">
              <span
                className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-brand"
                aria-hidden="true"
              />
              Loading notes…
            </span>
          </Panel>
        ) : display.error ? (
          <Panel className="mt-6 border-brand/20" padding="snug">
            <p className="inline-flex items-center gap-2 font-medium text-brand">
              <FiAlertCircle aria-hidden="true" /> {display.error}
            </p>
          </Panel>
        ) : (
          <Panel className="mt-6 overflow-hidden p-0" padding="none">
            <div className="grid grid-cols-1 lg:grid-cols-4">
              {/* Table of Contents rail (if available) */}
              {display.toc && display.toc.length > 0 && (
                <aside className="border-r border-line bg-sheet/30 p-5 lg:col-span-1">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-3">
                    <FiList /> Contents
                  </h4>
                  <nav className="mt-3 max-h-[60vh] overflow-auto space-y-1 text-xs">
                    {display.toc.map((item, idx) => (
                      <a
                        key={idx}
                        href={`#${item.anchor}`}
                        className={`block rounded px-2 py-1 text-ink-2 hover:bg-brand-tint hover:text-brand transition-colors ${
                          item.level === 3 ? "pl-5 text-fine text-ink-3" : "font-medium"
                        }`}
                      >
                        {item.title}
                      </a>
                    ))}
                  </nav>
                </aside>
              )}

              {/* Main Content */}
              <div className={`p-6 sm:p-8 overflow-auto max-h-[75vh] ${display.toc?.length > 0 ? "lg:col-span-3" : "lg:col-span-4"}`}>
                <NoteContent content={content} />
              </div>
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
        actions={
          <Button variant="accent" onClick={() => setBriefOpen(true)}>
            Generate new notes
          </Button>
        }
      />
      <Panel padding="snug" className="mt-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <label htmlFor="note-search" className="sr-only">
              Search notes
            </label>
            <FiSearch
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3"
            />
            <input
              id="note-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles and subjects"
              className="w-full rounded-chip border border-line-firm bg-sheet py-2.5 pr-3.5 pl-10 text-[0.9375rem] text-ink transition-colors placeholder:text-ink-3/70 hover:border-ink-3 focus:border-ink"
            />
          </div>
          <div className="sm:w-52">
            <label htmlFor="note-sort" className="sr-only">
              Sort notes
            </label>
            <Select
              id="note-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              {Object.entries(sorts).map(([value, option]) => (
                <option key={value} value={value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
          {subjects.map((name) => (
            <Chip
              key={name}
              as="button"
              type="button"
              active={subject === name}
              aria-pressed={subject === name}
              onClick={() => setSubject(name)}
            >
              {name}
            </Chip>
          ))}
        </div>
      </Panel>
      {loading ? (
        <Panel
          className="mt-8 flex items-center justify-center py-16"
          padding="snug"
        >
          <span className="inline-flex items-center gap-3 text-ink-3">
            <span
              className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-brand"
              aria-hidden="true"
            />
            Loading your notes…
          </span>
        </Panel>
      ) : error ? (
        <Panel className="mt-8 border-brand/20" padding="snug">
          <p className="inline-flex items-center gap-2 font-medium text-brand">
            <FiAlertCircle aria-hidden="true" /> {error}
          </p>
          <div className="mt-4">
            <Button variant="outline" onClick={fetchNotes}>
              Retry
            </Button>
          </div>
        </Panel>
      ) : (
        <>
          <p aria-live="polite" className="mt-8 text-fine text-ink-3">
            {notes.length === 0
              ? "No notes yet"
              : filtered.length === notes.length
                ? `${notes.length} sets of notes`
                : `${filtered.length} of ${notes.length} sets of notes`}
          </p>
          {filtered.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title={
                  filtersApplied
                    ? "Nothing matched that"
                    : notes.length === 0
                      ? "No notes generated yet"
                      : "Nothing matched"
                }
                action={
                  filtersApplied ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setQuery("");
                        setSubject(ALL);
                      }}
                    >
                      Clear search and filters
                    </Button>
                  ) : (
                    <Button variant="accent" onClick={() => setBriefOpen(true)}>
                      Generate your first notes
                    </Button>
                  )
                }
              >
                {filtersApplied
                  ? "Try a shorter search, or pick a different subject."
                  : "Paste a chapter or upload your slides, and the notes will appear here."}
              </EmptyState>
            </div>
          ) : (
            <ul className="mt-4 space-y-4">
              {filtered.map((note) => (
                <li key={note._id || note.id}>
                  <NoteCard
                    note={note}
                    onOpen={openDetail}
                    onDownload={handleDownload}
                    onCustomize={(n) => {
                      setPdfTargetNote(n);
                      setPdfModalOpen(true);
                    }}
                    pdfBusy={pdfBusy}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <GenerateNotesDialog
        open={briefOpen}
        onClose={() => setBriefOpen(false)}
      />
      <PdfExportModal
        open={pdfModalOpen}
        onClose={() => {
          setPdfModalOpen(false);
          setPdfTargetNote(null);
        }}
        note={pdfTargetNote || detail || selected}
        onExport={(opts) => handleDownload(pdfTargetNote || detail || selected, opts)}
        isExporting={pdfBusy}
      />
    </Container>
  );
};

function NoteCard({ note, onOpen, onDownload, onCustomize, pdfBusy }) {
  const created = note.createdAt ? new Date(note.createdAt) : null;
  const excerpt =
    note.excerpt ||
    (note.content
      ? note.content.slice(0, 220).replace(/\n/g, " ").trim() + "…"
      : "");
  const words =
    note.words ??
    (note.content ? note.content.split(/\s+/).filter(Boolean).length : 0);
  return (
    <Panel
      as="article"
      padding="snug"
      className="transition-colors hover:border-line-firm"
    >
      <MarginRail
        screenReaderLabel="Generated on"
        locator={
          created ? (
            <time dateTime={note.createdAt} title={fullDate.format(created)}>
              {railDate.format(created)}
            </time>
          ) : null
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          {note.subject ? <Chip>{note.subject}</Chip> : null}
          {note.examType ? <Chip>{note.examType}</Chip> : null}
          {note.format ? <Chip>{note.format}</Chip> : null}
          {note.starred ? (
            <span className="inline-flex items-center gap-1 text-fine text-brand">
              <FiStar aria-hidden="true" /> Starred
            </span>
          ) : null}
        </div>
        <h2
          className="mt-3 text-lg font-bold tracking-tight text-ink sm:text-xl"
          style={{ overflowWrap: "anywhere" }}
        >
          {note.topic || note.title}
        </h2>
        {excerpt ? (
          <p
            className="mt-2 max-w-[64ch] font-read text-[1rem] leading-relaxed text-ink-2"
            style={{ overflowWrap: "anywhere" }}
          >
            {excerpt}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="flex flex-wrap gap-x-7 gap-y-1 text-fine text-ink-3">
            {words ? (
              <span data-numeric>{words.toLocaleString("en-IN")} words</span>
            ) : null}
            <span>{created ? fullDate.format(created) : ""}</span>
          </span>
          <span className="flex gap-2">
            <Button variant="outline" onClick={() => onOpen(note)}>
              <FiEye aria-hidden="true" /> View
            </Button>
            <Button
              variant="accent"
              onClick={() => onDownload(note)}
              disabled={pdfBusy}
            >
              <FiDownload aria-hidden="true" /> PDF
            </Button>
            {onCustomize ? (
              <Button
                variant="outline"
                onClick={() => onCustomize(note)}
                title="Customize PDF theme & layout"
              >
                <FiSliders aria-hidden="true" />
              </Button>
            ) : null}
          </span>
        </div>
      </MarginRail>
    </Panel>
  );
}

export default Notes;
