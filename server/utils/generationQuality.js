function countMatches(text, pattern) {
  return [...String(text || "").matchAll(pattern)].length;
}

export function assessGeneratedNotes(
  text,
  { topic, includeDiagrams = false, isDetailedNotes = false } = {},
) {
  const source = String(text || "").trim();
  const diagramCount =
    countMatches(source, /```\s*mermaid\s*[\s\S]*?```/gi) +
    countMatches(source, /\[\[IMAGE:\s*[^\]|]+\s*\|\s*[^\]]+\]\]/gi);
  const headingCount = countMatches(source, /^#{1,3}\s+.+$/gm);
  const majorSectionCount = countMatches(source, /^##\s+.+$/gm);

  // 1. Definition detection: explicit tags, headings, bold list items, glossary rows, and definitional phrases
  let definitionCount = countMatches(source, /\[DEFINITION\]/gi);
  definitionCount += countMatches(
    source,
    /(?:^|\n)\s*(?:>\s*)?(?:#{1,4}\s+|\d+[\.\)]\s*|[-*•]\s*)?(?:[^\p{L}\p{N}\s]{1,4}\s*)?\*{0,2}Definition(?:\s+of\s+[^\n*:]+)?\*{0,2}\s*[:–—\n]/gimu,
  );
  definitionCount += countMatches(
    source,
    /(?:^|\n)\s*(?:>\s*)?(?:\d+[\.\)]\s*|[-*•]\s*)?\*\*[^*\n]+:\*\*\s+[^\n]*(?:means|is\s+defined\s+as|is\s+the|refers\s+to|describes|denotes)\b/gimu,
  );
  const glossaryRows = source.match(/\|\s*[^|\n]+\s*\|\s*[^|\n]+\s*\|\s*[^|\n]{10,}\s*\|/g);
  if (glossaryRows) {
    const validRows = glossaryRows.filter(
      (r) => !/\|\s*(?:Term|Domain|:-+)\b/i.test(r),
    );
    definitionCount += validRows.length;
  }
  definitionCount += countMatches(
    source,
    /\b(?:is\s+defined\s+as|can\s+be\s+defined\s+as|is\s+the\s+process\s+(?:by\s+which|wherein|where)|refers\s+to\s+the\s+(?:phenomenon|concept|process|state)|is\s+formalized\s+as)\b/gi,
  );

  // 2. Example detection: tags, headings, numbered/bulleted items, bold line leaders, and in-text phrases
  let exampleCount = countMatches(
    source,
    /\[(?:WORKED\s+)?(?:EXAMPLE|APPLICATION|CASE\s+STUDY|SCENARIO|PRACTICE)\]/gi,
  );
  exampleCount += countMatches(
    source,
    /(?:^|\n)\s*(?:>\s*)?(?:#{1,4}\s+|\d+[\.\)]\s*|[-*•]\s*)?(?:[^\p{L}\p{N}\s]{1,4}\s*)?\*{0,2}(?:Worked\s+|Real-World\s+|Clinical\s+|Practical\s+|Concrete\s+)?(?:Example|Application|Case\s+Study|Scenario|Illustration)(?:\s+(?:\d+|[A-Z]|[-–—]\s*[^\n*:]+))?\*{0,2}\s*[:–—\n]/gimu,
  );
  exampleCount += countMatches(
    source,
    /\b(?:For\s+example|For\s+instance|As\s+an\s+example|An\s+example\s+(?:of\s+this\s+)?is|One\s+example\s+is|A\s+classic\s+example\s+is|A\s+practical\s+application\s+is|Consider\s+(?:for\s+example\s+)?(?:the\s+case\s+of|the\s+example\s+of)?|e\.g\.,?)\b/gi,
  );

  const errors = [];

  if (isDetailedNotes) {
    if (source.length < 3500)
      errors.push(
        "The notes are below the minimum detailed length of 3,500 characters.",
      );
    if (headingCount < 6 || majorSectionCount < 5)
      errors.push(
        "The notes need at least five meaningful major sections with headings and subheadings.",
      );
    if (definitionCount < 3)
      errors.push(
        "The notes need at least three explicit definition callouts.",
      );
    if (exampleCount < 3)
      errors.push(
        "The notes need at least three relevant examples or applications.",
      );
    if (!/^#{1,3}\s+.*(?:Quick\s+Revision|Revision\s+Summary|Review\s+Checklist).*$/im.test(source))
      errors.push("The notes must end with a Quick Revision section.");
  }

  if (includeDiagrams && diagramCount < 2)
    errors.push(
      `The notes need at least 2 visual diagrams or reference images; found ${diagramCount}.`,
    );

  return {
    valid: errors.length === 0,
    errors,
    diagramCount,
    headingCount,
    majorSectionCount,
    definitionCount,
    exampleCount,
    topic,
  };
}

export function buildCalloutRepairPrompt(
  draft,
  { topic, subject, definitionCount = 0, exampleCount = 0 } = {},
) {
  const missingDefinitions = Math.max(1, 3 - definitionCount);
  const missingExamples = Math.max(1, 3 - exampleCount);
  return `Repair the study notes for "${topic}" in ${subject} by adding only the missing explicit callouts.

Return ONLY a Markdown section titled \`## Definitions and Applications\` followed by exactly ${missingDefinitions} definition callouts and exactly ${missingExamples} example callouts. Do not rewrite or summarize the existing notes.

Use these exact formats:
> [DEFINITION] **Term:** precise, topic-specific explanation
> [EXAMPLE] **Example:** concrete topic-specific application or case

Rules:
- Every callout must contain real content from or directly supported by the topic.
- Do not repeat concepts already defined or used in the draft.
- Definitions must explain what a concept is; examples must show how it applies.
- If a requested count is zero, emit no callouts of that type.

Existing notes for context:
${String(draft || "").slice(0, 24000)}`;
}

export function buildDiagramRepairPrompt(
  draft,
  { topic, subject, missingCount = 1 } = {},
) {
  return `Create exactly ${missingCount} additional, complete Mermaid diagrams for the study notes topic "${topic}" in ${subject}.

Return ONLY the diagram blocks and their headings. Do not return an introduction, conclusion, image URLs, or commentary.

Requirements:
- Generate exactly ${missingCount} diagrams, no more and no fewer.
- Each must use a distinct structure and explain a different high-value sub-topic from the draft: flowchart, concept map, comparison, hierarchy, lifecycle, sequence, or layered architecture.
- Number them after the existing diagrams using headings in this form: ### Diagram N: Specific concept name.
- Use valid Markdown Mermaid fences exactly as \`\`\`mermaid ... \`\`\`.
- Label every node, branch, layer, and relationship with concise English text.
- Immediately follow every diagram with exactly three lines:
  > 🔵 **What it shows:** [specific visual content]
  > 🟡 **Key relationship:** [specific relationship]
  > 🔴 **Why it matters:** [topic-specific exam relevance]

Existing draft for context:
${String(draft || "").slice(0, 18000)}`;
}

export function buildRepairPrompt(
  text,
  quality,
  { topic, subject, examType } = {},
) {
  const problems = quality.errors.map((error) => `- ${error}`).join("\n");
  return `You are revising an incomplete study guide for "${topic}" in ${subject}.

Return ONLY the corrected, complete Markdown study notes. Preserve accurate content from the draft, but expand or reorganize it where necessary.

Non-negotiable repair requirements:
- Produce comprehensive hierarchical notes with clear ## and ### headings.
- Explain definitions, mechanisms, features, examples/applications, relationships, exceptions, and exam relevance rather than listing labels.
- Keep the final notes above 3,500 characters, with at least five meaningful major sections, three definition callouts, three examples/applications, and a Quick Revision section.
- Use these exact canonical callout forms at least three times each so the quality check can verify them: \`> [DEFINITION] **Term:** precise explanation\` and \`> [EXAMPLE] **Example:** topic-specific application\`.
- Include at least 2 complete, topic-specific diagrams for the whole topic. Number each as \`### Diagram N: Specific concept name\`.
- Use distinct diagram structures such as a flowchart, concept map, comparison, hierarchy, lifecycle, sequence, or layered architecture. Use valid Mermaid or a specific IMAGE marker.
- Immediately follow every diagram with three concise textual descriptions: What it shows, Key relationship, and Why it matters for ${examType}.
- Recount the diagrams and verify all requirements before returning the corrected notes.

Problems detected in the draft:
${problems}

BEGIN DRAFT
${String(text || "").slice(0, 42000)}
END DRAFT`;
}
