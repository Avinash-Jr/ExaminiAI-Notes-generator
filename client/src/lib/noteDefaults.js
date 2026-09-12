export const STORAGE_KEY = "examinai.noteDefaults";

export const CREDITS_PER_SET = 7;

export const domains = [
  { value: "stem", label: "STEM (Science, Tech, Engineering, Math)", icon: "🔬" },
  { value: "humanities", label: "Humanities & History", icon: "📜" },
  { value: "business", label: "Business, Finance & Economics", icon: "💼" },
  { value: "social-sciences", label: "Social Sciences & Psychology", icon: "👥" },
  { value: "arts", label: "Arts, Architecture & Design", icon: "🎨" },
  { value: "medicine", label: "Medicine & Healthcare", icon: "🩺" },
  { value: "law", label: "Law & Governance", icon: "⚖️" },
  { value: "general", label: "General Academic / Interdisciplinary", icon: "📚" },
];

export const modules = [
  {
    value: "quick-summary",
    label: "Quick Summary",
    range: "500–800 words",
    targetWords: 650,
    hint: "Core concepts, essential definitions, and high-yield takeaways without TOC",
    credits: 5,
  },
  {
    value: "standard",
    label: "Standard Module",
    range: "1,500–2,500 words",
    targetWords: 2000,
    hint: "Moderate depth with full explanations, worked examples, and review summaries",
    credits: 7,
  },
  {
    value: "comprehensive",
    label: "Comprehensive Module",
    range: "4,000–6,000+ words",
    targetWords: 5000,
    hint: "Exhaustive coverage: historical context, multiple example tiers, misconceptions, and self-assessment",
    credits: 12,
  },
  {
    value: "custom",
    label: "Custom Module",
    range: "Custom Length",
    targetWords: 2000,
    hint: "User-defined word count and section scaling",
    credits: 8,
  },
];

export const audienceLevels = [
  { value: "beginner", label: "Beginner / Foundational", hint: "Middle / High School level, accessible intuitive analogies" },
  { value: "intermediate", label: "Intermediate / Undergraduate", hint: "College level, balanced academic rigor and formal definitions" },
  { value: "advanced", label: "Advanced / Graduate", hint: "Graduate level, in-depth theoretical analysis and mathematical formulations" },
  { value: "expert", label: "Professional / Expert", hint: "Industry research standard, edge cases and formal frameworks" },
];

export const examplePreferences = [
  { value: "balanced", label: "Balanced (Theory + Applied)", hint: "Harmonious mix of conceptual principles and practical examples" },
  { value: "theoretical", label: "Theoretical & Formal Proofs", hint: "Mathematical derivations, axiomatic reasoning, and conceptual proofs" },
  { value: "applied", label: "Applied & Real-World", hint: "Concrete practical implementations, industry practices, and code/benchmarks" },
  { value: "case-studies", label: "In-Depth Case Studies", hint: "Narrative contextual scenarios with problem, solution, and outcome" },
];

export const depthLevels = [
  { value: "intuitive", label: "Intuitive & Conceptual", hint: "Focus on mental models, 'why it works', and accessible analogies" },
  { value: "rigorous", label: "Standard Academic Rigor", hint: "Complete formal definitions, step-by-step mechanisms, and verified models" },
  { value: "deep-technical", label: "Deep Technical & Formal", hint: "Exhaustive mathematical derivations, formal proofs, edge cases, and nuances" },
];

export const formats = [
  { value: "revision", label: "Revision notes" },
  { value: "summary", label: "One-page summary" },
  { value: "documentation", label: "Project documentation" },
  { value: "questions", label: "Question and answer pairs" },
  { value: "peer-review", label: "Peer review document" },
];

export const depths = [
  { value: "tight", label: "Tight", hint: "Bullet points, nothing else" },
  {
    value: "balanced",
    label: "Balanced",
    hint: "Points with short explanations",
  },
  {
    value: "thorough",
    label: "Detailed notes",
    hint: "Deep, precise, with 4–5 diagrams",
  },
];

export const defaults = {
  domain: "general",
  moduleType: "standard",
  targetWordCount: 2000,
  audienceLevel: "intermediate",
  examplePreference: "balanced",
  depthLevel: "rigorous",
  learningObjectives: [],
  prerequisites: [],
  customInstructions: "",
  format: "revision",
  depth: "balanced",
  diagrams: true,
  confirmCost: true,
};

const DIAGRAM_COST = 3;

/** The label for a stored value, falling back to the value itself. */
export const labelFor = (options, value) =>
  options.find((option) => option.value === value)?.label ?? value;

/**
 * Pre-flight Scope & Length Validation Check
 * Alerts user if requested learning objectives or depth cannot fit in the selected module
 */
export function checkScopeAndLength({
  moduleType = "standard",
  targetWordCount,
  learningObjectives = [],
  depthLevel = "rigorous",
  audienceLevel = "intermediate",
} = {}) {
  const objCount = Array.isArray(learningObjectives) ? learningObjectives.length : 0;

  // Words needed per objective
  const wordsPerObj =
    depthLevel === "deep-technical" ? 380 :
    depthLevel === "rigorous" ? 240 : 150;

  const audienceMultiplier =
    audienceLevel === "expert" ? 1.3 :
    audienceLevel === "advanced" ? 1.15 : 1.0;

  const estimatedMinWords = Math.round(
    Math.max(450, objCount * wordsPerObj * audienceMultiplier + 250)
  );

  let maxCapacity = 800;
  if (moduleType === "quick-summary") maxCapacity = 800;
  else if (moduleType === "standard") maxCapacity = 2500;
  else if (moduleType === "comprehensive") maxCapacity = 6500;
  else if (moduleType === "custom") maxCapacity = Number(targetWordCount) || 2000;

  if (estimatedMinWords > maxCapacity) {
    const recommendedUpgrade =
      estimatedMinWords > 2500 ? "comprehensive" : "standard";
    return {
      valid: false,
      warning: `Your scope (${objCount} objectives at ${depthLevel} depth) requires ~${estimatedMinWords.toLocaleString("en-IN")} words, which exceeds ${labelFor(modules, moduleType)} capacity (max ${maxCapacity.toLocaleString("en-IN")} words). Content may be compressed or truncated.`,
      estimatedMinWords,
      maxCapacity,
      recommendedUpgrade,
    };
  }

  return {
    valid: true,
    estimatedMinWords,
    maxCapacity,
  };
}

/** What one generation will cost, given the choices made for it. */
export function estimateCredits({ moduleType, depth, diagrams, targetWordCount } = {}) {
  let base = 7;
  if (moduleType === "quick-summary") base = 5;
  else if (moduleType === "standard") base = 7;
  else if (moduleType === "comprehensive") base = 12;
  else if (moduleType === "custom" && targetWordCount) {
    if (targetWordCount > 3500) base = 12;
    else if (targetWordCount < 1000) base = 5;
    else base = 8;
  } else if (depth === "tight") base = 5;
  else if (depth === "thorough") base = 10;

  return base + (diagrams ? DIAGRAM_COST : 0);
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

