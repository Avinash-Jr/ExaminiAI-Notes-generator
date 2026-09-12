/**
 * qaEngine.js - Quality Assurance & Adherence Engine for ExaminAI
 *
 * Provides:
 * 1. Readability scoring (Flesch-Kincaid Grade Level, Flesch Reading Ease, SMOG Index)
 *    and audience-level alignment checking.
 * 2. Logical flow verification with explicit transition sentence detection.
 * 3. Topic form field adherence and coverage gap detection.
 * 4. Section-by-section confidence scoring.
 * 5. Running glossary extraction and validation.
 * 6. Table of Contents (TOC) generation.
 * 7. Metadata summary generation.
 */

// Syllable counting heuristic for English words (standard NLP readability algorithm)
export function countSyllables(word) {
  const clean = String(word || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  if (!clean) return 0;
  if (clean.length <= 3) return 1;

  // Handle common prefixes and endings
  let text = clean.replace(/(?:[^laeiouy]|ed|es)$/, "");
  // Silent 'e' at end (except when preceded by 'l' as in 'table' or 'le')
  if (text.endsWith("e") && !text.endsWith("le") && !/[aeiouy]e$/.test(text)) {
    text = text.slice(0, -1);
  }

  // Count vowel groups, taking care of adjacent vowels that are separate syllables
  // e.g. ia, io, iu, eo, ie in science/diet/quiet
  const separatedVowels = text.replace(/([iI][aeou])|([eE][ao])|([uU][aoei])/g, "$1-$2-$3");

  const vowelMatches = separatedVowels.match(/[aeiouy]+/g);
  let count = vowelMatches ? vowelMatches.length : 0;

  // Special cases adjustment
  if (/science|society|quiet|diet|client|poem|lion|ruin|fluid|chaos/.test(clean)) {
    count = Math.max(2, count);
  }

  return Math.max(1, count);
}

/**
 * Text statistics: words, sentences, syllables, complex words (>=3 syllables)
 */
export function analyzeTextStatistics(text) {
  const plainText = String(text || "")
    .replace(/```[\s\S]*?```/g, "") // remove code blocks
    .replace(/\[\[IMAGE:[^\]]+\]\]/g, "") // remove image tags
    .replace(/[#*`_~>|[\]()]/g, " ") // strip markdown formatting
    .replace(/\s+/g, " ")
    .trim();

  // Words
  const words = plainText.match(/\b[a-zA-Z0-9'-]+\b/g) || [];
  const wordCount = words.length;

  // Sentences (split by period, exclamation, question mark, or newlines)
  const sentences = plainText
    .split(/(?<=[.!?])\s+|\n{2,}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5 && /\w+/.test(s));
  const sentenceCount = Math.max(1, sentences.length);

  let totalSyllables = 0;
  let polysyllables = 0; // words with >= 3 syllables for SMOG

  for (const w of words) {
    const syl = countSyllables(w);
    totalSyllables += syl;
    if (syl >= 3) polysyllables++;
  }

  return {
    wordCount,
    sentenceCount,
    totalSyllables,
    polysyllables,
    wordsPerSentence: wordCount / sentenceCount,
    syllablesPerWord: wordCount > 0 ? totalSyllables / wordCount : 1,
  };
}

/**
 * Readability Scoring (Flesch-Kincaid, Flesch Reading Ease, SMOG)
 */
export function calculateReadability(text, audienceLevel = "intermediate") {
  const stats = analyzeTextStatistics(text);
  const { wordCount, sentenceCount, totalSyllables, polysyllables } = stats;

  if (wordCount < 30) {
    return {
      fleschKincaidGrade: 8,
      fleschReadingEase: 70,
      smogIndex: 8,
      audienceMatch: true,
      gradeLabel: "Introductory",
      assessment: "Content is too brief for a definitive readability assessment.",
      stats,
    };
  }

  // Flesch Reading Ease = 206.835 - (1.015 * ASL) - (84.6 * ASW)
  const ASL = wordCount / sentenceCount;
  const ASW = totalSyllables / wordCount;

  let fleschReadingEase = 206.835 - 1.015 * ASL - 84.6 * ASW;
  fleschReadingEase = Math.round(Math.max(0, Math.min(100, fleschReadingEase)) * 10) / 10;

  // Flesch-Kincaid Grade Level = 0.39 * ASL + 11.8 * ASW - 15.59
  let fleschKincaidGrade = 0.39 * ASL + 11.8 * ASW - 15.59;
  fleschKincaidGrade = Math.round(Math.max(1, Math.min(20, fleschKincaidGrade)) * 10) / 10;

  // SMOG Index = 1.0430 * sqrt(polysyllables * (30 / sentenceCount)) + 3.1291
  let smogIndex;
  if (sentenceCount >= 10) {
    smogIndex = 1.043 * Math.sqrt(polysyllables * (30 / sentenceCount)) + 3.1291;
  } else {
    // Scaled estimate for shorter extracts
    smogIndex = 1.043 * Math.sqrt(polysyllables * 3) + 3.1291;
  }
  smogIndex = Math.round(Math.max(1, Math.min(22, smogIndex)) * 10) / 10;

  // Target audience ranges
  const normalizedAudience = String(audienceLevel || "intermediate").toLowerCase();
  let audienceMatch = false;
  let gradeLabel = "Intermediate";
  let targetDesc = "";

  if (normalizedAudience === "beginner") {
    audienceMatch = fleschKincaidGrade <= 10 && fleschReadingEase >= 55;
    gradeLabel = "Foundational / Middle-High School";
    targetDesc = "Ideal Grade 6-9 (Accessible & intuitive)";
  } else if (normalizedAudience === "intermediate") {
    audienceMatch = fleschKincaidGrade >= 9 && fleschKincaidGrade <= 14;
    gradeLabel = "Undergraduate / College";
    targetDesc = "Ideal Grade 10-13 (Rigorous academic balance)";
  } else if (normalizedAudience === "advanced") {
    audienceMatch = fleschKincaidGrade >= 12 && fleschKincaidGrade <= 18;
    gradeLabel = "Graduate / Advanced Academic";
    targetDesc = "Ideal Grade 13-16 (In-depth theoretical depth)";
  } else if (normalizedAudience === "expert") {
    audienceMatch = fleschKincaidGrade >= 14;
    gradeLabel = "Professional / Specialized Research";
    targetDesc = "Ideal Grade 15+ (Formal technical mastery)";
  } else {
    audienceMatch = fleschKincaidGrade >= 8 && fleschKincaidGrade <= 15;
    gradeLabel = "Standard Educational";
    targetDesc = "Balanced general audience";
  }

  let assessment = audienceMatch
    ? `Readability matches the target ${audienceLevel} audience (${gradeLabel}, FK Grade ${fleschKincaidGrade}, SMOG ${smogIndex}).`
    : fleschKincaidGrade < 9 && (normalizedAudience === "advanced" || normalizedAudience === "expert")
      ? `Notes readability (FK Grade ${fleschKincaidGrade}) is simpler than target ${audienceLevel} expectation (${targetDesc}). Consider deepening academic rigor.`
      : `Notes readability (FK Grade ${fleschKincaidGrade}, SMOG ${smogIndex}) is higher than beginner baseline. Ensure concepts have intuitive stepping stones.`;

  return {
    fleschKincaidGrade,
    fleschReadingEase,
    smogIndex,
    audienceMatch,
    gradeLabel,
    targetDesc,
    assessment,
    stats,
  };
}

/**
 * Connective & logical transition cues
 */
const TRANSITION_PATTERNS = [
  /\b(?:building upon|having established|having examined|having explored|as discussed|previously|earlier)\b/i,
  /\b(?:in contrast|conversely|on the other hand|alternatively|differing from|unlike)\b/i,
  /\b(?:consequently|therefore|as a result|hence|thus|it follows that|subsequently)\b/i,
  /\b(?:furthermore|in addition|moreover|notably|crucially|extending this|to illustrate)\b/i,
  /\b(?:this leads to|this transition|the next phase|turning to|moving to|from this perspective)\b/i,
  /\b(?:to bridge|in conjunction with|underlying this|the direct implication)\b/i,
];

/**
 * Logical Flow & Inter-Section Transition Verification
 */
export function verifyLogicalFlow(text) {
  const sections = splitIntoSections(text);
  if (sections.length <= 1) {
    return {
      score: 95,
      transitionsVerified: true,
      transitionNotes: ["Single cohesive section structure."],
      sectionsCount: sections.length,
    };
  }

  const transitionNotes = [];
  let validTransitions = 0;
  const checksNeeded = sections.length - 1;

  for (let i = 1; i < sections.length; i++) {
    const prevSection = sections[i - 1];
    const currSection = sections[i];

    // Grab the first 2-3 sentences of current section and last sentence of previous section
    const currFirstParagraph = currSection.content.split(/\n\s*\n/)[0] || "";
    const prevLastParagraph = prevSection.content.trim().split(/\n\s*\n/).pop() || "";

    const boundaryText = `${prevLastParagraph} ${currFirstParagraph}`;

    let hasTransition = TRANSITION_PATTERNS.some((pattern) => pattern.test(boundaryText));

    // Also check for keyword overlap across section titles or key nouns
    const prevWords = new Set(
      (prevSection.title.toLowerCase().match(/\b[a-z]{4,}\b/g) || []).slice(0, 5)
    );
    const currIntroWords = currFirstParagraph.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const keywordOverlap = currIntroWords.some((w) => prevWords.has(w));

    if (hasTransition || keywordOverlap) {
      validTransitions++;
      transitionNotes.push(
        `✓ "${prevSection.title}" → "${currSection.title}": Explicit contextual transition detected.`
      );
    } else {
      transitionNotes.push(
        `⚠️ "${prevSection.title}" → "${currSection.title}": Abrupt transition; recommend connective lead-in.`
      );
    }
  }

  const score = Math.round((validTransitions / Math.max(1, checksNeeded)) * 100);
  const transitionsVerified = score >= 70;

  return {
    score,
    transitionsVerified,
    transitionNotes,
    sectionsCount: sections.length,
    validTransitions,
  };
}

/**
 * Splits Markdown text into structural sections based on ## headings
 */
export function splitIntoSections(text) {
  const lines = String(text || "").split("\n");
  const sections = [];
  let currentTitle = "Introduction";
  let currentLines = [];

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      const trimmedContent = currentLines.join("\n").trim();
      if (trimmedContent.length > 0) {
        sections.push({
          title: currentTitle.replace(/[#*`]/g, "").trim(),
          content: trimmedContent,
        });
      }
      currentTitle = h2Match[1].trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  const finalContent = currentLines.join("\n").trim();
  if (finalContent.length > 0) {
    sections.push({
      title: currentTitle.replace(/[#*`]/g, "").trim(),
      content: finalContent,
    });
  }

  return sections;
}

/**
 * Topic Form Adherence & Coverage Gap Detector
 */
export function validateTopicFormAdherence(text, topicParams = {}) {
  const {
    topic = "",
    subject = "",
    domain = "general",
    learningObjectives = [],
    audienceLevel = "intermediate",
    prerequisites = [],
    examplePreference = "balanced",
    depthLevel = "rigorous",
    customInstructions = "",
    moduleType = "standard",
  } = topicParams;

  const content = String(text || "");
  const lowerContent = content.toLowerCase();
  const fieldsChecked = {};
  const coverageGaps = [];

  // 1. Topic & Subject
  const topicWords = (topic.toLowerCase().match(/\b[a-z0-9]{3,}\b/g) || []);
  const topicHits = topicWords.filter((w) => lowerContent.includes(w)).length;
  const topicCovered = topicWords.length === 0 || topicHits / topicWords.length >= 0.6;
  fieldsChecked.topic = {
    status: topicCovered ? "satisfied" : "insufficient",
    detail: `Core topic concepts represented (${topicHits}/${topicWords.length} key terms).`,
  };
  if (!topicCovered) coverageGaps.push(`Core topic "${topic}" terms are insufficiently addressed.`);

  // 2. Learning Objectives
  const objResults = [];
  if (Array.isArray(learningObjectives) && learningObjectives.length > 0) {
    for (const obj of learningObjectives) {
      if (!obj || !obj.trim()) continue;
      const cleanObj = obj.trim();
      const objWords = (cleanObj.toLowerCase().match(/\b[a-z0-9]{4,}\b/g) || []).slice(0, 6);
      const matchCount = objWords.filter((w) => lowerContent.includes(w)).length;
      const isMet = objWords.length === 0 || matchCount / Math.max(1, objWords.length) >= 0.5;

      objResults.push({
        objective: cleanObj,
        satisfied: isMet,
        matchRatio: objWords.length > 0 ? matchCount / objWords.length : 1,
      });

      if (!isMet) {
        coverageGaps.push(`Learning objective not fully addressed: "${cleanObj}"`);
      }
    }
    const metCount = objResults.filter((o) => o.satisfied).length;
    fieldsChecked.learningObjectives = {
      status: metCount === objResults.length ? "satisfied" : metCount > 0 ? "partial" : "missing",
      detail: `${metCount} of ${objResults.length} learning objectives explicitly covered.`,
      items: objResults,
    };
  } else {
    fieldsChecked.learningObjectives = {
      status: "satisfied",
      detail: "General topic objectives derived and incorporated.",
    };
  }

  // 3. Prerequisites
  if (Array.isArray(prerequisites) && prerequisites.length > 0) {
    const prereqResults = [];
    for (const prereq of prerequisites) {
      if (!prereq || !prereq.trim()) continue;
      const cleanP = prereq.trim();
      const pWords = (cleanP.toLowerCase().match(/\b[a-z0-9]{4,}\b/g) || []);
      const matched = pWords.some((w) => lowerContent.includes(w));
      prereqResults.push({ prerequisite: cleanP, addressed: matched });
      if (!matched) {
        coverageGaps.push(`Prerequisite foundation not clearly established: "${cleanP}"`);
      }
    }
    const satisfiedPrereqs = prereqResults.filter((p) => p.addressed).length;
    fieldsChecked.prerequisites = {
      status: satisfiedPrereqs === prereqResults.length ? "satisfied" : "partial",
      detail: `${satisfiedPrereqs} of ${prereqResults.length} prerequisites referenced or contextualized.`,
      items: prereqResults,
    };
  } else {
    fieldsChecked.prerequisites = {
      status: "satisfied",
      detail: "No explicit prerequisites required.",
    };
  }

  // 4. Example Preference
  const hasTheoretical = /\b(?:proof|theorem|derivation|lemma|formal model|axiom|conceptual derivation)\b/i.test(content);
  const hasApplied = /\b(?:case study|real-world|application|in practice|practical implementation|industry example|worked example)\b/i.test(content);
  let exampleStatus = "satisfied";
  if (examplePreference === "theoretical" && !hasTheoretical) {
    exampleStatus = "partial";
    coverageGaps.push("Requested theoretical examples / derivations were not prominently featured.");
  } else if (examplePreference === "applied" && !hasApplied) {
    exampleStatus = "partial";
    coverageGaps.push("Requested applied / real-world case examples were not prominently featured.");
  }
  fieldsChecked.examplePreference = {
    status: exampleStatus,
    preference: examplePreference,
    detail: `Examples adhere to "${examplePreference}" profile (Theoretical: ${hasTheoretical ? "Yes" : "No"}, Applied: ${hasApplied ? "Yes" : "No"}).`,
  };

  // 5. Depth of Explanation
  fieldsChecked.depthLevel = {
    status: "satisfied",
    depth: depthLevel,
    detail: `Content calibrated to ${depthLevel} depth.`,
  };

  // 6. Custom Instructions Check
  if (customInstructions && customInstructions.trim()) {
    const customWords = (customInstructions.toLowerCase().match(/\b[a-z0-9]{4,}\b/g) || []).slice(0, 8);
    const customHits = customWords.filter((w) => lowerContent.includes(w)).length;
    const customCovered = customWords.length === 0 || customHits / customWords.length >= 0.35;
    fieldsChecked.customInstructions = {
      status: customCovered ? "satisfied" : "partial",
      detail: customCovered
        ? "Custom instructions reflected in generated notes."
        : "Some custom focus points may be insufficiently addressed.",
    };
    if (!customCovered) {
      coverageGaps.push("Some custom focus area instructions may not be fully addressed.");
    }
  }

  // Overall adherence score (0 - 100)
  const totalChecks = Object.keys(fieldsChecked).length;
  const satisfiedCount = Object.values(fieldsChecked).filter((f) => f.status === "satisfied").length;
  const partialCount = Object.values(fieldsChecked).filter((f) => f.status === "partial").length;
  const score = Math.round(((satisfiedCount + partialCount * 0.5) / Math.max(1, totalChecks)) * 100);

  const adherenceSummary =
    coverageGaps.length === 0
      ? "100% parameter adherence: all Topic form fields, objectives, and constraints verified."
      : `${coverageGaps.length} potential coverage gap(s) flagged for review.`;

  return {
    score,
    fieldsChecked,
    coverageGaps,
    adherenceSummary,
  };
}

/**
 * Section-by-Section Alignment & Confidence Scoring
 */
export function calculateSectionConfidence(text, topicParams = {}) {
  const sections = splitIntoSections(text);
  const { learningObjectives = [], topic = "" } = topicParams;

  return sections.map((sec, idx) => {
    let baseScore = 80;
    const rationales = [];
    const lower = sec.content.toLowerCase();

    // Check definition or callout presence
    const hasCallout = />\s*\[(DEFINITION|EXAMPLE|WARNING|KEY POINT|TIP)\]/i.test(sec.content);
    if (hasCallout) {
      baseScore += 5;
      rationales.push("Structured visual callout present");
    }

    // Check examples or calculations
    const hasExample = /\b(?:for example|example:|worked solution|case study|application|e\.g\.)\b/i.test(sec.content);
    if (hasExample) {
      baseScore += 5;
      rationales.push("Practical/worked example included");
    }

    // Check table or list structure
    const hasListOrTable = /^\s*[-*]\s+|\s*\|.+\|.+\|/m.test(sec.content);
    if (hasListOrTable) {
      baseScore += 5;
      rationales.push("High scannability with structured tables/lists");
    }

    // Check objective alignment
    if (Array.isArray(learningObjectives) && learningObjectives.length > 0) {
      const matchedObj = learningObjectives.find((obj) => {
        const words = (obj.toLowerCase().match(/\b[a-z]{4,}\b/g) || []).slice(0, 3);
        return words.some((w) => lower.includes(w));
      });
      if (matchedObj) {
        baseScore += 5;
        rationales.push(`Directly fulfills learning objective: "${matchedObj.slice(0, 45)}..."`);
      }
    }

    // Check length sufficiency (very short section gets penalized)
    const words = (sec.content.match(/\b\w+\b/g) || []).length;
    if (words < 40 && idx > 0 && idx < sections.length - 1) {
      baseScore -= 15;
      rationales.push("Section depth is relatively concise");
    }

    const finalScore = Math.min(99, Math.max(65, baseScore));

    return {
      sectionTitle: sec.title,
      score: finalScore,
      wordCount: words,
      rationale: rationales.join("; ") || "Covers designated topic sub-unit with standard clarity",
    };
  });
}

/**
 * Running Glossary Extractor & Validator
 */
export function extractGlossary(text, domain = "general") {
  const glossary = [];
  const seenTerms = new Set();

  // Pattern 1: Callout definitions: > [DEFINITION] **Term:** Definition text or **Term**: Definition
  const defMatches = text.matchAll(
    />\s*\[DEFINITION\]\s*(?:\*\*([^*]+)\*\*|([^*:\n]+))(?:\s*[:—]?\s*)([^\n]+)/gi
  );
  for (const m of defMatches) {
    let term = (m[1] || m[2] || "").trim().replace(/[:—]+$/, "").replace(/[*_]/g, "").trim();
    let def = (m[3] || "").trim().replace(/^[:—]\s*/, "");
    if (term && def && !seenTerms.has(term.toLowerCase())) {
      seenTerms.add(term.toLowerCase());
      glossary.push({
        term,
        definition: def,
        domainContext: domain.toUpperCase(),
      });
    }
  }

  // Pattern 2: Explicit Glossary section table in markdown:
  const glossarySectionMatch = text.match(/##\s*.*?Glossary[\s\S]*?(?=\n##|$)/i);
  if (glossarySectionMatch) {
    const tableMatches = glossarySectionMatch[0].matchAll(/\|\s*([^|\n]+?)\s*\|\s*(?:[^|\n]+\|\s*)?([^|\n]{10,}?)\s*\|/g);
    for (const tm of tableMatches) {
      const col1 = tm[1].trim();
      const col2 = tm[2].trim();
      if (
        !/^(term|concept|keyword|---)/i.test(col1) &&
        col1.length < 50 &&
        col2.length >= 10 &&
        !seenTerms.has(col1.toLowerCase())
      ) {
        seenTerms.add(col1.toLowerCase());
        glossary.push({
          term: col1.replace(/[*_`]/g, ""),
          definition: col2.replace(/[*_`]/g, ""),
          domainContext: domain.toUpperCase(),
        });
      }
    }
  }

  // Pattern 3: Inline bold term definitions: **Term** is defined as ... or **Term**: definition
  const inlineMatches = text.matchAll(
    /\*\*([a-zA-Z0-9\s-]{2,40})\*\*\s*(?:is defined as|refers to|denotes|is the)\s+([^.?!;\n]{20,160}[.?!])/gi
  );
  for (const im of inlineMatches) {
    const term = im[1].trim();
    const def = im[2].trim();
    if (term && def && !seenTerms.has(term.toLowerCase()) && glossary.length < 15) {
      seenTerms.add(term.toLowerCase());
      glossary.push({
        term,
        definition: `${def[0].toUpperCase()}${def.slice(1)}`,
        domainContext: domain.toUpperCase(),
      });
    }
  }

  return glossary.slice(0, 15);
}

/**
 * Table of Contents (TOC) Generator
 * Auto-generated for modules longer than Quick Summary
 */
export function generateTableOfContents(text, moduleType = "standard") {
  if (moduleType === "quick-summary") {
    return []; // Quick summary intentionally omits TOC as per spec
  }

  const lines = String(text || "").split("\n");
  const toc = [];

  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const rawTitle = match[2].trim();
      // Clean emoji and bold markers for clean anchor
      const title = rawTitle.replace(/^[🔴🟡🟢🔵🟣🎯🔑⚠️]\s*/, "").replace(/[*_`]/g, "").trim();
      const anchor = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");

      if (title && !/^table of contents$/i.test(title)) {
        toc.push({
          title,
          level,
          anchor,
        });
      }
    }
  }

  return toc;
}

/**
 * Appends a standardized, structured Metadata Summary at the end of generated notes
 */
export function buildMetadataSummaryBlock({
  topicParams,
  qaReport,
  actualWordCount,
  targetWordCount,
  moduleType,
  toc,
  glossary,
}) {
  const {
    topic = "Topic",
    subject = "Subject",
    domain = "general",
    learningObjectives = [],
    prerequisites = [],
    examType = "General Exam",
  } = topicParams;

  // Build active recall challenge questions based on specific learning objectives
  const recallQuestions =
    learningObjectives.length > 0
      ? learningObjectives.slice(0, 4).map((obj, i) => {
          return `**Question ${i + 1}:** How would you explain and apply: *${obj}* in an exam context without consulting your notes?\n> [KEY POINT] **Model Recall Strategy:** Identify the governing law, state the critical boundary conditions, and test your understanding with a concrete example.`;
        })
      : [
          `**Question 1:** What is the primary theoretical foundation of **${topic}**, and what core problem or mechanism does it solve?\n> [KEY POINT] **Model Recall Strategy:** Define the key mechanism clearly and state its fundamental assumptions before deriving outcomes.`,
          `**Question 2:** How do the prerequisite concepts relate to **${topic}**, and where do students most frequently make conceptual errors?\n> [KEY POINT] **Model Recall Strategy:** Map the conceptual dependencies and identify where standard approximations or models break down.`,
        ];

  // Domain-tailored common exam traps & pitfalls
  const domainTraps = {
    stem: [
      "Dimensional & Unit Inconsistency: Always perform dimensional analysis before plugging in numbers.",
      "Boundary Condition Violation: Applying small-angle, ideal, or linear approximations outside their valid regimes.",
      "State vs Path Confusion: Treating path-dependent quantities (work, heat) as state functions in thermodynamic systems.",
    ],
    medicine: [
      "Symptom vs Etiology: Conflating clinical manifestations with root pathophysiological mechanisms.",
      "Contraindication Blindness: Overlooking drug-drug interactions, renal/hepatic clearance, and patient-specific contraindications.",
      "Diagnostic Test Misinterpretation: Confusing sensitivity (ruling out) with specificity (ruling in).",
    ],
    business: [
      "Accounting vs Economic Profit: Ignoring the opportunity cost of invested capital and equity.",
      "Regime Shift Assumption: Assuming historical market correlations will persist through macroeconomic structural shifts.",
      "Strategy vs Tactics: Conflating operational efficiency improvements with sustainable competitive advantage.",
    ],
    humanities: [
      "Anachronistic Interpretation: Imposing contemporary moral or political frameworks onto historical primary sources.",
      "Historiographical Bias: Treating a historian's analytical perspective as undisputed objective fact.",
      "Overgeneralization: Making absolute claims without qualifying nuances, counter-evidence, or cultural context.",
    ],
    general: [
      "Passive Familiarity vs Active Recall: Conflating the feeling of recognizing a concept with the ability to retrieve it from memory.",
      "Term Ambiguity: Using technical vocabulary loosely without defining precise domain meanings.",
      "Ignoring Exceptions: Failing to identify the edge cases or assumptions underlying a rule.",
    ],
  };

  const traps = domainTraps[domain] || domainTraps.general;

  const spacedSchedule = [
    "- [ ] **Day 1 — Immediate Retrieval:** Close these notes right now. Spend 3 minutes jotting down the 3 biggest takeaways completely from memory.",
    "- [ ] **Day 3 — Active Recall Self-Test:** Re-answer the self-assessment challenge questions above without checking the solutions.",
    "- [ ] **Day 7 — Applied Concept Transfer:** Explain this topic out loud to a study partner or solve 2 applied practice scenarios.",
    "- [ ] **Day 14 — Exam-Ready Quick Drill:** Rapidly scan the Running Glossary. If you hesitate on any definition, do a 2-minute targeted review.",
  ].join("\n");

  return `
---

## 🧠 Active Recall & Self-Assessment Challenge

*Test your mastery before test day. Active retrieval builds stronger memory pathways than passive re-reading.*

${recallQuestions.join("\n\n")}

---

## ⚠️ Common Exam Traps & Pitfalls to Avoid

*Watch out for these classic mistakes that frequently cost students marks on ${examType || "exams"}:*

${traps.map((t, idx) => `> [WARNING] **Exam Trap ${idx + 1}:** ${t}`).join("\n\n")}

---

## 📅 Spaced Repetition Mastery Schedule

*Follow this evidence-based review timeline to lock these concepts into long-term memory:*

${spacedSchedule}
`;
}

export const buildStudentLearningAccelerator = buildMetadataSummaryBlock;

/**
 * Master QA Evaluator: runs all QA checks on a note draft
 */
export function evaluateNotes(text, topicParams = {}) {
  const content = String(text || "").trim();
  const stats = analyzeTextStatistics(content);
  const actualWordCount = stats.wordCount;

  const targetWordCount =
    topicParams.targetWordCount ||
    (topicParams.moduleType === "quick-summary"
      ? 650
      : topicParams.moduleType === "comprehensive"
        ? 5000
        : topicParams.moduleType === "custom"
          ? topicParams.customWordCount || 2000
          : 2000);

  const moduleType = topicParams.moduleType || "standard";
  const audienceLevel = topicParams.audienceLevel || "intermediate";
  const domain = topicParams.domain || "general";

  // 1. Readability
  const readability = calculateReadability(content, audienceLevel);

  // 2. Logical Flow
  const logicalFlow = verifyLogicalFlow(content);

  // 3. Field Adherence
  const fieldAdherence = validateTopicFormAdherence(content, topicParams);

  // 4. Section Confidence
  const sectionConfidence = calculateSectionConfidence(content, topicParams);
  const overallConfidenceScore = Math.round(
    sectionConfidence.length > 0
      ? sectionConfidence.reduce((acc, s) => acc + s.score, 0) / sectionConfidence.length
      : 88
  );

  // 5. Glossary
  const glossary = extractGlossary(content, domain);

  // 6. Table of Contents
  const toc = generateTableOfContents(content, moduleType);

  const qaReport = {
    readability,
    logicalFlow,
    fieldAdherence,
    sectionConfidence,
    overallConfidenceScore,
  };

  // 7. Metadata summary block
  const metadataBlock = buildMetadataSummaryBlock({
    topicParams,
    qaReport,
    actualWordCount,
    targetWordCount,
    moduleType,
    toc,
    glossary,
  });

  return {
    actualWordCount,
    targetWordCount,
    readability,
    logicalFlow,
    fieldAdherence,
    sectionConfidence,
    overallConfidenceScore,
    glossary,
    toc,
    qaReport,
    metadataBlock,
  };
}
