import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../App.jsx";

import Button from "../components/ui/Button.jsx";
import Container from "../components/ui/Container.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Panel from "../components/ui/Panel.jsx";
import { Field, Input, Select, Textarea } from "../components/ui/Field.jsx";

const topics = [
  "A problem with generated notes",
  "Credits or payment",
  "My account",
  "A privacy or data request",
  "Feedback or a feature idea",
  "Something else",
];

const empty = { name: "", email: "", topic: "", message: "" };

/** Returns a field-keyed map of problems. Empty map means the form is valid. */
function validate(values) {
  const problems = {};

  if (!values.name.trim()) {
    problems.name = "Add your name so we know who we are replying to.";
  }

  if (!values.email.trim()) {
    problems.email = "Add an email address we can reply to.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) {
    problems.email = "That address is missing something — check it over.";
  }

  if (!values.topic) {
    problems.topic = "Pick the closest topic so this reaches the right person.";
  }

  if (values.message.trim().length < 15) {
    problems.message =
      "Tell us a little more — what you expected, and what happened instead.";
  }

  return problems;
}

const Contact = () => {
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));

    /* Clear a field's error as soon as it is being corrected. */
    setErrors((current) => {
      if (!current[field]) return current;

      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const problems = validate(values);
    setErrors(problems);

    if (Object.keys(problems).length > 0) return;

    setStatus("sending");

    try {
      await axios.post(`${serverUrl}/api/contact`, values, { withCredentials: true });
      setStatus("sent");
    } catch (err) {
      console.error("Contact form submission failed:", err);
      const serverMsg = err.response?.data?.error;
      setErrors({ _form: serverMsg || "Something went wrong. Please try again or email us directly." });
      setStatus("idle");
    }
  };

  const problemCount = Object.keys(errors).filter((k) => k !== "_form").length;

  return (
    <Container className="py-14 sm:py-20">
      <PageHeader
        title="Contact us"
        standfirst="A real person reads every message. Tell us what happened and we will get back to you within two working days."
      />

      <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:gap-10">
        <Panel>
          {status === "sent" ? (
            <div role="status">
              <h2 className="text-xl font-bold tracking-tight text-ink">
                Message sent
              </h2>

              <p className="mt-3 max-w-[52ch] font-read text-read text-ink-2">
                It has gone to our inbox with a copy to {values.email}. Expect a
                reply within two working days — sooner if it is about credits
                that went missing.
              </p>

              <Button
                variant="outline"
                className="mt-7"
                onClick={() => {
                  setValues(empty);
                  setStatus("idle");
                }}
              >
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <h2 className="text-xl font-bold tracking-tight text-ink">
                Write to us
              </h2>

              {problemCount > 0 ? (
                <p
                  role="alert"
                  className="mt-4 rounded-chip border border-brand/30 bg-brand-tint px-4 py-3 text-sm text-ink"
                >
                  {problemCount === 1
                    ? "One field needs attention before this can send."
                    : `${problemCount} fields need attention before this can send.`}
                </p>
              ) : null}

              {errors._form ? (
                <p
                  role="alert"
                  className="mt-4 rounded-chip border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
                >
                  {errors._form}
                </p>
              ) : null}

              <div className="mt-6 space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field id="contact-name" label="Your name" error={errors.name}>
                    {(field) => (
                      <Input
                        {...field}
                        name="name"
                        autoComplete="name"
                        value={values.name}
                        onChange={update("name")}
                      />
                    )}
                  </Field>

                  <Field
                    id="contact-email"
                    label="Email address"
                    error={errors.email}
                  >
                    {(field) => (
                      <Input
                        {...field}
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={values.email}
                        onChange={update("email")}
                      />
                    )}
                  </Field>
                </div>

                <Field id="contact-topic" label="Topic" error={errors.topic}>
                  {(field) => (
                    <Select
                      {...field}
                      name="topic"
                      value={values.topic}
                      onChange={update("topic")}
                    >
                      <option value="">Choose the closest one</option>

                      {topics.map((topic) => (
                        <option key={topic} value={topic}>
                          {topic}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>

                <Field
                  id="contact-message"
                  label="Message"
                  hint="If it is about a specific set of notes, include its title."
                  error={errors.message}
                >
                  {(field) => (
                    <Textarea
                      {...field}
                      name="message"
                      value={values.message}
                      onChange={update("message")}
                    />
                  )}
                </Field>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button type="submit" variant="accent" disabled={status === "sending"}>
                  {status === "sending" ? "Sending" : "Send message"}
                </Button>

                <p className="text-fine text-ink-3">
                  We use what you send only to answer you.
                </p>
              </div>
            </form>
          )}
        </Panel>

        <aside aria-labelledby="other-ways" className="space-y-5">
          <Panel padding="snug">
            <h2 id="other-ways" className="font-semibold text-ink">
              Or email directly
            </h2>

            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-ink-3">Anything about the app</dt>
                <dd className="mt-1">
                  <a
                    href="mailto:support@examinai.app"
                    className="font-semibold text-brand underline decoration-1 underline-offset-4 hover:text-brand-deep"
                  >
                    support@examinai.app
                  </a>
                </dd>
              </div>

              <div>
                <dt className="text-ink-3">Your data, or a deletion request</dt>
                <dd className="mt-1">
                  <a
                    href="mailto:privacy@examinai.app"
                    className="font-semibold text-brand underline decoration-1 underline-offset-4 hover:text-brand-deep"
                  >
                    privacy@examinai.app
                  </a>
                </dd>
              </div>

              <div>
                <dt className="text-ink-3">Usual reply time</dt>
                <dd className="mt-1 text-ink" data-numeric>
                  Within 2 working days
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel surface="tint" padding="snug">
            <h2 className="font-semibold text-ink">Before you write</h2>

            <p className="mt-3 font-read text-[1rem] leading-relaxed text-ink-2">
              Credits missing after a purchase usually appear in{" "}
              <Link
                to="/history"
                className="font-semibold text-brand underline decoration-1 underline-offset-4 hover:text-brand-deep"
              >
                your history
              </Link>{" "}
              within a few minutes. If they have not, send the payment reference
              and we will sort it.
            </p>

            <p className="mt-3 text-fine text-ink-3">
              Account and data questions are answered in the{" "}
              <Link
                to="/privacy"
                className="underline decoration-1 underline-offset-4 hover:text-brand"
              >
                privacy policy
              </Link>{" "}
              and the{" "}
              <Link
                to="/terms"
                className="underline decoration-1 underline-offset-4 hover:text-brand"
              >
                terms
              </Link>
              .
            </p>
          </Panel>
        </aside>
      </div>
    </Container>
  );
};

export default Contact;
