import { useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import Button from "./ui/Button.jsx";
import Modal from "./ui/Modal.jsx";
import { Field, Input, Select } from "./ui/Field.jsx";
import { depths, estimateCredits, formats, readDefaults } from "../lib/noteDefaults.js";

/**
 * The brief: what ExaminAI is being asked to write, collected before any
 * credits are spent. Submitting hands it to the topic form, which is where the
 * material goes in and the generation actually happens.
 *
 * Starts from the defaults saved in Settings, so someone who has set those up
 * can open this and press Continue without touching anything. Pass `initial` to
 * reopen it on a brief that already exists.
 */
export default function GenerateNotesDialog({ open, onClose, initial }) {
  const { userData } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const formId = useId();

  /* Defaults are read once per mount, which is once per visit to the page that
     owns this dialog. Changing them means a trip to Settings, and that unmounts
     the page — so there is nothing for an effect to keep in step. */
  const [brief, setBrief] = useState(() => ({
    topic: "",
    subject: "",
    ...readDefaults(),
    ...initial,
  }));

  const [error, setError] = useState(null);

  /* Closing keeps what was typed — a stray click on the backdrop should not
     lose it — but drops the error, which belongs to a submit that is over. */
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

    /* Close first: the topic form is a new screen, and leaving the dialog open
       behind it would trap focus on a page that is no longer there. */
    close();

    navigate("/topic-form", {
      state: { brief: { ...brief, topic, subject: brief.subject.trim() } },
    });
  };

  /* Generating spends credits, and credits belong to an account. Better to say
     so here than to collect a brief that cannot be used. */
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
      description="A few details about what you want. The next screen takes the material itself."
      footer={
        <div className="flex flex-col gap-3 sm:flex-row-reverse sm:items-center sm:justify-between">
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>

            <Button type="submit" form={formId} variant="accent">
              Continue
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
      <form id={formId} onSubmit={handleSubmit} className="space-y-6">
        <Field
          id="brief-topic"
          label="What should the notes cover?"
          hint="A topic, a chapter title, or the name of the paper."
          error={error}
        >
          {(field) => (
            <Input
              {...field}
              value={brief.topic}
              onChange={(event) => set("topic")(event.target.value)}
              placeholder="Thermodynamics — second law and entropy"
              autoComplete="off"
            />
          )}
        </Field>

        <Field id="brief-subject" label="Subject" optional>
          {(field) => (
            <Input
              {...field}
              value={brief.subject}
              onChange={(event) => set("subject")(event.target.value)}
              placeholder="Physics"
              autoComplete="off"
            />
          )}
        </Field>

        <Field id="brief-format" label="Format">
          {(field) => (
            <Select
              {...field}
              value={brief.format}
              onChange={(event) => set("format")(event.target.value)}
            >
              {formats.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          )}
        </Field>

        {/* A select rather than the cards Settings uses: three cards across do
            not fit a phone-width sheet, and the hints fit in the option text. */}
        <Field id="brief-depth" label="How much detail">
          {(field) => (
            <Select
              {...field}
              value={brief.depth}
              onChange={(event) => set("depth")(event.target.value)}
            >
              {depths.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} — {option.hint.toLowerCase()}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <div className="flex items-start gap-3 border-t border-line pt-6">
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
              Include diagrams where they help
            </label>

            <p className="mt-1 text-fine text-ink-3">
              Three credits more, and only where the topic suits one.
            </p>
          </div>
        </div>
      </form>
    </Modal>
  );
}
