import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

import Button from "../components/ui/Button.jsx";
import Chip from "../components/ui/Chip.jsx";
import Container from "../components/ui/Container.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import MarginRail from "../components/ui/MarginRail.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Panel from "../components/ui/Panel.jsx";
import { getActivity } from "../services/api.js";

const clock = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const longDay = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const ALL = "All activity";

/** Group events into days, keeping the newest-first order they arrive in. */
function groupByDay(events) {
  const days = new Map();

  for (const event of events) {
    const key = event.at.slice(0, 10);

    if (!days.has(key)) days.set(key, []);
    days.get(key).push(event);
  }

  return [...days.entries()].map(([day, items]) => ({ day, items }));
}

/** "Today" and "Yesterday" are easier to place than a date. */
function dayLabel(day) {
  const today = new Date();
  const midnight = (date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  const dayStart = midnight(new Date(`${day}T00:00:00`));
  const diff = Math.round((midnight(today) - dayStart) / 86_400_000);

  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";

  return longDay.format(new Date(`${day}T00:00:00`));
}

const History = () => {
  const { userData } = useSelector((state) => state.user);
  const [kind, setKind] = useState(ALL);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    if (!userData) {
      setAllEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getActivity({ limit: 200 });
      setAllEvents(data || []);
    } catch (err) {
      console.error("Failed to load activity:", err);
      setError("Could not load your activity. Please try again.");
      setAllEvents([]);
    } finally {
      setLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Derive unique kinds from fetched data
  const kinds = useMemo(() => {
    const uniqueKinds = [...new Set(allEvents.map((e) => e.kind))];
    return [ALL, ...uniqueKinds];
  }, [allEvents]);

  const days = useMemo(() => {
    const filtered =
      kind === ALL
        ? allEvents
        : allEvents.filter((event) => event.kind === kind);

    return groupByDay(filtered);
  }, [kind, allEvents]);

  const count = days.reduce((total, day) => total + day.items.length, 0);

  // Not signed in
  if (!userData) {
    return (
      <Container className="py-14 sm:py-20">
        <PageHeader
          title="History"
          standfirst="A record of everything that has happened on your account — what you generated, what you exported, and what each of it cost."
        />
        <div className="mt-10">
          <EmptyState title="Sign in to see your history">
            Your activity log appears here once you have an account.
          </EmptyState>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-14 sm:py-20">
      <PageHeader
        title="History"
        standfirst="A record of everything that has happened on your account — what you generated, what you exported, and what each of it cost."
      />

      {loading ? (
        <div className="mt-14 flex items-center justify-center">
          <div className="text-ink-3 text-sm font-medium">Loading activity…</div>
        </div>
      ) : error ? (
        <Panel padding="snug" className="mt-10">
          <p className="text-sm text-red-700">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchEvents}>
            Retry
          </Button>
        </Panel>
      ) : (
        <>
          {allEvents.length > 0 && (
            <Panel padding="snug" className="mt-10">
              <h2 className="text-sm font-semibold text-ink">Filter by activity</h2>

              <div className="mt-3 flex flex-wrap gap-2">
                {kinds.map((name) => (
                  <Chip
                    key={name}
                    as="button"
                    type="button"
                    active={kind === name}
                    aria-pressed={kind === name}
                    onClick={() => setKind(name)}
                  >
                    {name}
                  </Chip>
                ))}
              </div>
            </Panel>
          )}

          <p aria-live="polite" className="mt-8 text-fine text-ink-3">
            {allEvents.length === 0
              ? "No activity yet"
              : kind === ALL
                ? `${count} events`
                : `${count} of ${allEvents.length} events`}
          </p>

          {count === 0 ? (
            <div className="mt-4">
              <EmptyState
                title={
                  allEvents.length === 0
                    ? "No activity yet"
                    : "Nothing of that kind yet"
                }
                action={
                  allEvents.length > 0 ? (
                    <Button variant="outline" onClick={() => setKind(ALL)}>
                      Show all activity
                    </Button>
                  ) : undefined
                }
              >
                {allEvents.length === 0
                  ? "Once you generate or export something, it turns up here with the credits it used."
                  : "Once you generate or export something of this kind, it turns up here."}
              </EmptyState>
            </div>
          ) : (
            <div className="mt-4 space-y-12">
              {days.map(({ day, items }) => (
                <section key={day} aria-labelledby={`day-${day}`}>
                  <h2
                    id={`day-${day}`}
                    className="border-b border-line pb-3 text-sm font-semibold text-ink"
                  >
                    {dayLabel(day)}
                  </h2>

                  <ol className="mt-6 space-y-6">
                    {items.map((event) => (
                      <li key={event.id}>
                        <Event event={event} />
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      <Panel surface="tint" padding="snug" className="mt-14">
        <p className="font-read text-read text-ink-2">
          History keeps the last 12 months. Older entries are removed
          automatically — see{" "}
          <Link
            to="/privacy"
            className="font-semibold text-brand underline decoration-1 underline-offset-4 hover:text-brand-deep"
          >
            how long we keep things
          </Link>
          .
        </p>
      </Panel>
    </Container>
  );
};

/**
 * One entry in the log. The time sits in the rail and the hairline running
 * down it is the timeline, so no extra timeline decoration is needed.
 */
function Event({ event }) {
  const at = new Date(event.at);

  return (
    <MarginRail
      screenReaderLabel="At"
      locator={
        <time dateTime={event.at} data-numeric>
          {clock.format(at)}
        </time>
      }
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <Chip>{event.kind}</Chip>

        {event.credits !== 0 ? (
          <span
            data-numeric
            className={
              event.credits > 0
                ? "text-fine font-semibold text-brand"
                : "text-fine text-ink-3"
            }
          >
            {event.credits > 0 ? `+${event.credits}` : event.credits} credits
          </span>
        ) : null}
      </div>

      <h3 className="mt-2 font-semibold text-ink">{event.title}</h3>

      <p className="mt-1 text-sm text-ink-3">{event.detail}</p>
    </MarginRail>
  );
}

export default History;
