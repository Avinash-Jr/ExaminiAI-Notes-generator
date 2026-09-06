/**
 * The shape of a note request, in one place.
 *
 * Settings edits these as defaults, the generate dialog starts from them, and
 * the topic form spends credits against them. Three copies of the same option
 * list is how the three screens end up disagreeing about what "Thorough" means.
 */

/* No preferences endpoint yet, so defaults stay on this device. When
   `PATCH /api/user/preferences` exists, read from userData instead and keep this
   as the offline fallback. */
export const STORAGE_KEY = "examinai.noteDefaults";

/* About says 100 credits is roughly fifteen sets of notes. Same arithmetic
   everywhere so the pages cannot drift apart. */
export const CREDITS_PER_SET = 7;

export const formats = [
  { value: "revision", label: "Revision notes" },
  { value: "summary", label: "One-page summary" },
  { value: "documentation", label: "Project documentation" },
  { value: "questions", label: "Question and answer pairs" },
];

export const depths = [
  { value: "tight", label: "Tight", hint: "Bullet points, nothing else" },
  { value: "balanced", label: "Balanced", hint: "Points with short explanations" },
  { value: "thorough", label: "Thorough", hint: "Full prose, with examples" },
];

export const defaults = {
  format: "revision",
  depth: "balanced",
  diagrams: true,
  confirmCost: true,
};

/* What each depth costs. `balanced` is CREDITS_PER_SET by definition — the
   number the rest of the site quotes. */
const depthCost = {
  tight: 5,
  balanced: CREDITS_PER_SET,
  thorough: 10,
};

const DIAGRAM_COST = 3;

/** The label for a stored value, falling back to the value itself. */
export const labelFor = (options, value) =>
  options.find((option) => option.value === value)?.label ?? value;

/** What one generation will cost, given the choices made for it. */
export function estimateCredits({ depth, diagrams } = {}) {
  return (depthCost[depth] ?? CREDITS_PER_SET) + (diagrams ? DIAGRAM_COST : 0);
}

/** Reads saved defaults, tolerating private mode and hand-edited values. */
export function readDefaults() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return defaults;
  }
}
