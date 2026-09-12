import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { PassThrough } from "node:stream";
import { fileURLToPath } from "node:url";
import {
  generateNotePdf,
  readPdfOptions,
  parseMarkdown,
  THEMES,
} from "../utils/pdfGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.join(__dirname, "output");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log("🚀 Running PDF Visual & Technical Generation Test Suite...\n");

// Helper to run PDF generator and capture buffer
async function renderPdfToBuffer(note, options = {}) {
  const stream = new PassThrough();
  const chunks = [];
  const done = new Promise((resolve, reject) => {
    stream.on("data", (c) => chunks.push(c));
    stream.once("end", resolve);
    stream.once("error", reject);
  });
  await generateNotePdf(stream, note, options);
  await done;
  return Buffer.concat(chunks);
}

// 1. Test Markdown Parser
console.log("1. Testing Markdown Parser and Callout detection...");
const testMd = `
# 1. Fundamental Principles
> [DEFINITION] Thermodynamics: The branch of physical science that deals with the relations between heat and other forms of energy.

> [WARNING] Common Misconception: Heat is not a state function; it is path-dependent.

- [x] Review first law
- [ ] Derive Carnot efficiency

| Cycle Stage | Pressure | Volume | Temp |
| 1 -> 2 | High | Low | T1 |
| 2 -> 3 | Medium | Med | T2 |

\`\`\`python
def carnot_efficiency(th, tc):
    return 1 - (tc / th)
\`\`\`
`;
const blocks = parseMarkdown(testMd);
assert.ok(blocks.some((b) => b.kind === "heading" && b.text.includes("Fundamental Principles")));
assert.ok(blocks.some((b) => b.kind === "callout" && b.text.includes("Thermodynamics")));
assert.ok(blocks.some((b) => b.kind === "todo" && b.items.length === 2));
assert.ok(blocks.some((b) => b.kind === "table" && b.rows.length === 3));
assert.ok(blocks.some((b) => b.kind === "code" && b.language === "python"));
console.log("   ✓ Markdown parsing verified (headings, callouts, checklists, tables, code blocks).");

// 2. Test Quick Summary Note (Hero Banner Mode)
console.log("\n2. Testing Quick Summary generation with Hero Title Banner...");
const quickNote = {
  topic: "CRISPR-Cas9 Gene Editing",
  subject: "Molecular Biology",
  domain: "medicine",
  moduleType: "quick-summary",
  audienceLevel: "intermediate",
  actualWordCount: 450,
  content: `
# Overview of CRISPR
CRISPR-Cas9 provides precise targeted genome modification. Originally discovered as an adaptive immune mechanism in bacteria against bacteriophages.

> [KEY POINT] The single guide RNA (sgRNA) pairs with genomic DNA upstream of a Protospacer Adjacent Motif (PAM).

## Mechanism of Action
1. Recognition of the 5'-NGG PAM sequence by Cas9 endonuclease.
2. Unwinding of DNA duplex and RNA-DNA hybrid formation.
3. Generation of double-strand break (DSB) 3 base pairs upstream of PAM.

- [x] sgRNA synthesis
- [x] PAM target verification
- [ ] Cellular delivery via lentivirus
  `,
};

const quickPdf = await renderPdfToBuffer(quickNote, { coverStyle: "banner", template: "emerald" });
assert.ok(quickPdf.length > 3000, `PDF should be > 3KB, got ${quickPdf.length}`);
assert.strictEqual(quickPdf.subarray(0, 5).toString(), "%PDF-", "Should be a valid PDF buffer");
fs.writeFileSync(path.join(outputDir, "quick_summary_emerald.pdf"), quickPdf);
console.log(`   ✓ Quick Summary PDF generated: ${quickPdf.length} bytes -> saved to output/quick_summary_emerald.pdf`);

// 3. Test Standard Module with Executive Cover, TOC, Tables, Callouts
console.log("\n3. Testing Standard Module with Executive Cover & 2-Pass Page X of Y...");
const standardNote = {
  topic: "Macroeconomic Policy and Inflation Dynamics",
  subject: "Economics",
  domain: "business",
  moduleType: "standard",
  audienceLevel: "advanced",
  examType: "CFA Level 1",
  actualWordCount: 1850,
  content: `
# 1. Classical vs Keynesian Paradigms
Macroeconomic stabilization depends heavily on the policy transmission mechanism and monetary policy stance.

> [DEFINITION] Phillips Curve: The empirical inverse relationship between unemployment rate and inflation rate in an economy.

> [WORKED EXAMPLE] When the central bank raises the benchmark policy rate by 50 bps, borrowing costs increase, causing aggregate demand (AD) to shift leftward.

| Instrument | Mechanism | Target Variable | Typical Lag |
| Open Market Operations | Purchase/sale of government securities | Overnight interbank rate | 1 to 2 quarters |
| Reserve Requirements | Ratio of deposits banks must hold | Money multiplier | Immediate |
| Discount Window | Direct central bank lending rate | Liquidity backstop | Short-term |

## 1.1 The Taylor Rule
The Taylor rule prescribes how central banks should adjust policy rates:
r = r* + p + 0.5(p - p*) + 0.5(y - y*)

# 2. Modern Central Bank Frameworks
Inflation targeting frameworks require transparent forward guidance and credible commitment to anchor inflation expectations.

> [EXAM ALERT] Central bank credibility is key: if expectations become unanchored, the sacrifice ratio rises dramatically.

- [x] Monetary neutrality in long run
- [x] Short-run nominal rigidities
- [ ] Unconventional QE balance sheet dynamics

**Phillips Curve** — An economic concept stating that inflation and unemployment have a stable and inverse relationship.
**Taylor Rule** — An interest rate forecasting model invented by economist John Taylor.
**Sacrifice Ratio** — The percentage of real GDP lost for each 1% reduction in trend inflation.
  `,
};

const standardPdf = await renderPdfToBuffer(standardNote, { coverStyle: "cover", template: "indigo" });
assert.ok(standardPdf.length > 5000, `Standard PDF should be > 5KB, got ${standardPdf.length}`);
const countPages = (pdfBuffer) => (pdfBuffer.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length;
assert.strictEqual(countPages(quickPdf), 1, "Quick Summary must be exactly 1 page (no blank overflow pages)");
assert.strictEqual(countPages(standardPdf), 3, "Standard Note with cover must be exactly 3 pages of real content (no blank overflow pages)");
fs.writeFileSync(path.join(outputDir, "standard_module_indigo.pdf"), standardPdf);
console.log(`   ✓ Standard Module PDF generated: ${standardPdf.length} bytes (3 pages exactly) -> saved to output/standard_module_indigo.pdf`);

// 4. Test Comprehensive Module with Flowchart Diagram & Dark Theme
console.log("\n4. Testing Comprehensive Module with Flowchart & Dark Theme...");
const darkNote = {
  topic: "Neural Network Architecture & Backpropagation",
  subject: "Deep Learning",
  domain: "stem",
  moduleType: "comprehensive",
  audienceLevel: "expert",
  actualWordCount: 3200,
  content: `
# 1. Computation Graph and Forward Pass
Deep neural networks execute sequential tensor operations across parameterized layers.

flowchart LR
    Input[Input Vector] --> Hidden1[Dense Layer 1]
    Hidden1 --> Activation[ReLU Activation]
    Activation --> Hidden2[Dense Layer 2]
    Hidden2 --> Output[Softmax Loss]

## 1.1 Gradient Backpropagation
The chain rule decomposes compound matrix gradients:
dL/dW = dL/dy * dy/dz * dz/dW

\`\`\`python
import torch
import torch.nn as nn

class Net(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(784, 128)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(128, 10)
    
    def forward(self, x):
        return self.fc2(self.relu(self.fc1(x)))
\`\`\`

> [KEY POINT] Gradient vanishing occurs when activation derivative saturation contracts backpropagating error vectors.
  `,
};

const darkPdf = await renderPdfToBuffer(darkNote, { coverStyle: "cover", template: "dark" });
assert.ok(darkPdf.length > 5000, `Dark PDF should be > 5KB, got ${darkPdf.length}`);
assert.strictEqual(countPages(darkPdf), 2, "Dark Theme PDF must be exactly 2 pages (no blank overflow pages)");
fs.writeFileSync(path.join(outputDir, "dark_theme_neural_net.pdf"), darkPdf);
console.log(`   ✓ Dark Theme PDF generated: ${darkPdf.length} bytes (2 pages exactly) -> saved to output/dark_theme_neural_net.pdf`);

// 6. Test Handwritten Sketchbook Theme (Spiral binding, doodle cards, sticky notes)
console.log("\n6. Testing Handwritten Sketchbook Theme (Spiral Binding & Sticky Notes)...");
const sketchbookNote = {
  topic: "Reproduction in Humans & Gametogenesis",
  subject: "Human Biology",
  domain: "medicine",
  moduleType: "comprehensive",
  audienceLevel: "intermediate",
  examType: "MCAT / USMLE",
  actualWordCount: 1450,
  content: `
# 1. Male and Female Reproductive Systems
Human reproduction involves internal fertilization followed by embryonic development within the uterus.

> [DEFINITION] Gametogenesis: The biological process by which diploid precursor cells undergo meiotic division and cytodifferentiation to produce mature haploid gametes.

> [KEY POINT] The hypothalamic-pituitary-gonadal (HPG) axis governs hormonal regulation through pulsatile GnRH secretion.

| Organ / Structure | Primary Function | Key Secretion |
| Testes (Seminiferous Tubules) | Spermatogenesis | Testosterone & Inhibin |
| Epididymis | Sperm maturation & storage | Glycoproteins |
| Ovaries (Follicles) | Oogenesis & ovulation | Estrogen & Progesterone |
| Fallopian Tubes (Ampulla) | Site of fertilization | Ciliary fluid current |

## 1.1 Hormonal Cascade & Feedback
Negative feedback mechanisms prevent hormonal overstimulation:

flowchart LR
    Hypothalamus[Hypothalamus GnRH] --> Pituitary[Anterior Pituitary LH / FSH]
    Pituitary --> Gonads[Gonads Testes / Ovaries]
    Gonads --> Steroids[Sex Steroids Testosterone / Estrogen]

\`\`\`python
# Simple ovarian cycle phase estimator
def get_cycle_phase(day):
    if day <= 5: return "Menstrual Phase"
    elif day <= 13: return "Follicular Phase"
    elif day == 14: return "Ovulation Peak"
    else: return "Luteal Phase"
\`\`\`

> [WARNING] Common Exam Trap: hCG is secreted by the syncytiotrophoblast to rescue the corpus luteum, NOT by the maternal ovary!

- [x] Mitotic proliferation of primordial germ cells
- [x] Primary oocyte arrest at Prophase I until puberty
- [ ] Secondary oocyte completion of Meiosis II upon fertilization
  `,
};

const sketchbookPdf = await renderPdfToBuffer(sketchbookNote, { coverStyle: "cover", template: "sketchbook" });
assert.ok(sketchbookPdf.length > 5000, `Sketchbook PDF should be > 5KB, got ${sketchbookPdf.length}`);
assert.strictEqual(sketchbookPdf.subarray(0, 5).toString(), "%PDF-", "Should be a valid PDF");
const sketchbookPages = countPages(sketchbookPdf);
console.log(`   ✓ Handwritten Sketchbook PDF generated: ${sketchbookPdf.length} bytes (${sketchbookPages} pages)`);
assert.ok(sketchbookPages >= 2 && sketchbookPages <= 4, `Expected 2-4 pages, got ${sketchbookPages}`);
fs.writeFileSync(path.join(outputDir, "sketchbook_reproduction_handbook.pdf"), sketchbookPdf);
console.log(`   ✓ Saved to output/sketchbook_reproduction_handbook.pdf`);

// 7. Test Auto-Selection of Sketchbook when template is omitted for handwritten note
console.log("\n7. Testing Auto-Selection of Sketchbook when template is omitted...");
const cellNote = {
  topic: "Cells Fundamental unit of life",
  subject: "Biology",
  domain: "stem",
  noteStyle: "handwritten",
  moduleType: "comprehensive",
  content: `
Welcome to my personal revision notes on Cell Biology. I've distilled the core mechanics here—focusing on the "why" and "how" rather than just rote memorization.

# 1. The Cell Theory & Structural Foundations
Everything starts w/ the Cell Theory. It's the bedrock of biology.

1. All living organisms are composed of cells.
2. The cell is the basic structural and functional unit of life.
3. All cells arise from pre-existing cells.

> [TIP] margin note: Don't forget Virchow's contribution to the third point—it's a classic exam trap!

# 2. The Plasma Membrane: The Gatekeeper
Building upon the structural foundation, we must understand the Fluid Mosaic Model.

> [KEY POINT] Phospholipids are amphipathic molecules forming a dynamic bilayer.
  `,
};

// Render with NO template option — should auto-detect handwritten and use sketchbook!
const autoDetectedPdf = await renderPdfToBuffer(cellNote, {});
assert.ok(autoDetectedPdf.length > 5000);
assert.strictEqual(autoDetectedPdf.subarray(0, 5).toString(), "%PDF-");
fs.writeFileSync(path.join(outputDir, "cells_handwritten_autodetected.pdf"), autoDetectedPdf);
console.log(`   ✓ Auto-detected Handwritten Note correctly generated as Sketchbook: ${autoDetectedPdf.length} bytes`);
console.log(`   ✓ Saved to output/cells_handwritten_autodetected.pdf`);

console.log("\n🎉 All PDF generation visual & technical tests passed successfully!");

