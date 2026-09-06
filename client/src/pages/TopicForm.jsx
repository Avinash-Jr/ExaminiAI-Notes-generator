import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import Button from "../components/ui/Button.jsx";
import Chip from "../components/ui/Chip.jsx";
import Container from "../components/ui/Container.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import GenerateNotesDialog from "../components/GenerateNotesDialog.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Panel from "../components/ui/Panel.jsx";
import { Field, Textarea } from "../components/ui/Field.jsx";
import {
  depths,
  estimateCredits,
  formats,
  labelFor,
} from "../lib/noteDefaults.js";
import { cx } from "../lib/cx.js";

const heading = "text-xl font-bold tracking-tight text-ink sm:text-2xl";

/**
 * Where a generation is set up. The brief arrives in router state from the
 * generate dialog; this page takes the material and spends the credits.
 *
 * Arriving without a brief is normal — a refresh drops router state, and people
 * bookmark things — so the page opens the dialog again rather than erroring.
 */
const TopicForm = () => {
  const { state } = useLocation();
  const brief = state?.brief ?? null;

  const [material, setMaterial] = useState("");
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(null);

  const cost = brief ? estimateCredits(brief) : 0;

  const handleGenerate = (event) => {
    event.preventDefault();

    /* No generation endpoint exists yet, and saying "done" when nothing was
       generated is worse than saying nothing happened. */
    setStatus({
      tone: "bad",
      text: "Generating is not connected yet — the server has no POST /api/notes/generate. Nothing was sent and no credits were spent.",
    });
  };

  if (!brief) {
    return (
      <Container className="py-14 sm:py-20">
        <PageHeader
          title="New notes"
          standfirst="Say what the notes should cover, then hand ExaminAI the material to work from."
        />

        <div className="mt-10">
          <EmptyState
            title="Start with a brief"
            action={
              <Button variant="accent" onClick={() => setEditing(true)}>
                Generate notes
              </Button>
            }
          >
            A refresh loses what you were about to make. Open the form again and
            it takes a moment to fill in.
          </EmptyState>
        </div>

        <GenerateNotesDialog
          open={editing}
          onClose={() => setEditing(false)}
        />
      </Container>
    );
  }

  return (
    <Container className="py-14 sm:py-20">
      <PageHeader
        title="New notes"
        standfirst="Check the brief, add the material to work from, and generate."
        meta={[
          { label: "Format", value: labelFor(formats, brief.format) },
          { label: "Detail", value: labelFor(depths, brief.depth) },
          { label: "Diagrams", value: brief.diagrams ? "Included" : "None" },
        ]}
        actions={
          <Button variant="outline" onClick={() => setEditing(true)}>
            Change the brief
          </Button>
        }
      />

      <div className="mt-10 space-y-6">
        <Panel as="section" aria-labelledby="brief-heading">
          <h2 id="brief-heading" className={heading}>
            The brief
          </h2>

          <p className="mt-4 max-w-[54ch] font-read text-2xl leading-snug font-semibold text-ink">
            {brief.topic}
          </p>

          {brief.subject ? (
            <div className="mt-4">
              <Chip>{brief.subject}</Chip>
            </div>
          ) : null}
        </Panel>

        <Panel as="section" aria-labelledby="material-heading">
          <h2 id="material-heading" className={heading}>
            Your material
          </h2>

          <p className="mt-3 max-w-[58ch] font-read text-read text-ink-2">
            Paste the chapter, your lecture notes, or a syllabus extract. Leave
            it empty and ExaminAI works from the topic alone — usually broader,
            and less like your course.
          </p>

          <form onSubmit={handleGenerate} className="mt-7">
            <Field
              id="topic-material"
              label="Material to work from"
              hint="Plain text. Slide and PDF upload is not wired up yet."
              optional
            >
              {(field) => (
                <Textarea
                  {...field}
                  value={material}
                  onChange={(event) => setMaterial(event.target.value)}
                  placeholder="Paste the text here…"
                />
              )}
            </Field>

            <p data-numeric className="mt-2 text-fine text-ink-3">
              {material.trim()
                ? `${material.trim().split(/\s+/).length.toLocaleString("en-IN")} words pasted`
                : "Nothing pasted yet"}
            </p>

            <div className="mt-8 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" variant="accent">
                  Generate for {cost} credits
                </Button>

                <Button as={Link} to="/notes" variant="quiet">
                  Back to notes
                </Button>
              </div>

              {/* Present from first render so the live region can announce. */}
              <p
                role="status"
                className={cx(
                  "max-w-[46ch] text-fine",
                  status?.tone === "bad"
                    ? "font-medium text-brand"
                    : "text-ink-3",
                )}
              >
                {status ? status.text : "Nothing has been spent yet."}
              </p>
            </div>
          </form>
        </Panel>
      </div>

      {/* Seeded with the brief on screen, so "Change the brief" opens what is
          already there rather than an empty form. */}
      <GenerateNotesDialog
        open={editing}
        onClose={() => setEditing(false)}
        initial={brief}
      />
    </Container>
  );
};

export default TopicForm;
