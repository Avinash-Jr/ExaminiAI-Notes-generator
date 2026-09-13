import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiSun,
  FiMoon,
  FiUsers,
  FiCreditCard,
  FiPlus,
  FiCheck,
  FiDownload,
  FiShield,
  FiExternalLink
} from "react-icons/fi";

import Button from "../components/ui/Button.jsx";
import Container from "../components/ui/Container.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Panel from "../components/ui/Panel.jsx";
import { Field, Select } from "../components/ui/Field.jsx";
import { logout, getMyOrgs, createOrg, inviteOrgMember, getBillingSummary } from "../services/api.js";
import { useTheme } from "../lib/theme.jsx";
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
  { id: "appearance", label: "Appearance" },
  { id: "team", label: "Workspaces & Team" },
  { id: "billing", label: "Billing & Invoices" },
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
  const { theme, setTheme } = useTheme();

  const [stored, setStored] = useState(readDefaults);
  const [draft, setDraft] = useState(stored);
  const [status, setStatus] = useState(null);
  const [signingOut, setSigningOut] = useState(false);

  // SaaS Workspace & Billing state
  const [orgs, setOrgs] = useState([]);
  const [newOrgName, setNewOrgName] = useState("");
  const [orgCreating, setOrgCreating] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteStatus, setInviteStatus] = useState(null);
  const [billing, setBilling] = useState(null);

  const dirty = !same(draft, stored);

  useEffect(() => {
    if (!userData) return;
    let mounted = true;
    getMyOrgs().then((res) => {
      if (mounted && res) {
        setOrgs(res);
        if (res.length > 0) setSelectedOrgId(res[0]._id);
      }
    });
    getBillingSummary().then((res) => {
      if (mounted && res) setBilling(res);
    });
    return () => {
      mounted = false;
    };
  }, [userData]);

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

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setOrgCreating(true);
    try {
      const created = await createOrg(newOrgName.trim());
      setOrgs((prev) => [...prev, created]);
      setNewOrgName("");
      setSelectedOrgId(created._id);
    } catch (err) {
      console.error(err);
    } finally {
      setOrgCreating(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !selectedOrgId) return;
    try {
      await inviteOrgMember(selectedOrgId, inviteEmail.trim(), inviteRole);
      setInviteStatus({ ok: true, text: `Invited ${inviteEmail} successfully!` });
      setInviteEmail("");
    } catch (err) {
      setInviteStatus({ ok: false, text: err.response?.data?.error || "Failed to invite." });
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await logout(dispatch);
    navigate("/auth", { replace: true });
  };

  if (!userData) {
    return (
      <Container className="py-14 sm:py-20">
        <PageHeader
          title="Settings"
          standfirst="Your account, your credits, and the shape ExaminAI gives new notes by default."
        />
        <div className="mt-10">
          <EmptyState
            title="Sign in to view settings"
            description="Settings belong to an account. Sign in with Google to adjust preferences, teams, and note defaults."
            action={
              <Button as={Link} to="/auth" variant="accent">
                Sign in with Google
              </Button>
            }
          />
        </div>
      </Container>
    );
  }

  const credits = userData.credits ?? 0;
  const setsLeft = Math.floor(credits / CREDITS_PER_SET);

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader
        title="Settings"
        standfirst="Manage your account profile, workspace teams, appearance, and billing."
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

      <div className="mt-10 gap-10 lg:grid lg:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] lg:items-start">
        <SectionNav />

        <div className="mt-8 space-y-8 lg:mt-0">
          {/* 1. Account */}
          <Panel as="section" id="account" aria-labelledby="account-heading">
            <h2 id="account-heading" className={heading}>
              Account
            </h2>
            <p className="mt-2 max-w-[58ch] text-sm text-ink-2">
              Identity details synced from your authenticated Google account.
            </p>
            <dl className="mt-6 grid gap-6 sm:grid-cols-2">
              <Detail label="Name" value={userData.name} />
              <Detail label="Email" value={userData.email} />
              <Detail
                label="Member since"
                value={
                  userData.createdAt
                    ? joined.format(new Date(userData.createdAt))
                    : "Active Member"
                }
              />
              <Detail label="Account Type" value="Individual Scholar" />
            </dl>
          </Panel>

          {/* 2. Appearance */}
          <Panel as="section" id="appearance" aria-labelledby="appearance-heading">
            <h2 id="appearance-heading" className={heading}>
              Appearance & Theme
            </h2>
            <p className="mt-2 max-w-[58ch] text-sm text-ink-2">
              Customize the visual aesthetic of ExaminAI. Preferences are stored locally on your device.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4 max-w-md">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center justify-center gap-2.5 rounded-xl border p-4 text-sm font-semibold transition-all ${
                  theme === "light"
                    ? "border-brand bg-brand-soft text-brand ring-2 ring-brand/20"
                    : "border-line bg-sheet text-ink hover:bg-band"
                }`}
              >
                <FiSun className="size-5" />
                <span>Light Mode</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center justify-center gap-2.5 rounded-xl border p-4 text-sm font-semibold transition-all ${
                  theme === "dark"
                    ? "border-brand bg-brand-soft text-brand ring-2 ring-brand/20"
                    : "border-line bg-sheet text-ink hover:bg-band"
                }`}
              >
                <FiMoon className="size-5" />
                <span>Dark Mode</span>
              </button>
            </div>
          </Panel>

          {/* 3. Workspaces & Teams */}
          <Panel as="section" id="team" aria-labelledby="team-heading">
            <div className="flex items-center justify-between">
              <div>
                <h2 id="team-heading" className={heading}>
                  Workspaces & Teams
                </h2>
                <p className="mt-2 max-w-[58ch] text-sm text-ink-2">
                  Create shared study spaces, collaborate with study groups, and pool note generation credits.
                </p>
              </div>
              <FiUsers className="size-6 text-brand" />
            </div>

            {/* Existing Orgs List */}
            <div className="mt-6 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-3">
                Your Workspaces
              </p>
              <div className="rounded-xl border border-line bg-band p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-ink">Personal Workspace (Default)</p>
                  <p className="text-xs text-ink-3">Owner • Single Scholar</p>
                </div>
                <span className="rounded-md bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-xs font-bold">
                  Active
                </span>
              </div>

              {orgs.map((o) => (
                <div key={o._id} className="rounded-xl border border-line bg-sheet p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-ink">{o.name}</p>
                    <p className="text-xs text-ink-3">Role: {o.role || "Owner"} • Team Plan</p>
                  </div>
                  <span className="rounded-md bg-brand/10 text-brand px-2 py-0.5 text-xs font-bold">
                    Team Workspace
                  </span>
                </div>
              ))}
            </div>

            {/* Create Org Form */}
            <form onSubmit={handleCreateOrg} className="mt-6 pt-6 border-t border-line">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-3 mb-2">
                Create New Study Group Workspace
              </label>
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  placeholder="e.g. Bio 101 Study Cohort"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="flex-1 rounded-xl border border-line bg-sheet px-3.5 py-2 text-sm text-ink placeholder:text-ink-3 outline-hidden focus:border-brand"
                />
                <button
                  type="submit"
                  disabled={orgCreating || !newOrgName.trim()}
                  className="rounded-xl bg-ink text-sheet px-4 py-2 text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {orgCreating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>

            {/* Invite Teammate */}
            {orgs.length > 0 && (
              <form onSubmit={handleInvite} className="mt-6 pt-6 border-t border-line">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-3 mb-2">
                  Invite Teammate to Workspace
                </label>
                <div className="flex flex-wrap gap-2 max-w-lg">
                  <input
                    type="email"
                    placeholder="peer@university.edu"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 min-w-[200px] rounded-xl border border-line bg-sheet px-3.5 py-2 text-sm text-ink placeholder:text-ink-3 outline-hidden focus:border-brand"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="rounded-xl border border-line bg-sheet px-3 py-2 text-xs font-semibold text-ink"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    type="submit"
                    className="rounded-xl bg-brand text-white px-4 py-2 text-xs font-semibold hover:bg-brand-deep"
                  >
                    Send Invite
                  </button>
                </div>
                {inviteStatus && (
                  <p className={`mt-2 text-xs ${inviteStatus.ok ? "text-success" : "text-danger"}`}>
                    {inviteStatus.text}
                  </p>
                )}
              </form>
            )}
          </Panel>

          {/* 4. Billing & Invoices */}
          <Panel as="section" id="billing" aria-labelledby="billing-heading">
            <div className="flex items-center justify-between">
              <div>
                <h2 id="billing-heading" className={heading}>
                  Billing & Invoices
                </h2>
                <p className="mt-2 max-w-[58ch] text-sm text-ink-2">
                  Manage your subscription tier, credit allocations, and download previous transaction receipts.
                </p>
              </div>
              <FiCreditCard className="size-6 text-brand" />
            </div>

            <div className="mt-6 rounded-2xl border border-line bg-band p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-ink-3 font-medium">Current Active Plan</span>
                <p className="text-lg font-bold text-ink">Free Tier Scholar</p>
                <p className="text-xs text-ink-3 mt-0.5">Pay-as-you-go credit billing</p>
              </div>
              <Link
                to="/pricing"
                className="rounded-xl bg-ink text-sheet px-4 py-2 text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Upgrade Plan →
              </Link>
            </div>

            {/* Invoices Table */}
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-3 mb-3">
                Recent Invoices & Transactions
              </p>
              {billing?.invoices?.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-line">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-band border-b border-line text-ink-3">
                      <tr>
                        <th className="p-3">Order ID</th>
                        <th className="p-3">Plan / Pack</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {billing.invoices.map((inv) => (
                        <tr key={inv._id} className="hover:bg-band/50">
                          <td className="p-3 font-mono text-ink-2">{inv.orderId}</td>
                          <td className="p-3 font-medium text-ink">{inv.planName}</td>
                          <td className="p-3 font-semibold text-ink">₹{inv.amount}</td>
                          <td className="p-3">
                            <span className="rounded bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 font-bold uppercase text-[10px]">
                              {inv.status}
                            </span>
                          </td>
                          <td className="p-3 text-ink-3">{new Date(inv.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl border border-line/60 bg-sheet p-6 text-center text-xs text-ink-3">
                  No previous payments recorded on this account.
                </div>
              )}
            </div>
          </Panel>

          {/* 5. Credits */}
          <Panel as="section" id="credits" aria-labelledby="credits-heading">
            <h2 id="credits-heading" className={heading}>
              Credits
            </h2>
            <div className="mt-6 flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs text-ink-3">Available Balance</p>
                <p data-numeric className="mt-1 text-5xl font-extrabold tracking-tight text-ink">
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
                  See usage history
                </Button>
              </div>
            </div>
          </Panel>

          {/* 6. Note defaults */}
          <Panel as="section" id="defaults" aria-labelledby="defaults-heading">
            <h2 id="defaults-heading" className={heading}>
              Note defaults
            </h2>
            <p className="mt-2 max-w-[58ch] text-sm text-ink-2">
              The starting format for every new AI generation.
            </p>
            <form onSubmit={handleSave} className="mt-6">
              <div className="space-y-6">
                <Field
                  id="default-format"
                  label="Default format"
                  hint="What ExaminAI produces unless you pick something else."
                >
                  {(field) => (
                    <Select
                      {...field}
                      value={draft.format}
                      onChange={(event) => change("format")(event.target.value)}
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
                  <legend className="text-sm font-semibold text-ink">Detail depth</legend>
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

                <div className="space-y-4 border-t border-line pt-6">
                  <Check
                    id="default-diagrams"
                    label="Include visual diagrams where relevant"
                    hint="Adds ASCII and flowchart structures to complex topics."
                    checked={draft.diagrams}
                    onChange={change("diagrams")}
                  />
                  <Check
                    id="default-confirm-cost"
                    label="Show credit cost confirmation before generating"
                    hint="Review token cost before running the AI model."
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
                <p role="status" className={cx("text-xs", status?.tone === "bad" ? "text-danger" : "text-ink-3")}>
                  {status ? status.text : dirty ? "Unsaved changes." : "All preferences saved."}
                </p>
              </div>
            </form>
          </Panel>

          {/* 7. Data & Privacy */}
          <Panel as="section" id="data" aria-labelledby="data-heading">
            <h2 id="data-heading" className={heading}>
              Your data & privacy
            </h2>
            <p className="mt-2 max-w-[58ch] text-sm text-ink-2">
              Read our{" "}
              <Link to="/privacy" className="font-semibold text-brand underline hover:text-brand-deep">
                privacy policy
              </Link>
              . All data is encrypted and belongs to you.
            </p>
            <div className="mt-6 divide-y divide-line border-t border-line">
              <DataRow
                title="Export personal data archive"
                body="Receive a JSON archive of all your notes, history logs, and billing receipts."
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
                    Request archive
                  </Button>
                }
              />
              <DataRow
                title="Delete account and data"
                body="Permanently remove your profile and all generated notes from MongoDB."
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

function SectionNav() {
  return (
    <nav aria-label="Settings sections" className="lg:sticky lg:top-24">
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0">
        {sections.map((section) => (
          <li key={section.id} className="shrink-0">
            <a
              href={`#${section.id}`}
              className="block rounded-xl border border-line bg-sheet px-3 py-2 text-xs font-semibold text-ink-3 transition-colors hover:border-line-firm hover:text-ink lg:border-transparent lg:bg-transparent"
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Detail({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className="mt-1 font-semibold text-sm break-words text-ink">{value}</dd>
    </div>
  );
}

function DepthOption({ option, checked, onSelect }) {
  return (
    <label
      className={cx(
        "block cursor-pointer rounded-xl border p-4 transition-colors",
        checked
          ? "border-brand bg-brand-soft"
          : "border-line bg-sheet hover:border-line-firm",
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
      <span className="block text-xs font-bold text-ink">{option.label}</span>
      <span className="mt-1 block text-[11px] text-ink-3">{option.hint}</span>
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
        className="mt-0.5 size-4 shrink-0 accent-brand rounded"
      />
      <div className="min-w-0">
        <label htmlFor={id} className="block text-xs font-semibold text-ink">
          {label}
        </label>
        <p className="mt-0.5 text-[11px] text-ink-3">{hint}</p>
      </div>
    </div>
  );
}

function DataRow({ title, body, action }) {
  return (
    <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="min-w-0">
        <h3 className="font-semibold text-xs text-ink">{title}</h3>
        <p className="mt-0.5 max-w-[52ch] text-xs text-ink-3">{body}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

export default Settings;
