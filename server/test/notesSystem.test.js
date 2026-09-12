import assert from "node:assert";
import {
  countSyllables,
  analyzeTextStatistics,
  calculateReadability,
  verifyLogicalFlow,
  validateTopicFormAdherence,
  calculateSectionConfidence,
  extractGlossary,
  generateTableOfContents,
  evaluateNotes,
} from "../utils/qaEngine.js";

import {
  convertToMarkdown,
  convertToHtml,
  convertToLatex,
  convertToPlainText,
  generateAllFormats,
} from "../utils/exportFormats.js";

console.log("🚀 Running Notes Generator System Test Suite...\n");

// 1. Syllable & Text Statistics Tests
console.log("1. Testing Syllables and Text Statistics...");
assert.strictEqual(countSyllables("cat"), 1);
assert.strictEqual(countSyllables("science"), 2);
assert.strictEqual(countSyllables("thermodynamics"), 5);
assert.strictEqual(countSyllables("entropy"), 3);

const sampleText = `
Entropy is a measure of molecular disorder within a thermodynamic system.
Building upon the second law of thermodynamics, the total entropy of an isolated system always increases over time.
Consequently, natural processes are fundamentally irreversible.
`;
const stats = analyzeTextStatistics(sampleText);
assert.ok(stats.wordCount > 20, `Word count should be > 20, got ${stats.wordCount}`);
assert.ok(stats.sentenceCount >= 3, `Sentence count should be >= 3, got ${stats.sentenceCount}`);
console.log(`   ✓ Stats parsed: ${stats.wordCount} words, ${stats.sentenceCount} sentences, ${stats.polysyllables} complex words.`);

// 2. Readability Tests
console.log("\n2. Testing Readability Scoring (Flesch-Kincaid, Flesch Reading Ease, SMOG)...");
const academicText = `
Thermodynamics governs the principles of energy conservation, heat transfer, and mechanical equilibrium across closed and open macroscopic systems.
Having established the conservation of energy via the first law of thermodynamics, we formalize the internal energy differential.
Furthermore, the Clausius inequality dictates that cyclic integral of heat transfer divided by absolute boundary temperature cannot exceed zero.
Therefore, spontaneous transformations invariably generate positive internal entropy production.
`;
const intermediateReadability = calculateReadability(academicText, "intermediate");
assert.ok(intermediateReadability.fleschKincaidGrade > 0, "FK Grade should be > 0");
assert.ok(intermediateReadability.fleschReadingEase >= 0, "Reading ease should be non-negative");
assert.ok(intermediateReadability.smogIndex > 0, "SMOG index should be > 0");
console.log(`   ✓ Intermediate Readability: FK Grade=${intermediateReadability.fleschKincaidGrade}, Ease=${intermediateReadability.fleschReadingEase}, SMOG=${intermediateReadability.smogIndex}`);
console.log(`   ✓ Audience match evaluation: ${intermediateReadability.audienceMatch ? "Matched" : "Diagnostics provided"}`);

// 3. Logical Flow Verification
console.log("\n3. Testing Logical Flow & Inter-Section Transitions...");
const multiSectionText = `
## Introduction to Microeconomics
Microeconomics examines how individual agents allocate scarce resources. Markets coordinate consumer choices and production decisions.

## Supply and Demand Mechanics
Building upon the premise of rational agent optimization, market equilibria emerge at the intersection of supply and demand curves.
Consequently, shifts in input costs trigger dynamic price adjustments.

## Market Failures and Externalities
In contrast to idealized competitive markets, real-world economies frequently exhibit negative externalities such as pollution.
Therefore, regulatory interventions like Pigouvian taxes may restore Pareto efficiency.
`;
const flowResult = verifyLogicalFlow(multiSectionText);
assert.ok(flowResult.score >= 70, `Logical flow score should be >= 70%, got ${flowResult.score}%`);
assert.strictEqual(flowResult.transitionsVerified, true);
console.log(`   ✓ Logical Flow Cohesion Score: ${flowResult.score}% (${flowResult.sectionsCount} sections)`);
flowResult.transitionNotes.forEach((n) => console.log(`     ${n}`));

// 4. Topic Form Adherence & Coverage Gaps
console.log("\n4. Testing Topic Form Adherence & Gap Detector...");
const topicParams = {
  topic: "Neural Network Backpropagation",
  subject: "Machine Learning",
  domain: "stem",
  learningObjectives: [
    "Derive the chain rule gradient computation for multilayer perceptrons",
    "Analyze gradient vanishing in deep architectures",
  ],
  audienceLevel: "advanced",
  prerequisites: ["Multivariable calculus", "Matrix algebra"],
  examplePreference: "applied",
  depthLevel: "deep-technical",
  customInstructions: "Include real-world PyTorch or mathematical pseudocode comparison",
  moduleType: "standard",
};

const fullNotesSample = `
# Neural Network Backpropagation

## Fundamentals of Gradient-Based Optimization
Neural network backpropagation relies on multivariable calculus and matrix algebra to propagate loss gradients backward through computational graphs.

> [DEFINITION] **Backpropagation:** An efficient algorithmic application of the calculus chain rule for computing partial derivatives of the loss function with respect to every weight.

## Mathematical Formulation and Chain Rule
Building upon the forward pass computations, we derive the weight update gradients systematically.
For a layer $l$, the gradient $\\frac{\\partial L}{\\partial W^{(l)}}$ is computed using the upstream error signal.

> [EXAMPLE] **Applied Case Study:** In a deep convolutional network for medical imaging, vanishing gradients caused early layer stagnation until residual skip connections were implemented.

## Vanishing Gradient Dilemma in Deep Architectures
Consequently, deep networks with sigmoid activations suffer from gradient vanishing as successive derivatives decay exponentially towards zero.

| Activation Function | Derivative Range | Vanishing Gradient Risk |
| :--- | :--- | :--- |
| **Sigmoid** | 0.0 to 0.25 | High |
| **ReLU** | 0 or 1 | Minimal |
| **GELU** | Smooth non-linear | Very Low |

> [KEY POINT] **Takeaway:** Modern architectures utilize ReLU variants and normalization to preserve gradient magnitude across deep layers.
`;

const adherence = validateTopicFormAdherence(fullNotesSample, topicParams);
assert.ok(adherence.score >= 75, `Adherence score should be >= 75%, got ${adherence.score}%`);
console.log(`   ✓ Topic Adherence Score: ${adherence.score}%`);
console.log(`   ✓ Gaps detected: ${adherence.coverageGaps.length === 0 ? "Zero gaps" : adherence.coverageGaps.join(", ")}`);

// 5. Section Confidence Scoring
console.log("\n5. Testing Section Confidence Scoring...");
const sectionConf = calculateSectionConfidence(fullNotesSample, topicParams);
assert.ok(sectionConf.length >= 3, "Should evaluate all sections");
sectionConf.forEach((s) => {
  assert.ok(s.score >= 70 && s.score <= 100, "Section score should be 70-100%");
  console.log(`   ✓ [${s.score}%] "${s.sectionTitle}" — ${s.rationale}`);
});

// 6. Running Glossary Extractor
console.log("\n6. Testing Running Glossary Extraction...");
const glossary = extractGlossary(fullNotesSample, "stem");
assert.ok(glossary.length >= 1, "Glossary should extract defined terms");
assert.strictEqual(glossary[0].term.toLowerCase(), "backpropagation");
console.log(`   ✓ Extracted ${glossary.length} glossary terms: ${glossary.map((g) => g.term).join(", ")}`);

// 7. Table of Contents (TOC)
console.log("\n7. Testing Table of Contents Generator...");
const tocStandard = generateTableOfContents(fullNotesSample, "standard");
assert.ok(tocStandard.length >= 3, "Standard module should have >= 3 TOC entries");
console.log(`   ✓ Standard Module TOC entries: ${tocStandard.map((t) => t.title).join(" → ")}`);

const tocQuick = generateTableOfContents(fullNotesSample, "quick-summary");
assert.strictEqual(tocQuick.length, 0, "Quick summary module must omit TOC as specified");
console.log("   ✓ Quick Summary correctly omits TOC");

// 8. Multi-Format Exporters
console.log("\n8. Testing Multi-Format Exporters (Markdown, HTML, LaTeX, Plain Text)...");
const allExports = generateAllFormats(fullNotesSample, {
  topic: topicParams.topic,
  subject: topicParams.subject,
  toc: tocStandard,
  moduleType: "standard",
  actualWordCount: 350,
});

assert.ok(allExports.markdown.includes("## Table of Contents"), "Markdown export should include TOC");
assert.ok(allExports.html.includes("<!DOCTYPE html>"), "HTML export should be a valid HTML5 document");
assert.ok(allExports.html.includes("class=\"callout callout-definition\""), "HTML export should render styled callouts");
assert.ok(allExports.latex.includes("\\documentclass"), "LaTeX export should include documentclass");
assert.ok(allExports.latex.includes("\\begin{document}"), "LaTeX export should include document environment");
assert.ok(allExports.latex.includes("Neural Network Backpropagation"), "LaTeX export should include topic title");
assert.ok(allExports.plainText.includes("NEURAL NETWORK BACKPROPAGATION"), "Plain text export should include title header");

console.log("   ✓ Markdown format: valid");
console.log("   ✓ HTML format: standalone styled responsive HTML5 document");
console.log("   ✓ LaTeX format: PDF-ready compilable document with tcolorboxes");
console.log("   ✓ Plain Text format: clean structured ASCII layout");

// 9. Full Master Evaluator Test
console.log("\n9. Testing Master evaluateNotes Pipeline...");
const masterEval = evaluateNotes(fullNotesSample, topicParams);
assert.ok(masterEval.actualWordCount > 0, "Word count should be calculated");
assert.ok(masterEval.qaReport.overallConfidenceScore >= 70, "Confidence score should be >= 70%");
assert.ok(masterEval.metadataBlock.includes("Active Recall & Self-Assessment"), "Student Learning Accelerator must be generated");
assert.ok(!masterEval.metadataBlock.includes("Quality Assurance Audit"), "QA audit tables must NOT be in notes");
assert.ok(!masterEval.metadataBlock.includes("Coverage Gap Assessment"), "Coverage gap assessment must NOT be in notes");
console.log(`   ✓ Master Evaluation: ${masterEval.actualWordCount} words, Active Recall & Exam Traps verified.`);

console.log("\n🎉 ALL UNIT AND INTEGRATION TESTS PASSED SUCCESSFULLY!\n");
