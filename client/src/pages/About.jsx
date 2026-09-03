import { Link } from "react-router-dom";

import Button from "../components/ui/Button.jsx";
import Container from "../components/ui/Container.jsx";
import MarginRail from "../components/ui/MarginRail.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Panel from "../components/ui/Panel.jsx";

const steps = [
  {
    heading: "Give it your material",
    body: "Upload slides or a chapter, or paste text straight in. Whatever your course actually set — not a generic syllabus.",
  },
  {
    heading: "Say what you need it for",
    body: "Revision notes, a one-page summary, a diagram, or documentation for a submission. The shape of the output changes with the ask.",
  },
  {
    heading: "Check it, then study from it",
    body: "Notes arrive in seconds and stay in your history. Read them against your textbook first — AI is fast, not infallible.",
  },
];

const suits = [
  "condensing a long chapter into something you can revise from the night before",
  "turning messy lecture slides into structured notes",
  "drawing the diagram you understand but cannot lay out",
  "formatting project documentation to a submittable standard",
];

const doesNot = [
  "replacing the lecture, the textbook or your teacher",
  "guaranteeing a topic will appear in your exam",
  "writing work you will submit as your own where that is against the rules",
  "checking whether a fact is true — that part is still yours",
];

const About = () => {
  return (
    <Container width="doc" className="py-14 sm:py-20">
      <PageHeader
        title="About ExaminAI"
        standfirst="ExaminAI turns the material your course actually set into notes you can revise from. It was built by students who were tired of retyping slides at midnight."
      />

      {/* The one bold moment on the page, in the same dark material as the
          navbar and footer so it reads as part of the app, not an ad. */}
      <Panel surface="panel" className="mt-12">
        <p className="max-w-[40ch] font-read text-2xl leading-snug text-white sm:text-3xl">
          Revision time is the scarcest thing a student has. Nothing in
          ExaminAI should spend it on typing.
        </p>

        <p className="mt-6 max-w-[58ch] font-read text-read text-white/70">
          Every feature gets judged against that: if it does not save you
          minutes you could have spent understanding something, it does not
          ship.
        </p>
      </Panel>

      <section aria-labelledby="how" className="mt-16">
        <h2
          id="how"
          className="text-2xl font-bold tracking-tight text-ink sm:text-3xl"
        >
          How it works
        </h2>

        {/* Numbered because these three genuinely happen in order. */}
        <div className="mt-8 space-y-10">
          {steps.map((step, index) => (
            <MarginRail
              key={step.heading}
              screenReaderLabel="Step"
              locator={
                <span data-numeric className="font-semibold text-ink">
                  {index + 1}
                </span>
              }
            >
              <h3 className="font-semibold text-ink">{step.heading}</h3>

              <p className="mt-2 max-w-[62ch] font-read text-read text-ink-2">
                {step.body}
              </p>
            </MarginRail>
          ))}
        </div>
      </section>

      <section aria-labelledby="fit" className="mt-16">
        <h2
          id="fit"
          className="text-2xl font-bold tracking-tight text-ink sm:text-3xl"
        >
          What it is for, and what it is not
        </h2>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Panel padding="snug">
            <h3 className="font-semibold text-ink">Worth using it for</h3>

            <ul className="doc-prose mt-3 text-[1rem]">
              {suits.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Panel>

          <Panel padding="snug">
            <h3 className="font-semibold text-ink">Not what it does</h3>

            <ul className="doc-prose mt-3 text-[1rem]">
              {doesNot.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Panel>
        </div>
      </section>

      <section aria-labelledby="credits" className="mt-16">
        <h2
          id="credits"
          className="text-2xl font-bold tracking-tight text-ink sm:text-3xl"
        >
          Credits, plainly
        </h2>

        <div className="doc-prose mt-5 max-w-[64ch]">
          <p>
            Every account starts with 100 free credits, which is enough for
            roughly fifteen sets of notes. Generating something spends credits;
            reading, searching and re-downloading what you already have does
            not.
          </p>
          <p>
            The cost of an action is shown before you confirm it, and the exact
            amount each one used is listed in your{" "}
            <Link to="/history">history</Link>. If a generation fails on our
            side, the credits come back.
          </p>
        </div>
      </section>

      {/* TODO: replace this paragraph with the real team — names, roles and a
          line each. Deliberately left unattributed rather than filled with
          invented people. */}
      <section aria-labelledby="who" className="mt-16">
        <h2
          id="who"
          className="text-2xl font-bold tracking-tight text-ink sm:text-3xl"
        >
          Who builds it
        </h2>

        <div className="doc-prose mt-5 max-w-[64ch]">
          <p>
            A small team, working on ExaminAI alongside the degrees that gave us
            the idea. That means we read support mail ourselves, and it means
            the roadmap is shorter and more honest than it would be otherwise.
          </p>
          <p>
            If something is broken, confusing, or missing the one feature that
            would make it useful for your course, tell us. That is genuinely how
            most of this got built.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button as={Link} to="/contact" variant="accent">
            Get in touch
          </Button>

          <Button as={Link} to="/notes" variant="outline">
            See your notes
          </Button>
        </div>
      </section>
    </Container>
  );
};

export default About;
