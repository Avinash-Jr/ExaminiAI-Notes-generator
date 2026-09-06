import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Button from "../components/ui/Button.jsx";
import Container from "../components/ui/Container.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Panel from "../components/ui/Panel.jsx";
import { Field, Select } from "../components/ui/Field.jsx";
import { logout } from "../services/api.js";
import {
  CREDITS_PER_SET,
  defaults,
  depths,
  formats,
  readDefaults,
  STORAGE_KEY,
} from "../lib/noteDefaults.js";
import { cx } from "../lib/cx.js";

const sections = [
  { id: "account", label: "Account" },
  { id: "credits", label: "Credits" },
  { id: "defaults", label: "Note defaults" },
  { id: "data", label: "Your data" },
];

const joined = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const heading = "text-xl font-bold tracking-tight text-ink sm:text-2xl";

/** Builds a prefilled mailto so a request arrives with what we need to act on. */
function privacyMail(subject, body) {
  return `mailto:privacy@examinai.app?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const Settings = () => {
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /* `stored` is what is on disk, `draft` is what the form shows. Keeping both
     is what makes "Unsaved changes" honest. */
  const [stored, setStored] = useState(readDefaults);
  const [draft, setDraft] = useState(stored);
  const [status, setStatus] = useState(null);
  const [signingOut, setSigningOut] = useState(false);

  const dirty = !same(draft, stored);

  const change = (key) => (value) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setStatus(null);
  };

  const handleSave = (event) => {
    event.preventDefault();

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));

      setStored(draft);
      setStatus({ tone: "ok", text: "Saved. New notes start from these." });
    } catch {
      setStatus({
        tone: "bad",
        text: "Your browser would not store this — private mode blocks it.",
      });
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);

    await logout(dispatch);

    navigate("/auth", { replace: true });
  };

  /* Everything below belongs to one account, so there is nothing honest to show
     before someone signs in. */
  if (!userData) {
    return (
      <Container className="py-14 sm:py-20">
        <PageHeader
          title="Settings"
          standfirst="Your account, your credits, and the shape ExaminAI gives new notes by default."
        />

        <div className="mt-10">
          <EmptyState
            title="Sign in to change your settings"
            action={
              <Button as={Link} to="/auth" variant="accent">
                Sign in
              </Button>
            }
          >
            Settings belong to an account. Sign in and this page fills with
            yours.
          </EmptyState>
        </div>
      </Container>
    );
  }

  const credits = userData.credits ?? 0;
  const setsLeft = Math.floor(credits / CREDITS_PER_SET);

  return (
    <Container className="py-14 sm:py-20">
      <PageHeader
        title="Settings"
        standfirst="Your account, your credits, and the shape ExaminAI gives new notes by default."
        meta={[
          { label: "Signed in as", value: userData.email },
          { label: "Credits left", value: credits },
        ]}
        actions={
          <Button
            variant="outline"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </Button>
        }
      />

      {/* One column on a phone; a sticky rail of section links from lg up. */}
      <div className="mt-10 gap-10 lg:grid lg:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] lg:items-start">
        <SectionNav />

        <div className="mt-8 space-y-6 lg:mt-0">
          <Panel as="section" id="account" aria-labelledby="account-heading">
            <h2 id="account-heading" className={heading}>
              Account
            </h2>

            <p className="mt-3 max-w-[58ch] font-read text-read text-ink-2">
              These come from the Google account you signed in with. Change them
              there and they follow you here the next time you sign in.
            </p>

            <dl className="mt-7 grid gap-6 sm:grid-cols-2">
              <Detail label="Name" value={userData.name} />
              <Detail label="Email" value={userData.email} />

              <Detail
                label="Member since"
                value={
                  userData.createdAt
                    ? joined.format(new Date(userData.createdAt))
                    : "Not recorded"
                }
              />

              <Detail label="Signed in with" value="Google" />
            </dl>
          </Panel>

          <Panel as="section" id="credits" aria-labelledby="credits-heading">
            <h2 id="credits-heading" className={heading}>
              Credits
            </h2>

            <div className="mt-6 flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-fine text-ink-3">Balance</p>

                <p
                  data-numeric
                  className="mt-1 text-5xl font-extrabold tracking-tight text-ink"
                >
                  {credits}
                </p>

                <p className="mt-2 max-w-[34ch] text-sm text-ink-3">
                  {setsLeft >= 1
                    ? `Roughly ${setsLeft} more ${setsLeft === 1 ? "set" : "sets"} of notes.`
                    : "Not enough for a full set — top up to keep generating."}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button as={Link} to="/pricing" variant="accent">
                  Buy credits
                </Button>

                <Button as={Link} to="/history" variant="outline">
                  See what used them
                </Button>
              </div>
            </div>
          </Panel>

          <Panel as="section" id="defaults" aria-labelledby="defaults-heading">
            <h2 id="defaults-heading" className={heading}>
              Note defaults
            </h2>

            <p className="mt-3 max-w-[58ch] font-read text-read text-ink-2">
              The starting point for every new generation. You can still change
              any of it before you spend a credit.
            </p>

            <form onSubmit={handleSave} className="mt-7">
              <div className="space-y-8">
                <Field
                  id="default-format"
                  label="Default format"
                  hint="What ExaminAI produces unless you pick something else."
                >
                  {(field) => (
                    <Select
                      {...field}
                      value={draft.format}
                      onChange={(event) =>
                        change("format")(event.target.value)
                      }
                    >
                      {formats.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>

                <fieldset>
                  <legend className="text-sm font-semibold text-ink">
                    How much detail
                  </legend>

                  {/* Stacked on a phone, three across from sm up. */}
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {depths.map((option) => (
                      <DepthOption
                        key={option.value}
                        option={option}
                        checked={draft.depth === option.value}
                        onSelect={() => change("depth")(option.value)}
                      />
                    ))}
                  </div>
                </fieldset>

                <div className="space-y-5 border-t border-line pt-7">
                  <Check
                    id="default-diagrams"
                    label="Include diagrams where they help"
                    hint="Costs a little more, and only appears when the topic suits one."
                    checked={draft.diagrams}
                    onChange={change("diagrams")}
                  />

                  <Check
                    id="default-confirm-cost"
                    label="Show the credit cost before generating"
                    hint="Turn this off once you know the prices by heart."
                    checked={draft.confirmCost}
                    onChange={change("confirmCost")}
                  />
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" variant="accent" disabled={!dirty}>
                    Save defaults
                  </Button>

                  <Button
                    type="button"
                    variant="quiet"
                    onClick={() => {
                      setDraft(defaults);
                      setStatus(null);
                    }}
                    disabled={same(draft, defaults)}
                  >
                    Reset to defaults
                  </Button>
                </div>

                {/* Always in the DOM so the live region can announce into it. */}
                <p
                  role="status"
                  className={cx(
                    "text-fine",
                    status?.tone === "bad"
                      ? "font-medium text-brand"
                      : "text-ink-3",
                  )}
                >
                  {status
                    ? status.text
                    : dirty
                      ? "Unsaved changes."
                      : "Everything here is saved."}
                </p>
              </div>
            </form>
          </Panel>

          <Panel as="section" id="data" aria-labelledby="data-heading">
            <h2 id="data-heading" className={heading}>
              Your data
            </h2>

            <p className="mt-3 max-w-[58ch] font-read text-read text-ink-2">
              What we hold and how to be rid of it. The{" "}
              <Link
                to="/privacy"
                className="font-semibold text-brand underline decoration-1 underline-offset-4 hover:text-brand-deep"
              >
                privacy policy
              </Link>{" "}
              has the full detail.
            </p>

            <div className="mt-7 divide-y divide-line border-t border-line">
              <DataRow
                title="Get a copy"
                body="Everything on your account, sent to this address as a file. Usually within two working days."
                action={
                  <Button
                    as="a"
                    size="sm"
                    variant="outline"
                    href={privacyMail(
                      "Data copy request",
                      `Please send a copy of the data held for ${userData.email}.`,
                    )}
                  >
                    Request a copy
                  </Button>
                }
              />

              <DataRow
                title="Delete your account"
                body="Removes the account, the notes on it and any credits left. Credits are not refundable and this cannot be undone."
                action={
                  <Button
                    as="a"
                    size="sm"
                    variant="outline"
                    href={privacyMail(
                      "Account deletion request",
                      `Please delete the account for ${userData.email}, along with its notes.`,
                    )}
                  >
                    Request deletion
                  </Button>
                }
              />
            </div>
          </Panel>
        </div>
      </div>
    </Container>
  );
};

/**
 * Section links. A horizontally scrolling row on a phone — bleeding to the
 * screen edge so it reads as scrollable — and a sticky column from lg up.
 */
function SectionNav() {
  return (
    <nav aria-label="Settings sections" className="lg:sticky lg:top-8">
      <ul className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0">
        {sections.map((section) => (
          <li key={section.id} className="shrink-0">
            <a
              href={`#${section.id}`}
              className="block rounded-chip border border-line bg-sheet px-3 py-2 text-sm text-ink-3 transition-colors hover:border-line-firm hover:text-ink lg:border-transparent lg:bg-transparent"
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** One labelled fact. `break-words` keeps a long email inside its column. */
function Detail({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-fine text-ink-3">{label}</dt>

      <dd className="mt-1 font-medium break-words text-ink">{value}</dd>
    </div>
  );
}

/**
 * A radio dressed as a card. The input stays in the accessibility tree and
 * keeps arrow-key navigation; `has-[:focus-visible]` puts the focus ring back
 * on the card, since the control itself is visually hidden.
 */
function DepthOption({ option, checked, onSelect }) {
  return (
    <label
      className={cx(
        "block cursor-pointer rounded-chip border p-4 transition-colors",
        "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand",
        checked
          ? "border-brand bg-brand-tint"
          : "border-line-firm hover:border-ink-3",
      )}
    >
      <input
        type="radio"
        name="depth"
        value={option.value}
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />

      <span className="block text-sm font-semibold text-ink">
        {option.label}
      </span>

      <span className="mt-1 block text-fine text-ink-3">{option.hint}</span>
    </label>
  );
}

function Check({ id, label, hint, checked, onChange }) {
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-brand"
      />

      <div className="min-w-0">
        <label htmlFor={id} className="block text-sm font-semibold text-ink">
          {label}
        </label>

        <p className="mt-1 text-fine text-ink-3">{hint}</p>
      </div>
    </div>
  );
}

/** Stacks under its description on a phone, sits beside it from sm up. */
function DataRow({ title, body, action }) {
  return (
    <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="min-w-0">
        <h3 className="font-semibold text-ink">{title}</h3>

        <p className="mt-1 max-w-[52ch] text-sm text-ink-3">{body}</p>
      </div>

      <div className="shrink-0">{action}</div>
    </div>
  );
}

export default Settings;
