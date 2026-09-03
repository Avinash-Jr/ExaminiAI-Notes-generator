import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiSearch, FiStar } from "react-icons/fi";

import Button from "../components/ui/Button.jsx";
import Chip from "../components/ui/Chip.jsx";
import Container from "../components/ui/Container.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import MarginRail from "../components/ui/MarginRail.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Panel from "../components/ui/Panel.jsx";
import { Select } from "../components/ui/Field.jsx";
import allNotes from "../data/notes.js";

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
    compare: (a, b) => b.words - a.words,
  },
};

const ALL = "All subjects";

const subjects = [ALL, ...new Set(allNotes.map((note) => note.subject))];

const Notes = () => {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState(ALL);
  const [sort, setSort] = useState("newest");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return allNotes
      .filter((note) => subject === ALL || note.subject === subject)
      .filter(
        (note) =>
          !needle ||
          `${note.title} ${note.subject} ${note.excerpt}`
            .toLowerCase()
            .includes(needle),
      )
      .sort(sorts[sort].compare);
  }, [query, subject, sort]);

  const filtersApplied = query.trim() !== "" || subject !== ALL;

  return (
    <Container className="py-14 sm:py-20">
      <PageHeader
        title="Notes"
        standfirst="Every set of notes ExaminAI has generated for you, newest first. Search across titles and subjects, or narrow to one paper."
        actions={
          <Button as={Link} to="/" variant="accent">
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
              onChange={(event) => setQuery(event.target.value)}
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
              onChange={(event) => setSort(event.target.value)}
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

      <p aria-live="polite" className="mt-8 text-fine text-ink-3">
        {filtered.length === allNotes.length
          ? `${allNotes.length} sets of notes`
          : `${filtered.length} of ${allNotes.length} sets of notes`}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title={
              filtersApplied ? "Nothing matched that" : "No notes generated yet"
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
                <Button as={Link} to="/" variant="accent">
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
            <li key={note.id}>
              <NoteCard note={note} />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
};

/**
 * One set of generated notes. Presentational for now: wire the title to a note
 * detail route once `GET /api/notes/:id` exists, rather than adding controls
 * here that cannot do anything yet.
 */
function NoteCard({ note }) {
  const created = new Date(note.createdAt);

  return (
    <Panel as="article" padding="snug" className="transition-colors hover:border-line-firm">
      <MarginRail
        screenReaderLabel="Generated on"
        locator={
          <time dateTime={note.createdAt} title={fullDate.format(created)}>
            {railDate.format(created)}
          </time>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <Chip>{note.subject}</Chip>
          <Chip>{note.kind}</Chip>

          {note.starred ? (
            <span className="inline-flex items-center gap-1 text-fine text-brand">
              <FiStar aria-hidden="true" />
              Starred
            </span>
          ) : null}
        </div>

        <h2 className="mt-3 text-lg font-bold tracking-tight text-ink sm:text-xl">
          {note.title}
        </h2>

        <p className="mt-2 max-w-[64ch] font-read text-[1rem] leading-relaxed text-ink-2">
          {note.excerpt}
        </p>

        <div className="mt-4 flex flex-wrap gap-x-7 gap-y-1 text-fine text-ink-3">
          <span data-numeric>{note.words.toLocaleString("en-IN")} words</span>
          <span data-numeric>{note.credits} credits spent</span>
          <span>from {note.source}</span>
        </div>
      </MarginRail>
    </Panel>
  );
}

export default Notes;
