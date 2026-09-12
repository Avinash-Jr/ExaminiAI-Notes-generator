import { useState, useRef, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiDownload,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiUpload,
  FiX,
  FiFile,
  FiPlus,
  FiCopy,
  FiCheck,
  FiBookOpen,
  FiActivity,
  FiLayers,
  FiList,
  FiShield,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

import Button from "../components/ui/Button.jsx";
import Chip from "../components/ui/Chip.jsx";
import Container from "../components/ui/Container.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import GenerateNotesDialog from "../components/GenerateNotesDialog.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Panel from "../components/ui/Panel.jsx";
import { Field, Input, Select, Textarea } from "../components/ui/Field.jsx";
import {
  domains,
  modules,
  audienceLevels,
  examplePreferences,
  depthLevels,
  checkScopeAndLength,
  estimateCredits,
  formats,
  labelFor,
} from "../lib/noteDefaults.js";
import { NoteContent } from "../lib/noteRender.jsx";
import { cx } from "../lib/cx.js";
import { generateNotes, exportNoteFile } from "../services/api.js";
import { setUserData } from "../redux/userSlice.js";

const heading = "text-xl font-bold tracking-tight text-ink sm:text-2xl";

const TopicForm = () => {
  const { state } = useLocation();
  const initialBrief = state?.brief ?? null;
  const dispatch = useDispatch();
  const { userData } = useSelector((s) => s.user);

  // Form State
  const [topic, setTopic] = useState(initialBrief?.topic || "");
  const [subject, setSubject] = useState(initialBrief?.subject || "");
  const [domain, setDomain] = useState(initialBrief?.domain || "general");
  const [moduleType, setModuleType] = useState(initialBrief?.moduleType || "standard");
  const [targetWordCount, setTargetWordCount] = useState(initialBrief?.targetWordCount || 2000);
  const [audienceLevel, setAudienceLevel] = useState(initialBrief?.audienceLevel || "intermediate");
  const [examplePreference, setExamplePreference] = useState(initialBrief?.examplePreference || "balanced");
  const [depthLevel, setDepthLevel] = useState(initialBrief?.depthLevel || "rigorous");
  const [customInstructions, setCustomInstructions] = useState(initialBrief?.customInstructions || "");
  const [includeDiagrams, setIncludeDiagrams] = useState(initialBrief?.diagrams ?? true);
  const [format, setFormat] = useState(initialBrief?.format || "revision");
  const [noteStyle, setNoteStyle] = useState(initialBrief?.noteStyle || "academic");

  // Learning Objectives List
  const [objectives, setObjectives] = useState(initialBrief?.learningObjectives || []);
  const [newObjective, setNewObjective] = useState("");

  // Prerequisites List
  const [prerequisites, setPrerequisites] = useState(initialBrief?.prerequisites || []);
  const [newPrereq, setNewPrereq] = useState("");

  // Upload & Material State
  const [material, setMaterial] = useState("");
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [exportBusy, setExportBusy] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState(null);
  const [studyHubOpen, setStudyHubOpen] = useState(true);
  const [revealedAnswers, setRevealedAnswers] = useState({});
  const [masteredCards, setMasteredCards] = useState({});
  const [spacedChecklist, setSpacedChecklist] = useState({
    day1: false,
    day3: false,
    day7: false,
    day14: false,
  });

  const ALLOWED_TYPES = ["application/pdf"];
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const MAX_FILES = 5;

  // Real-time Scope & Length Validation Check
  const scopeValidation = useMemo(() => {
    return checkScopeAndLength({
      moduleType,
      targetWordCount,
      learningObjectives: objectives,
      depthLevel,
      audienceLevel,
    });
  }, [moduleType, targetWordCount, objectives, depthLevel, audienceLevel]);

  // Credit calculation
  const cost = estimateCredits({
    moduleType,
    depth: depthLevel === "deep-technical" ? "thorough" : "balanced",
    diagrams: includeDiagrams,
    targetWordCount,
  });

  const handleModuleSelect = (newMod) => {
    setModuleType(newMod);
    if (newMod === "quick-summary") setTargetWordCount(800);
    else if (newMod === "standard") setTargetWordCount(2000);
    else if (newMod === "comprehensive") setTargetWordCount(5000);
  };

  const handleSliderChange = (newVal) => {
    const val = Number(newVal);
    setTargetWordCount(val);
    if (val <= 1000) {
      setModuleType("quick-summary");
    } else if (val <= 3000) {
      setModuleType("standard");
    } else if (val <= 6000) {
      setModuleType("comprehensive");
    } else {
      setModuleType("custom");
    }
  };

  const handleAddObjective = (e) => {
    e?.preventDefault();
    const clean = newObjective.trim();
    if (clean && !objectives.includes(clean)) {
      setObjectives([...objectives, clean]);
      setNewObjective("");
    }
  };

  const handleRemoveObjective = (idx) => {
    setObjectives(objectives.filter((_, i) => i !== idx));
  };

  const handleAddPrereq = (e) => {
    e?.preventDefault();
    const clean = newPrereq.trim();
    if (clean && !prerequisites.includes(clean)) {
      setPrerequisites([...prerequisites, clean]);
      setNewPrereq("");
    }
  };

  const handleRemovePrereq = (idx) => {
    setPrerequisites(prerequisites.filter((_, i) => i !== idx));
  };

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    const valid = [];
    for (const file of selected) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setStatus({
          tone: "bad",
          text: `"${file.name}" is not a supported reference. Upload a readable PDF file.`,
        });
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setStatus({
          tone: "bad",
          text: `"${file.name}" is too large. Maximum 10 MB per file.`,
        });
        continue;
      }
      valid.push(file);
    }
    setFiles((prev) => {
      const combined = [...prev, ...valid];
      if (combined.length > MAX_FILES) {
        setStatus({
          tone: "bad",
          text: `Maximum ${MAX_FILES} files allowed. Some were not added.`,
        });
        return combined.slice(0, MAX_FILES);
      }
      return combined;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async (event) => {
    event.preventDefault();
    if (!userData) {
      setStatus({
        tone: "bad",
        text: "You must be signed in to generate notes.",
      });
      return;
    }

    if (!topic.trim()) {
      setStatus({
        tone: "bad",
        text: "Please specify a topic for the notes.",
      });
      return;
    }

    setLoading(true);
    setGenerated(null);
    setStatus({
      tone: "info",
      text: files.length
        ? "Extracting PDF references & generating domain-aligned notes with QA evaluation..."
        : "Generating structured notes with strict parameter adherence & QA evaluation...",
    });

    try {
      const payload = {
        topic: topic.trim(),
        subject: subject.trim() || topic.trim(),
        domain,
        learningObjectives: objectives,
        audienceLevel,
        prerequisites,
        examplePreference,
        depthLevel,
        customInstructions: customInstructions.trim(),
        moduleType,
        targetWordCount: Number(targetWordCount) || 2000,
        format,
        noteStyle,
        revisionMode: depthLevel === "intuitive",
        includeDiagrams,
        includeCharts: true,
        material: material.trim() || undefined,
      };

      const result = await generateNotes(payload, files);
      if (result.creditRemaining !== undefined && userData) {
        dispatch(setUserData({ ...userData, credits: result.creditRemaining }));
      }

      const notesDoc = result.notes || {};
      const content = notesDoc.content || result.data?.text || "";

      setGenerated({
        content,
        noteId: result.noteId || notesDoc._id,
        creditRemaining: result.creditRemaining,
        topic: notesDoc.topic || topic,
        qaReport: result.qaReport || notesDoc.qaReport,
        toc: result.toc || notesDoc.toc || [],
        glossary: result.glossary || notesDoc.glossary || [],
        exportFormats: result.exportFormats || notesDoc.exportFormats || {},
        actualWordCount: result.actualWordCount || notesDoc.actualWordCount || 0,
        moduleType: notesDoc.moduleType || moduleType,
        domain: notesDoc.domain || domain,
        noteStyle: notesDoc.noteStyle || noteStyle,
      });

      setStatus({
        tone: "good",
        text: `Notes successfully generated with full QA evaluation. ${result.creditsCharged ?? cost} credits charged. ${result.creditRemaining} remaining. Scroll down to inspect the QA dashboard and export files.`,
      });
    } catch (error) {
      const msg = error.message || "Something went wrong. Please try again.";
      const charged = error.charged === true;
      const retryable = error.retryable !== false;
      setStatus({
        tone: "bad",
        text: charged
          ? msg
          : `${msg}${retryable ? " — you were not charged, you can retry." : ""}`,
        retryable: !charged && retryable,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (formatType, customOpts = null) => {
    if (!generated?.noteId) return;
    setExportBusy(true);
    try {
      const isHandwritten =
        noteStyle === "handwritten" ||
        generated?.noteStyle === "handwritten" ||
        /personal revision notes/i.test(generated?.content || "");
      const opts =
        customOpts || (isHandwritten ? { template: "sketchbook" } : {});
      await exportNoteFile(generated.noteId, formatType, generated.topic, opts);
    } catch (e) {
      setStatus({
        tone: "bad",
        text: e.message || `Export to ${formatType} failed. Please try again.`,
      });
    } finally {
      setExportBusy(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!generated?.content) return;
    navigator.clipboard.writeText(generated.content);
    setCopiedFormat("markdown");
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  if (!initialBrief && !topic) {
    return (
      <Container className="py-14 sm:py-20">
        <PageHeader
          title="Educational Notes Generator"
          standfirst="Configure domain-specific learning objectives, module depth, and educational parameters."
        />
        <div className="mt-10">
          <EmptyState
            title="Start with a topic brief"
            action={
              <Button variant="accent" onClick={() => setEditing(true)}>
                Create Topic Brief
              </Button>
            }
          >
            Choose a subject category, target audience knowledge level, and learning objectives.
          </EmptyState>
        </div>
        <GenerateNotesDialog open={editing} onClose={() => setEditing(false)} />
      </Container>
    );
  }

  const selectedDomainObj = domains.find((d) => d.value === domain) || domains[7];
  const selectedModuleObj = modules.find((m) => m.value === moduleType) || modules[1];

  return (
    <Container className="py-12 sm:py-16">
      <PageHeader
        title="Notes Generation Studio"
        standfirst="Structured educational notes strictly aligned with your learning parameters, quality assurance, and length constraints."
        meta={[
          { label: "Domain", value: `${selectedDomainObj.icon} ${selectedDomainObj.label.split(" ")[0]}` },
          { label: "Module", value: selectedModuleObj.label },
          { label: "Audience", value: labelFor(audienceLevels, audienceLevel).split(" ")[0] },
          { label: "Depth", value: labelFor(depthLevels, depthLevel).split(" ")[0] },
        ]}
        actions={
          <Button variant="outline" onClick={() => setEditing(true)}>
            Quick Setup Dialog
          </Button>
        }
      />

      <div className="mt-8 space-y-8">
        {/* TOPIC FORM PARAMETERS PANEL */}
        <Panel as="section" aria-labelledby="form-heading">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
            <div>
              <h2 id="form-heading" className={heading}>
                Topic Parameters & Learning Specifications
              </h2>
              <p className="mt-1 text-sm text-ink-3">
                All fields are extracted and verified during generation.
              </p>
            </div>
            <Chip tone="accent">
              Est. Cost: {cost} Credits
            </Chip>
          </div>

          <form onSubmit={handleGenerate} className="mt-6 space-y-6">
            {/* Row 1: Topic & Subject */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field id="param-topic" label="Core Topic / Concept">
                {(field) => (
                  <Input
                    {...field}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Distributed Consensus Algorithms"
                    required
                  />
                )}
              </Field>

              <Field id="param-subject" label="Subject / Field of Study">
                {(field) => (
                  <Input
                    {...field}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Computer Science, Economics, Molecular Biology"
                  />
                )}
              </Field>
            </div>

            {/* Row 2: Subject Domain & Module Selection */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field
                id="param-domain"
                label="Subject Domain"
                hint="Enforces domain-appropriate structural conventions and terminology"
              >
                {(field) => (
                  <Select
                    {...field}
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                  >
                    {domains.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.icon} {d.label}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <Field
                id="param-module"
                label="Module-Based Length Selection"
                hint="Maps to strict target word count, chapter depth, and credit cost"
              >
                {(field) => (
                  <Select
                    {...field}
                    value={moduleType}
                    onChange={(e) => handleModuleSelect(e.target.value)}
                  >
                    {modules.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label} ({m.range}) — {m.credits} credits
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>

            {/* Target Word Count Slider - ALWAYS VISIBLE & INTERACTIVE */}
            <div className="rounded-2xl border border-line bg-surface/60 p-5 shadow-xs transition-all">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-tint text-brand text-xs font-bold">
                    📏
                  </span>
                  <label htmlFor="target-words-slider" className="text-sm font-bold text-ink">
                    Target Word Count:{" "}
                    <span className="text-brand font-extrabold text-base">
                      {targetWordCount.toLocaleString()} words
                    </span>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-brand-tint px-2.5 py-0.5 text-xs font-semibold text-brand">
                    {targetWordCount <= 1000
                      ? "⚡ Quick Revision Digest"
                      : targetWordCount <= 3000
                        ? "📖 Standard Study Notes"
                        : targetWordCount <= 5500
                          ? "🏛️ Comprehensive Masterclass"
                          : "🔬 Deep Technical Textbook"}
                  </span>
                  <span className="text-xs text-ink-3">
                    ~{Math.max(4, Math.min(14, Math.round(targetWordCount / 450)))} chapters
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <input
                  id="target-words-slider"
                  type="range"
                  min={500}
                  max={8000}
                  step={100}
                  value={targetWordCount}
                  onChange={(e) => handleSliderChange(e.target.value)}
                  className="w-full accent-brand cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <div className="mt-2 flex justify-between text-[11px] font-medium text-ink-3">
                  <span>500 words (Ultra-tight)</span>
                  <span>2,000 words (Standard)</span>
                  <span>5,000 words (Deep)</span>
                  <span>8,000 words (Exhaustive)</span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-line/40">
                <span className="text-xs font-medium text-ink-3">Quick Presets:</span>
                {[
                  { label: "800w (Quick)", words: 800, mod: "quick-summary" },
                  { label: "2,000w (Standard)", words: 2000, mod: "standard" },
                  { label: "4,500w (Comprehensive)", words: 4500, mod: "comprehensive" },
                  { label: "7,000w (Textbook)", words: 7000, mod: "custom" },
                ].map((p) => (
                  <button
                    key={p.words}
                    type="button"
                    onClick={() => {
                      setTargetWordCount(p.words);
                      setModuleType(p.mod);
                    }}
                    className={cx(
                      "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer border",
                      targetWordCount === p.words
                        ? "border-brand bg-brand text-white shadow-2xs"
                        : "border-line bg-sheet text-ink hover:border-brand/50 hover:bg-brand-tint/30"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 3: Audience Level, Depth Level, Examples & Presentation Style */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Field
                id="param-audience"
                label="Audience Knowledge Level"
                hint="Calibrates vocabulary & Flesch-Kincaid / SMOG scoring"
              >
                {(field) => (
                  <Select
                    {...field}
                    value={audienceLevel}
                    onChange={(e) => setAudienceLevel(e.target.value)}
                  >
                    {audienceLevels.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <Field
                id="param-depth"
                label="Required Depth of Explanation"
                hint="Intuitive vs rigorous collegiate vs formal derivations"
              >
                {(field) => (
                  <Select
                    {...field}
                    value={depthLevel}
                    onChange={(e) => setDepthLevel(e.target.value)}
                  >
                    {depthLevels.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <Field
                id="param-examples"
                label="Preferred Examples Style"
                hint="Theoretical derivations vs applied real-world cases"
              >
                {(field) => (
                  <Select
                    {...field}
                    value={examplePreference}
                    onChange={(e) => setExamplePreference(e.target.value)}
                  >
                    {examplePreferences.map((ep) => (
                      <option key={ep.value} value={ep.value}>
                        {ep.label}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <Field
                id="param-style"
                label="Note Presentation Style"
                hint="Standard academic textbook vs handwritten visual handbook"
              >
                {(field) => (
                  <Select
                    {...field}
                    value={noteStyle}
                    onChange={(e) => setNoteStyle(e.target.value)}
                  >
                    <option value="academic">Standard Academic</option>
                    <option value="handwritten">✍️ Handwritten Handbook</option>
                  </Select>
                )}
              </Field>
            </div>

            {/* Row 4: Specific Learning Objectives Builder */}
            <div className="rounded-xl border border-line bg-sheet/40 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-sm font-semibold text-ink">
                  Specific Learning Objectives ({objectives.length})
                </label>
                <span className="text-fine text-ink-3">
                  Every objective is validated against generated sections
                </span>
              </div>

              <div className="mt-3 flex gap-2">
                <Input
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddObjective(e)}
                  placeholder="e.g. Derive the Byzantine agreement quorum requirement"
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={handleAddObjective}>
                  <FiPlus aria-hidden="true" /> Add
                </Button>
              </div>

              {objectives.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {objectives.map((obj, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-brand/20 bg-brand-tint px-3 py-1.5 text-xs font-medium text-ink"
                    >
                      <span className="font-semibold text-brand">{i + 1}.</span> {obj}
                      <button
                        type="button"
                        onClick={() => handleRemoveObjective(i)}
                        className="ml-1 rounded text-ink-3 hover:text-brand"
                        aria-label="Remove objective"
                      >
                        <FiX aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-fine text-ink-3">
                  No specific objectives added yet. Add custom learning goals above to focus the generator.
                </p>
              )}
            </div>

            {/* Row 5: Prerequisite Concepts Builder */}
            <div className="rounded-xl border border-line bg-sheet/40 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-sm font-semibold text-ink">
                  Prerequisite Concepts ({prerequisites.length})
                </label>
                <span className="text-fine text-ink-3">
                  Background knowledge contextualized in opening sections
                </span>
              </div>

              <div className="mt-3 flex gap-2">
                <Input
                  value={newPrereq}
                  onChange={(e) => setNewPrereq(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddPrereq(e)}
                  placeholder="e.g. Network latency, Basic asynchronous systems"
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={handleAddPrereq}>
                  <FiPlus aria-hidden="true" /> Add
                </Button>
              </div>

              {prerequisites.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {prerequisites.map((p, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink-2"
                    >
                      <span>📌</span> {p}
                      <button
                        type="button"
                        onClick={() => handleRemovePrereq(i)}
                        className="ml-1 rounded text-ink-3 hover:text-ink"
                        aria-label="Remove prerequisite"
                      >
                        <FiX aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-fine text-ink-3">
                  Optional: specify prior concepts expected of the reader.
                </p>
              )}
            </div>

            {/* Row 6: Custom Instructions / Special Focus */}
            <Field
              id="param-custom"
              label="Custom Instructions / Special Focus Areas"
              hint="Syllabus references, exam board requirements (AP, IB, MCAT, GRE, UPSC), or specific case studies"
              optional
            >
              {(field) => (
                <Textarea
                  {...field}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Focus on Paxos vs Raft leader election comparison table; highlight safety invariants..."
                  rows={2}
                />
              )}
            </Field>

            {/* LIVE SCOPE & LENGTH VALIDATION ALERT BANNER */}
            {!scopeValidation.valid ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 sm:flex sm:items-center sm:justify-between sm:gap-4">
                <div className="flex items-start gap-3">
                  <FiAlertCircle className="mt-0.5 shrink-0 text-xl text-amber-600" aria-hidden="true" />
                  <div>
                    <h4 className="text-sm font-semibold">Scope & Length Warning</h4>
                    <p className="mt-1 text-xs text-amber-900 leading-relaxed">
                      {scopeValidation.warning}
                    </p>
                  </div>
                </div>
                <div className="mt-3 shrink-0 sm:mt-0">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-amber-400 bg-white text-xs font-semibold text-amber-900 hover:bg-amber-100"
                    onClick={() => setModuleType(scopeValidation.recommendedUpgrade)}
                  >
                    Upgrade to {labelFor(modules, scopeValidation.recommendedUpgrade)}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-fine font-medium text-emerald-700">
                <FiCheckCircle className="shrink-0 text-emerald-600" aria-hidden="true" />
                Scope confirmed: estimated ~{scopeValidation.estimatedMinWords} words fits comfortably within {selectedModuleObj.label} capacity ({scopeValidation.maxCapacity} words).
              </div>
            )}

            {/* Reference Materials / Files Upload */}
            <div className="border-t border-line pt-6">
              <Field
                id="topic-material"
                label="Reference Material Extract"
                hint="Paste text from papers, textbook chapters, or syllabi (optional)"
                optional
              >
                {(field) => (
                  <Textarea
                    {...field}
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    placeholder="Paste textbook excerpts or lecture notes here..."
                    rows={3}
                  />
                )}
              </Field>

              <div className="mt-4">
                <p className="block text-sm font-semibold text-ink">
                  Attach Reference PDFs <span className="ml-2 font-normal text-ink-3">optional</span>
                </p>
                <div
                  className="mt-2 flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-line-firm bg-sheet/50 px-4 py-4 transition-colors hover:border-ink-3 hover:bg-sheet"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer?.files?.length) {
                      handleFileSelect({ target: { files: e.dataTransfer.files } });
                    }
                  }}
                >
                  <FiUpload className="text-xl text-ink-3" aria-hidden="true" />
                  <p className="text-xs text-ink-3">
                    Drag PDF files here or click to browse (up to 5 files, 10 MB each)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {files.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {files.map((file, i) => (
                      <li
                        key={`${file.name}-${i}`}
                        className="flex items-center gap-3 rounded-lg border border-line bg-sheet px-3 py-2 text-xs"
                      >
                        <FiFile className="shrink-0 text-ink-3" />
                        <span className="min-w-0 flex-1 truncate text-ink">{file.name}</span>
                        <span className="shrink-0 text-ink-3">{(file.size / 1024).toFixed(0)} KB</span>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="rounded p-1 text-ink-3 hover:text-ink"
                        >
                          <FiX />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" variant="accent" disabled={loading}>
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Generating & Auditing QA…
                    </span>
                  ) : generated ? (
                    "Regenerate Notes"
                  ) : (
                    `Generate Notes (${cost} Credits)`
                  )}
                </Button>
                <Button as={Link} to="/notes" variant="quiet" disabled={loading}>
                  Back to Library
                </Button>
              </div>

              <p
                role="status"
                aria-live="polite"
                className={cx(
                  "flex max-w-[48ch] items-center gap-2 text-fine",
                  status?.tone === "bad"
                    ? "font-medium text-brand"
                    : status?.tone === "good"
                      ? "font-medium text-emerald-700"
                      : "text-ink-3",
                )}
              >
                {status?.tone === "good" ? <FiCheckCircle className="shrink-0 text-emerald-600" /> : null}
                {status?.tone === "bad" ? <FiAlertCircle className="shrink-0 text-brand" /> : null}
                {status ? status.text : "Credits are charged only upon successful notes generation."}
              </p>
            </div>
          </form>
        </Panel>

        {/* RESULTS & QUALITY ASSURANCE DASHBOARD */}
        {generated?.content && (
          <div className="space-y-6">
            {/* STUDENT MASTERY & ACTIVE LEARNING HUB */}
            {generated && (
              <Panel as="section" aria-labelledby="study-heading" className="border-brand/20 bg-gradient-to-b from-brand-tint/30 to-sheet/40">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-brand p-2 text-white">
                      <FiBookOpen className="text-lg" />
                    </div>
                    <div>
                      <h3 id="study-heading" className="text-lg font-bold text-ink">
                        Student Mastery & Active Learning Hub
                      </h3>
                      <p className="text-xs text-ink-3">
                        Active recall flashcards, high-yield exam traps, and spaced repetition review tracker
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                      ⏱️ ~{Math.max(2, Math.ceil((generated.actualWordCount || 1200) / 200))} min read
                    </span>
                    <button
                      type="button"
                      onClick={() => setStudyHubOpen(!studyHubOpen)}
                      className="rounded p-1 text-ink-3 hover:text-ink"
                      aria-label="Toggle study tools"
                    >
                      {studyHubOpen ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                  </div>
                </div>

                {studyHubOpen && (
                  <div className="mt-5 space-y-6">
                    {/* Active Recall Challenge Flashcards */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-ink-3">
                          🧠 Active Recall Self-Test Flashcards
                        </span>
                        <span className="text-fine text-ink-3">
                          {Object.values(masteredCards).filter(Boolean).length} of{" "}
                          {(generated.learningObjectives?.length || 2)} Mastered
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {(generated.learningObjectives?.length > 0
                          ? generated.learningObjectives.slice(0, 4)
                          : [
                              `Explain the core mechanism of ${generated.topic} without consulting the notes.`,
                              `What are the critical assumptions or boundary conditions under which ${generated.topic} operates?`,
                            ]
                        ).map((objective, idx) => {
                          const isRevealed = Boolean(revealedAnswers[idx]);
                          const isMastered = Boolean(masteredCards[idx]);
                          return (
                            <div
                              key={idx}
                              className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                                isMastered
                                  ? "border-emerald-200 bg-emerald-50/40"
                                  : "border-line bg-white"
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="rounded bg-brand/10 px-2 py-0.5 text-[0.7rem] font-bold text-brand uppercase">
                                    Concept Check {idx + 1}
                                  </span>
                                  {isMastered ? (
                                    <span className="inline-flex items-center gap-1 text-fine font-bold text-emerald-700">
                                      <FiCheck /> Mastered
                                    </span>
                                  ) : null}
                                </div>
                                <p className="mt-2.5 text-xs font-semibold text-ink leading-relaxed">
                                  {objective}
                                </p>
                                {isRevealed && (
                                  <div className="mt-3 rounded-lg border border-line bg-sheet/70 p-2.5 text-[0.75rem] text-ink-2">
                                    <strong className="text-brand">Model Recall Strategy:</strong> State the primary governing principle, describe 2 critical steps or boundary conditions, and verify your answer against an applied edge case.
                                  </div>
                                )}
                              </div>
                              <div className="mt-4 flex items-center justify-between pt-2 border-t border-line/60">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRevealedAnswers((prev) => ({
                                      ...prev,
                                      [idx]: !prev[idx],
                                    }))
                                  }
                                  className="text-xs font-semibold text-brand hover:underline"
                                >
                                  {isRevealed ? "Hide Strategy" : "💡 Reveal Model Strategy"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setMasteredCards((prev) => ({
                                      ...prev,
                                      [idx]: !prev[idx],
                                    }))
                                  }
                                  className={`rounded-full px-2.5 py-1 text-[0.7rem] font-bold transition-colors ${
                                    isMastered
                                      ? "bg-emerald-600 text-white"
                                      : "bg-line text-ink-3 hover:bg-line-firm hover:text-ink"
                                  }`}
                                >
                                  {isMastered ? "Mastered" : "Mark as Mastered"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Common Exam Traps & Pitfalls */}
                    <div className="rounded-xl border border-line bg-white p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-base">⚠️</span>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-ink-3">
                          Common Exam Traps & Examiner Pitfalls ({generated.domain ? generated.domain.toUpperCase() : "GENERAL"})
                        </h4>
                      </div>
                      <div className="mt-3 space-y-2.5">
                        <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 p-3 text-xs">
                          <strong className="text-amber-900">Trap 1: Passive Familiarity vs. Active Retrieval</strong>
                          <p className="mt-0.5 text-amber-950/80">
                            Re-reading notes creates the illusion of mastery. Always test yourself by deriving key formulas and explaining concepts out loud without looking.
                          </p>
                        </div>
                        <div className="rounded-lg border border-rose-200/80 bg-rose-50/50 p-3 text-xs">
                          <strong className="text-rose-900">Trap 2: Boundary Condition Blindness</strong>
                          <p className="mt-0.5 text-rose-950/80">
                            Examiners frequently construct tricky questions testing edge cases where standard linear approximations break down. Always state your assumptions first.
                          </p>
                        </div>
                        <div className="rounded-lg border border-blue-200/80 bg-blue-50/50 p-3 text-xs">
                          <strong className="text-blue-900">Trap 3: Terminology Ambiguity & Unit Drift</strong>
                          <p className="mt-0.5 text-blue-950/80">
                            Define terms using precise domain definitions (consult the Running Glossary). In calculations, verify dimensional consistency at each step.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Spaced Repetition Mastery Tracker */}
                    <div className="rounded-xl border border-line bg-white p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-ink-3">
                        📅 Spaced Repetition Review Schedule
                      </h4>
                      <p className="mt-1 text-xs text-ink-3">
                        Check off each revision milestone to anchor this material into long-term memory:
                      </p>
                      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {[
                          { key: "day1", label: "Day 1 — Immediate Retrieval", desc: "Close the notes now. Spend 3 minutes jotting down the 3 biggest takeaways from memory." },
                          { key: "day3", label: "Day 3 — Active Recall Self-Test", desc: "Re-answer the concept check flashcards above without checking the model hints." },
                          { key: "day7", label: "Day 7 — Applied Transfer", desc: "Explain this topic out loud to a peer or work through 2 practice problems." },
                          { key: "day14", label: "Day 14 — Exam-Ready Quick Drill", desc: "Rapidly scan the Running Glossary to ensure immediate, effortless recall." },
                        ].map((m) => {
                          const checked = Boolean(spacedChecklist[m.key]);
                          return (
                            <button
                              key={m.key}
                              type="button"
                              onClick={() =>
                                setSpacedChecklist((prev) => ({
                                  ...prev,
                                  [m.key]: !prev[m.key],
                                }))
                              }
                              className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                                checked
                                  ? "border-emerald-200 bg-emerald-50/50"
                                  : "border-line bg-sheet/30 hover:border-line-firm"
                              }`}
                            >
                              <div
                                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                                  checked
                                    ? "border-emerald-600 bg-emerald-600 text-white"
                                    : "border-line-firm bg-white"
                                }`}
                              >
                                {checked ? <FiCheck className="h-3 w-3" /> : null}
                              </div>
                              <div>
                                <span className={`text-xs font-bold ${checked ? "text-emerald-900 line-through" : "text-ink"}`}>
                                  {m.label}
                                </span>
                                <p className="mt-0.5 text-[0.7rem] text-ink-3 leading-relaxed">
                                  {m.desc}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </Panel>
            )}

            {/* EXPORT CENTER BAR */}
            <Panel as="section" aria-labelledby="export-heading" className="bg-sheet/60">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 id="export-heading" className="text-base font-bold text-ink">
                    Export Center
                  </h3>
                  <p className="text-xs text-ink-3">
                    Download notes in clean, export-ready formats or copy to clipboard
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleExport("markdown")}
                    disabled={exportBusy}
                    className="text-xs"
                  >
                    <FiFile /> Markdown (.md)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleExport("html")}
                    disabled={exportBusy}
                    className="text-xs"
                  >
                    🌐 HTML (.html)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleExport("latex")}
                    disabled={exportBusy}
                    className="text-xs"
                  >
                    📐 LaTeX (.tex)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleExport("text")}
                    disabled={exportBusy}
                    className="text-xs"
                  >
                    📝 Plain Text (.txt)
                  </Button>
                  <Button
                    type="button"
                    variant="accent"
                    onClick={() =>
                      handleExport("pdf", {
                        template:
                          noteStyle === "handwritten" ||
                          generated?.noteStyle === "handwritten"
                            ? "sketchbook"
                            : "indigo",
                      })
                    }
                    disabled={exportBusy}
                    className="text-xs"
                  >
                    {noteStyle === "handwritten" ||
                    generated?.noteStyle === "handwritten" ? (
                      <span className="inline-flex items-center gap-1">
                        <FiDownload /> 📓 Handwritten Handbook (.pdf)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <FiDownload /> PDF (.pdf)
                      </span>
                    )}
                  </Button>
                  {noteStyle === "handwritten" ||
                  generated?.noteStyle === "handwritten" ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        handleExport("pdf", { template: "indigo" })
                      }
                      disabled={exportBusy}
                      className="text-xs"
                    >
                      📄 Academic Standard (.pdf)
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        handleExport("pdf", { template: "sketchbook" })
                      }
                      disabled={exportBusy}
                      className="text-xs"
                    >
                      📓 Handwritten Style (.pdf)
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyMarkdown}
                    className="text-xs"
                  >
                    {copiedFormat === "markdown" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <FiCheck /> Copied!
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <FiCopy /> Copy Markdown
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </Panel>

            {/* NOTES CONTENT VIEWER WITH INTERACTIVE TOC */}
            <Panel as="section" aria-labelledby="notes-viewer-heading" className="p-0 overflow-hidden">
              <div className="border-b border-line bg-sheet/40 p-4 sm:px-8 sm:py-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-brand">
                    {selectedDomainObj.icon} {domain.toUpperCase()} &bull; {selectedModuleObj.label}
                  </span>
                  <h2 id="notes-viewer-heading" className="text-xl font-bold text-ink">
                    {generated.topic}
                  </h2>
                </div>
                <div className="text-xs text-ink-3">
                  {generated.actualWordCount?.toLocaleString("en-IN")} words &bull; {generated.toc?.length || 0} sections
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4">
                {/* Auto-generated Table of Contents Rail (for modules longer than Quick Summary) */}
                {generated.toc && generated.toc.length > 0 && moduleType !== "quick-summary" && (
                  <aside className="border-r border-line bg-sheet/20 p-5 lg:col-span-1">
                    <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-3">
                      <FiList /> Table of Contents
                    </h4>
                    <nav className="mt-3 max-h-[60vh] overflow-auto space-y-1 text-xs">
                      {generated.toc.map((item, idx) => (
                        <a
                          key={idx}
                          href={`#${item.anchor}`}
                          className={cx(
                            "block rounded px-2 py-1 text-ink-2 hover:bg-brand-tint hover:text-brand transition-colors",
                            item.level === 3 ? "pl-5 text-fine text-ink-3" : "font-medium"
                          )}
                        >
                          {item.title}
                        </a>
                      ))}
                    </nav>
                  </aside>
                )}

                {/* Main Note Content */}
                <div className={cx(
                  "p-6 sm:p-8 overflow-auto max-h-[75vh]",
                  generated.toc?.length > 0 && moduleType !== "quick-summary" ? "lg:col-span-3" : "lg:col-span-4"
                )}>
                  <NoteContent content={generated.content} />
                </div>
              </div>
            </Panel>
          </div>
        )}
      </div>

      <GenerateNotesDialog
        open={editing}
        onClose={() => setEditing(false)}
        initial={{
          topic,
          subject,
          domain,
          moduleType,
          audienceLevel,
          examplePreference,
          depthLevel,
          learningObjectives: objectives,
          prerequisites,
          customInstructions,
          diagrams: includeDiagrams,
        }}
      />
    </Container>
  );
};

export default TopicForm;
