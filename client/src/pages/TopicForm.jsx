import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FiDownload, FiRefreshCw, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

import Button from "../components/ui/Button.jsx";
import Chip from "../components/ui/Chip.jsx";
import Container from "../components/ui/Container.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import GenerateNotesDialog from "../components/GenerateNotesDialog.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Panel from "../components/ui/Panel.jsx";
import { Field, Textarea } from "../components/ui/Field.jsx";
import { depths, estimateCredits, formats, labelFor } from "../lib/noteDefaults.js";
import { NoteContent } from "../lib/noteRender.jsx";
import { cx } from "../lib/cx.js";
import { generateNotes, downloadNotePdf } from "../services/api.js";
import { setUserData } from "../redux/userSlice.js";

const heading = "text-xl font-bold tracking-tight text-ink sm:text-2xl";

const TopicForm = () => {
  const { state } = useLocation();
  const brief = state?.brief ?? null;
  const dispatch = useDispatch();
  const { userData } = useSelector((s) => s.user);

  const [material, setMaterial] = useState("");
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const cost = brief ? estimateCredits(brief) : 0;

  const handleGenerate = async (event) => {
    event.preventDefault();
    if (!userData) { setStatus({ tone: "bad", text: "You must be signed in to generate notes." }); return; }
    setLoading(true); setGenerated(null);
    setStatus({ tone: "info", text: "Generating your notes — this takes a few seconds…" });
    try {
      const payload = {
        topic: brief.topic, subject: brief.subject || brief.topic, format: brief.format,
        examType: brief.depth, revisionMode: brief.depth === "tight",
        includeDiagrams: brief.diagrams ?? false, includeCharts: false,
        material: material.trim() || undefined,
      };
      const result = await generateNotes(payload);
      if (result.creditRemaining !== undefined && userData) dispatch(setUserData({ ...userData, credits: result.creditRemaining }));
      const notesDoc = result.notes || {};
      const content = notesDoc.content || result.data?.text || "";
      setGenerated({ content, noteId: result.noteId, creditRemaining: result.creditRemaining, topic: notesDoc.topic || brief.topic, charged: result.charged });
      setStatus({ tone: "good", text: `Success — ${result.creditsCharged ?? cost} credits charged. ${result.creditRemaining} remaining. Scroll down to read your notes.` });
    } catch (error) {
      const msg = error.message || "Something went wrong. Please try again.";
      const charged = error.charged === true; const retryable = error.retryable !== false;
      setStatus({ tone: "bad", text: charged ? msg : `${msg}${retryable ? " — you were not charged, you can retry." : ""}`, retryable: !charged && retryable });
    } finally { setLoading(false); }
  };

  const handleDownloadPdf = async () => {
    if (!generated?.noteId) return;
    setPdfBusy(true);
    try { await downloadNotePdf(generated.noteId, generated.topic); }
    catch (e) { setStatus({ tone: "bad", text: e.message || "PDF download failed. Please try again." }); }
    finally { setPdfBusy(false); }
  };
  const handleRetry = (e) => handleGenerate(e);

  if (!brief) {
    return (
      <Container className="py-14 sm:py-20">
        <PageHeader title="New notes" standfirst="Say what the notes should cover, then hand ExaminAI the material to work from." />
        <div className="mt-10"><EmptyState title="Start with a brief" action={<Button variant="accent" onClick={() => setEditing(true)}>Generate notes</Button>}>A refresh loses what you were about to make. Open the form again and it takes a moment to fill in.</EmptyState></div>
        <GenerateNotesDialog open={editing} onClose={() => setEditing(false)} />
      </Container>
    );
  }

  return (
    <Container className="py-14 sm:py-20">
      <PageHeader
        title="New notes"
        standfirst="Check the brief, add the material to work from, and generate."
        meta={[{ label: "Format", value: labelFor(formats, brief.format) }, { label: "Detail", value: labelFor(depths, brief.depth) }, { label: "Diagrams", value: brief.diagrams ? "Included" : "None" }]}
        actions={<Button variant="outline" onClick={() => setEditing(true)}>Change the brief</Button>}
      />
      <div className="mt-10 space-y-6">
        <Panel as="section" aria-labelledby="brief-heading">
          <h2 id="brief-heading" className={heading}>The brief</h2>
          <p className="mt-4 max-w-[54ch] font-read text-2xl leading-snug font-semibold text-ink">{brief.topic}</p>
          {brief.subject ? <div className="mt-4"><Chip>{brief.subject}</Chip></div> : null}
        </Panel>
        <Panel as="section" aria-labelledby="material-heading">
          <h2 id="material-heading" className={heading}>Your material</h2>
          <p className="mt-3 max-w-[58ch] font-read text-read text-ink-2">Paste the chapter, your lecture notes, or a syllabus extract. Leave it empty and ExaminAI works from the topic alone.</p>
          <form onSubmit={handleGenerate} className="mt-7">
            <Field id="topic-material" label="Material to work from" hint="Plain text. Slide and PDF upload is not wired up yet." optional>
              {(field) => <Textarea {...field} value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Paste the text here…" />}
            </Field>
            <p data-numeric className="mt-2 text-fine text-ink-3">{material.trim() ? `${material.trim().split(/\s+/).length.toLocaleString("en-IN")} words pasted` : "Nothing pasted yet"}</p>
            <div className="mt-8 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" variant="accent" disabled={loading}>
                  {loading ? <span className="inline-flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />Generating…</span> : generated ? "Regenerate" : `Generate for ${cost} credits`}
                </Button>
                <Button as={Link} to="/notes" variant="quiet" disabled={loading}>Back to notes</Button>
              </div>
              <p role="status" aria-live="polite" className={cx("flex max-w-[46ch] items-center gap-2 text-fine", status?.tone === "bad" ? "font-medium text-brand" : status?.tone === "good" ? "font-medium text-green-600" : "text-ink-3")}>
                {status?.tone === "good" ? <FiCheckCircle aria-hidden="true" className="shrink-0" /> : null}
                {status?.tone === "bad" ? <FiAlertCircle aria-hidden="true" className="shrink-0" /> : null}
                {status ? status.text : "Nothing has been spent yet — credits are charged only after success."}
              </p>
            </div>
            {status?.retryable ? <div className="mt-4"><Button type="button" variant="outline" onClick={handleRetry} disabled={loading}><FiRefreshCw aria-hidden="true" /> Retry — no extra charge for the failed attempt</Button></div> : null}
          </form>
        </Panel>

        {/* Generated notes — no raw HTML shown; images, mermaid, and charts are real visuals */}
        {generated?.content ? (
          <Panel as="section" aria-labelledby="result-heading" padding="snug" className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="result-heading" className={heading}>Your notes</h2>
              <Button variant="accent" onClick={handleDownloadPdf} disabled={pdfBusy}><FiDownload aria-hidden="true" />{pdfBusy ? "Preparing PDF…" : "Download PDF"}</Button>
            </div>
            <p className="mt-2 text-fine text-ink-3">Generated for &ldquo;{generated.topic}&rdquo; — clean, printable, and saved to your notes.</p>
            <div className="mt-6 max-h-[70vh] overflow-auto rounded-xl border border-line bg-white p-6 sm:p-8" style={{ overflowWrap: "anywhere" }}>
              <NoteContent content={generated.content} />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button as={Link} to="/notes" variant="outline">View all notes</Button>
              <Button variant="quiet" onClick={handleDownloadPdf} disabled={pdfBusy}><FiDownload aria-hidden="true" /> Download again</Button>
            </div>
          </Panel>
        ) : null}
      </div>
      <GenerateNotesDialog open={editing} onClose={() => setEditing(false)} initial={brief} />
    </Container>
  );
};

export default TopicForm;
