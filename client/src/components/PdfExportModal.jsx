import { useState, useEffect } from "react";
import Modal from "./ui/Modal.jsx";
import Button from "./ui/Button.jsx";
import { Field, Select } from "./ui/Field.jsx";
import { FiDownload, FiCheck, FiLayers, FiLayout, FiMaximize } from "react-icons/fi";

const THEME_OPTIONS = [
  {
    id: "sketchbook",
    name: "Handwritten Sketchbook",
    desc: "Spiral wire binding, cream paper & sticky notes",
    accent: "#ea580c",
    tint: "#fef3c7",
    ink: "#1c1917",
  },
  {
    id: "indigo",
    name: "Modern Indigo",
    desc: "Academic & Executive standard",
    accent: "#1e40af",
    tint: "#eff6ff",
    ink: "#0f172a",
  },
  {
    id: "emerald",
    name: "Emerald Clean",
    desc: "Science, Health & Ecology",
    accent: "#047857",
    tint: "#ecfdf5",
    ink: "#0f172a",
  },
  {
    id: "crimson",
    name: "Editorial Crimson",
    desc: "Humanities, Law & History",
    accent: "#991b1b",
    tint: "#fef2f2",
    ink: "#1c1917",
  },
  {
    id: "violet",
    name: "Royal Violet",
    desc: "STEM, Tech & Modern Analysis",
    accent: "#6d28d9",
    tint: "#f5f3ff",
    ink: "#1e1b4b",
  },
  {
    id: "dark",
    name: "Midnight Dark",
    desc: "Dark background with sky accents",
    accent: "#38bdf8",
    tint: "#1e293b",
    ink: "#f8fafc",
  },
  {
    id: "print",
    name: "Monochrome Print",
    desc: "High contrast for laser printers",
    accent: "#111827",
    tint: "#f3f4f6",
    ink: "#000000",
  },
];

const COVER_OPTIONS = [
  { id: "auto", label: "Smart Layout (Recommended)", desc: "Full cover for comprehensive notes, top banner for summaries" },
  { id: "cover", label: "Executive Cover Page", desc: "Always start with a full cover page, metadata cards & stats" },
  { id: "banner", label: "Top Hero Banner", desc: "Header banner on Page 1 with immediate content flow" },
];

export default function PdfExportModal({
  open,
  onClose,
  note,
  onExport,
  isExporting,
}) {
  const isHandwrittenNote =
    note?.noteStyle === "handwritten" ||
    Boolean(
      note?.content &&
      /personal revision notes|HANDWRITTEN NOTE STYLE|✍️/i.test(note.content),
    );
  const [template, setTemplate] = useState(
    isHandwrittenNote ? "sketchbook" : "indigo",
  );
  const [coverStyle, setCoverStyle] = useState("auto");
  const [pageSize, setPageSize] = useState("A4");
  const [orientation, setOrientation] = useState("portrait");
  const [margins, setMargins] = useState("45");

  useEffect(() => {
    if (isHandwrittenNote) {
      setTemplate("sketchbook");
    }
  }, [isHandwrittenNote]);

  const selectedTheme = THEME_OPTIONS.find((t) => t.id === template) || THEME_OPTIONS[0];

  const handleDownload = () => {
    onExport({
      template,
      coverStyle,
      pageSize,
      orientation,
      margins: Number(margins),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Export Professional PDF"
      description="Configure publication-grade visual styling, color palette, and layout hierarchy."
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            variant="accent"
            onClick={handleDownload}
            disabled={isExporting}
            className="gap-2"
          >
            <FiDownload />
            {isExporting ? "Rendering PDF…" : "Download PDF"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Visual Theme Selection */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-3">
            Visual Theme & Color Palette
          </label>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {THEME_OPTIONS.map((t) => {
              const active = template === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplate(t.id)}
                  className={`group relative flex flex-col rounded-xl border p-3 text-left transition-all ${
                    active
                      ? "border-brand bg-brand/5 shadow-sm ring-1 ring-brand"
                      : "border-line bg-sheet hover:border-line-firm"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-black/10 shadow-xs"
                        style={{ backgroundColor: t.accent }}
                      />
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-black/10 shadow-xs"
                        style={{ backgroundColor: t.tint }}
                      />
                    </div>
                    {active ? (
                      <span className="text-brand">
                        <FiCheck className="h-4 w-4" />
                      </span>
                    ) : null}
                  </div>
                  <span className="mt-2 text-xs font-bold text-ink">
                    {t.name}
                  </span>
                  <span className="mt-0.5 text-[0.7rem] leading-tight text-ink-3">
                    {t.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Preview Card */}
        <div
          className="rounded-xl border p-4 transition-colors"
          style={{
            backgroundColor: selectedTheme.tint,
            borderColor: selectedTheme.accent + "40",
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="inline-block rounded px-2 py-0.5 text-[0.65rem] font-bold tracking-wider text-white uppercase shadow-xs"
              style={{ backgroundColor: selectedTheme.accent }}
            >
              {note?.domain || "ACADEMIC BRIEF"}
            </span>
            <span
              className="text-[0.68rem] font-medium"
              style={{ color: selectedTheme.accent }}
            >
              ExaminAI • Page 1 of 4
            </span>
          </div>
          <h4
            className="mt-2 text-sm font-bold truncate"
            style={{ color: selectedTheme.ink }}
          >
            {note?.topic || "Study Notes & Revision Guide"}
          </h4>
          <p className="mt-1 text-[0.72rem] leading-relaxed opacity-80" style={{ color: selectedTheme.ink }}>
            Clean typography with comfortable leading, two-pass headers/footers, and WCAG AA contrast.
          </p>
        </div>

        {/* Cover Page Style */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-3">
            Cover Page & Header Layout
          </label>
          <div className="mt-2 space-y-2">
            {COVER_OPTIONS.map((c) => {
              const active = coverStyle === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCoverStyle(c.id)}
                  className={`flex w-full items-start justify-between rounded-lg border p-2.5 text-left text-xs transition-all ${
                    active
                      ? "border-brand bg-brand/5 ring-1 ring-brand"
                      : "border-line bg-sheet hover:border-line-firm"
                  }`}
                >
                  <div>
                    <span className="font-semibold text-ink">{c.label}</span>
                    <p className="text-[0.7rem] text-ink-3">{c.desc}</p>
                  </div>
                  {active ? <FiCheck className="mt-0.5 text-brand shrink-0" /> : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Page Setup Controls */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Page Size">
            <Select value={pageSize} onChange={(e) => setPageSize(e.target.value)}>
              <option value="A4">A4 (Standard)</option>
              <option value="Letter">US Letter</option>
            </Select>
          </Field>

          <Field label="Orientation">
            <Select value={orientation} onChange={(e) => setOrientation(e.target.value)}>
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </Select>
          </Field>

          <Field label="Margins">
            <Select value={margins} onChange={(e) => setMargins(e.target.value)}>
              <option value="30">Compact (30 pt)</option>
              <option value="45">Standard (45 pt)</option>
              <option value="60">Spacious (60 pt)</option>
            </Select>
          </Field>
        </div>
      </div>
    </Modal>
  );
}
