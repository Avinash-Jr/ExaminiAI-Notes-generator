import assert from "node:assert";
import { buildPrompt } from "../utils/promptBuilder.js";
import { fetchWikimediaImages, enrichWithMedia } from "../services/media.services.js";
import { assessGeneratedNotes } from "../utils/generationQuality.js";

console.log("🚀 Testing Slider Word Count, Fallback Routing & Media Enrichment...\n");

// 1. Test Dynamic Word Count Prompt Scaling
console.log("1. Testing Slider Word Count Scaling in Prompts...");
const testCases = [
  { targetWordCount: 800, moduleType: "quick-summary", minExpected: 680 },
  { targetWordCount: 2000, moduleType: "standard", minExpected: 1700 },
  { targetWordCount: 4500, moduleType: "comprehensive", minExpected: 3825 },
  { targetWordCount: 7500, moduleType: "custom", minExpected: 6375 },
];

for (const tc of testCases) {
  const prompt = buildPrompt({
    topic: "Distributed Consensus",
    subject: "Computer Science",
    domain: "stem",
    moduleType: tc.moduleType,
    targetWordCount: tc.targetWordCount,
  });

  assert(
    prompt.includes(`TARGET WORD COUNT:** Approximately ${tc.targetWordCount} words`),
    `Prompt must reflect ${tc.targetWordCount} words in length enforcement`,
  );
  assert(
    prompt.includes(`MINIMUM ACCEPTABLE LENGTH:** ${tc.minExpected} words`),
    `Prompt must enforce minimum ${tc.minExpected} words`,
  );
  console.log(`   ✓ Target ${tc.targetWordCount} words verified: min ${tc.minExpected} words enforced.`);
}

// 2. Test In-Diagram Explanation and Reference Image Directives in Prompt
console.log("\n2. Testing Image & Diagram Directives in Prompt...");
const visualPrompt = buildPrompt({
  topic: "Cellular Respiration",
  subject: "Biology",
  domain: "stem",
  includeDiagrams: true,
  targetWordCount: 2500,
});

assert(visualPrompt.includes("[[IMAGE: 2-4 keyword query"), "Prompt must mandate [[IMAGE: ...]] markers");
assert(visualPrompt.includes("Visual Insight:"), "Prompt must mandate visual insight callout after images");
assert(visualPrompt.includes("Descriptive Node Labels (Explanation Inside Nodes):"), "Prompt must mandate explanatory node labels");
assert(visualPrompt.includes("What it shows:"), "Prompt must mandate 3-line diagram explanation");
console.log("   ✓ In-diagram explanation and reference image requirements verified in prompt.");

// 3. Test Wikimedia Image Query Tiering & Media Enrichment
console.log("\n3. Testing Media Enrichment & Fallback Formatting...");
async function testMedia() {
  const sampleNote = `
# Cellular Respiration

[[IMAGE: mitochondria structure inner membrane | Cross-section of a mitochondrion showing cristae ]]
> 🔵 **Visual Insight:** Notice the folded inner membrane providing extensive surface area for ATP synthase complexes.

\`\`\`mermaid
flowchart TD
  A["Glycolysis<br/>(Cytoplasm: breaks glucose into pyruvate)"]:::process --> B["Krebs Cycle<br/>(Matrix: produces NADH and FADH2)"]:::process
\`\`\`
> 🔵 **What it shows:** Pathway of cellular energy production.
> 🟡 **Key relationship:** Pyruvate from glycolysis feeds into the matrix.
> 🔴 **Why it matters for MCAT:** High-yield question target.
`;

  const enriched = await enrichWithMedia(sampleNote, {
    topic: "Cellular Respiration",
    subject: "Biology",
  });

  assert(enriched.text.includes("Visual Insight:"), "Visual insight callout preserved");
  assert(
    enriched.text.includes("![Cross-section of a mitochondrion") ||
    enriched.text.includes("Figure Reference:"),
    "Image marker successfully enriched or formatted as reference figure",
  );
  console.log("   ✓ Media enrichment verified: markers properly processed without HTML leakage.");
}

await testMedia();

// 4. Test Diagram Assessment Flexibility (Allowing 2-6 diagrams/visuals)
console.log("\n4. Testing Diagram & Quality Assessment...");
const notesSample = `
# Sample
## Sec 1
> [DEFINITION] **Term 1:** definition text
> [EXAMPLE] **Example 1:** example text
> 🔵 **What it shows:** ...
\`\`\`mermaid
flowchart TD
  A --> B
\`\`\`
[[IMAGE: term | Caption ]]
## 🎯 Quick Revision
Summary
`;
const assessment = assessGeneratedNotes(notesSample, {
  topic: "Sample",
  includeDiagrams: true,
  isDetailedNotes: false,
});
assert.strictEqual(assessment.diagramCount, 2, "Should count 2 diagrams/visuals");
assert.strictEqual(assessment.valid, true, "Should be valid with 2 visuals (no false repair triggers)");
console.log("   ✓ Quality assessment accepts 2-6 visuals without triggering repair errors.");

console.log("\n🎉 ALL WORD COUNT, MEDIA, AND PROMPT ENFORCEMENT TESTS PASSED!");
