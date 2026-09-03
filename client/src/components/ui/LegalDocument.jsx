import Container from "./Container.jsx";
import MarginRail from "./MarginRail.jsx";
import PageHeader from "./PageHeader.jsx";
import Panel from "./Panel.jsx";

/**
 * Renders a numbered policy document. Terms and Privacy share this component
 * so the two read identically and only their content differs.
 *
 * Clauses are numbered because a policy's clauses genuinely are an ordered,
 * cross-referenced sequence — the numbers are how someone cites one back to
 * support. They sit in the margin rail, out of the reading column.
 */
export default function LegalDocument({ doc }) {
  return (
    <Container width="doc" className="py-14 sm:py-20">
      <PageHeader
        title={doc.title}
        standfirst={doc.standfirst}
        meta={[
          { label: "Effective", value: doc.effective },
          { label: "Version", value: doc.version },
        ]}
      />

      {/* Contents: the only navigation aid on the page, so the clause numbers
          in the rail do the rest of the work. */}
      <Panel surface="tint" padding="snug" className="mt-10">
        <h2 className="text-sm font-semibold text-ink">On this page</h2>

        <ol className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {doc.sections.map((section, index) => (
            <li key={section.id} className="text-sm">
              <a
                href={`#${section.id}`}
                className="text-ink-2 underline decoration-transparent underline-offset-4 transition-colors hover:text-brand hover:decoration-brand"
              >
                <span className="mr-2 text-ink-3" data-numeric>
                  {index + 1}
                </span>
                {section.heading}
              </a>
            </li>
          ))}
        </ol>
      </Panel>

      <div className="mt-12 space-y-12 sm:mt-16 sm:space-y-16">
        {doc.sections.map((section, index) => (
          <MarginRail
            key={section.id}
            screenReaderLabel="Section"
            locator={
              <span data-numeric className="font-semibold text-ink">
                {index + 1}
              </span>
            }
          >
            <section id={section.id} aria-labelledby={`${section.id}-heading`}>
              <h2
                id={`${section.id}-heading`}
                className="text-xl font-bold tracking-tight text-ink sm:text-2xl"
              >
                {section.heading}
              </h2>

              <div className="doc-prose mt-4">
                {section.body.map((block, blockIndex) =>
                  Array.isArray(block) ? (
                    <ul key={blockIndex}>
                      {block.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p key={blockIndex}>{block}</p>
                  ),
                )}
              </div>
            </section>
          </MarginRail>
        ))}
      </div>

      <Panel className="mt-16" padding="snug">
        <p className="font-read text-read text-ink-2">
          Something here unclear? Write to{" "}
          <a
            href={`mailto:${doc.contactEmail}`}
            className="font-semibold text-brand underline decoration-1 underline-offset-4 hover:text-brand-deep"
          >
            {doc.contactEmail}
          </a>{" "}
          and a person will answer.
        </p>
      </Panel>
    </Container>
  );
}
