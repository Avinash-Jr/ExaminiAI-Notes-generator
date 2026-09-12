import { useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import Button from "./ui/Button.jsx";
import Modal from "./ui/Modal.jsx";
import { Field, Input, Select } from "./ui/Field.jsx";
import {
  domains,
  modules,
  audienceLevels,
  estimateCredits,
  formats,
  readDefaults,
} from "../lib/noteDefaults.js";

/**
 * The brief: what ExaminAI is being asked to write, collected before any
 * credits are spent. Submitting hands it to the topic form, which is where the
 * material goes in and the generation actually happens.
 */
export default function GenerateNotesDialog({ open, onClose, initial }) {
  const { userData } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const formId = useId();

  const [brief, setBrief] = useState(() => ({
    topic: "",
    subject: "",
    domain: "general",
    moduleType: "standard",
    audienceLevel: "intermediate",
    examplePreference: "balanced",
    depthLevel: "rigorous",
    learningObjectives: [],
    prerequisites: [],
    customInstructions: "",
    targetWordCount: 2000,
    ...readDefaults(),
    ...initial,
  }));

  const [error, setError] = useState(null);

  const close = () => {
    setError(null);
    onClose();
  };

  const set = (key) => (value) => {
    setBrief((current) => ({ ...current, [key]: value }));
    setError(null);
  };

  const credits = userData?.credits ?? 0;
  const cost = estimateCredits(brief);
  const short = cost - credits;

  const handleSubmit = (event) => {
    event.preventDefault();

    const topic = brief.topic.trim();
    if (topic.length < 3) {
      setError("Name what the notes should cover — a topic, a chapter, a paper.");
      return;
    }

    close();

    navigate("/topic-form", {
      state: {
        brief: {
          ...brief,
          topic,
          subject: brief.subject.trim(),
        },
      },
    });
  };

  if (!userData) {
    return (
      <Modal
        open={open}
        onClose={close}
        title="Sign in to generate notes"
        description="Generating spends credits, so it needs an account. New accounts start with 100."
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={close}>
              Not now
            </Button>

            <Button as={Link} to="/auth" variant="accent" onClick={close}>
              Sign in
            </Button>
          </div>
        }
      >
        <p className="font-read text-read text-ink-2">
          Sign in with Google and you can come straight back here. Nothing you
          type is lost — the form starts fresh either way.
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Generate notes"
      description="Select your subject domain and module depth. You can refine objectives on the next screen."
      footer={
        <div className="flex flex-col gap-3 sm:flex-row-reverse sm:items-center sm:justify-between">
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>

            <Button type="submit" form={formId} variant="accent">
              Continue to Topic Form
            </Button>
          </div>

          <p
            data-numeric
            className={
              short > 0
                ? "text-fine font-medium text-brand"
                : "text-fine text-ink-3"
            }
          >
            {short > 0
              ? `${cost} credits needed — you have ${credits}.`
              : `About ${cost} credits of your ${credits}.`}
          </p>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-5">
        <Field
          id="brief-topic"
          label="What should the notes cover?"
          hint="A topic, a chapter title, or the subject concept."
          error={error}
        >
          {(field) => (
            <Input
              {...field}
              value={brief.topic}
              onChange={(event) => set("topic")(event.target.value)}
              placeholder="e.g. Distributed Consensus Algorithms, French Revolution..."
              autoComplete="off"
            />
          )}
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="brief-domain" label="Subject Domain">
            {(field) => (
              <Select
                {...field}
                value={brief.domain}
                onChange={(event) => set("domain")(event.target.value)}
              >
                {domains.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.icon} {d.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field id="brief-subject" label="Subject / Field" optional>
            {(field) => (
              <Input
                {...field}
                value={brief.subject}
                onChange={(event) => set("subject")(event.target.value)}
                placeholder="e.g. Computer Science, History"
                autoComplete="off"
              />
            )}
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="brief-module" label="Module Depth & Length">
            {(field) => (
              <Select
                {...field}
                value={brief.moduleType}
                onChange={(event) => set("moduleType")(event.target.value)}
              >
                {modules.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label} ({m.range})
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field id="brief-audience" label="Target Audience Level">
            {(field) => (
              <Select
                {...field}
                value={brief.audienceLevel}
                onChange={(event) => set("audienceLevel")(event.target.value)}
              >
                {audienceLevels.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <div className="flex items-start gap-3 border-t border-line pt-4">
          <input
            id="brief-diagrams"
            type="checkbox"
            checked={brief.diagrams}
            onChange={(event) => set("diagrams")(event.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-brand"
          />

          <div className="min-w-0">
            <label
              htmlFor="brief-diagrams"
              className="block text-sm font-semibold text-ink"
            >
              Include diagrams & visual schematics
            </label>

            <p className="mt-0.5 text-fine text-ink-3">
              Mermaid flowcharts, architecture diagrams, and concept maps.
            </p>
          </div>
        </div>
      </form>
    </Modal>
  );
}
