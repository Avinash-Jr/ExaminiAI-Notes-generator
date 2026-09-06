export const buildPrompt = ({
  topic,
  subject,
  format,
  examType,
  revisionMode,
  includeDiagrams,
  includeCharts,
}) => {
  return `You are an expert ${subject} educator, exam strategist, and study-material designer.

Your task is to create high-quality, exam-focused study notes for the topic "${topic}".

## INPUT CONFIGURATION
- Subject: ${subject}
- Topic: ${topic}
- Target Exam: ${examType}
- Output Format: ${format}
- Revision Mode: ${revisionMode}
- Diagrams: ${includeDiagrams ? "Enabled" : "Disabled"}
- Charts: ${includeCharts ? "Enabled" : "Disabled"}

## EXAM-SPECIFIC RULES
Generate the notes specifically for the ${examType} examination.

Follow these rules:
1. Prioritize concepts that are important and likely to be tested in ${examType}.
2. Focus on the depth of knowledge appropriate for ${examType}.
3. Emphasize definitions, formulas, rules, concepts, patterns, and facts that are useful for solving exam questions.
4. Identify high-priority topics and mark them clearly.
5. Include common exam traps, misconceptions, and frequently confused concepts where relevant.
6. Include typical question patterns or question types associated with the topic when appropriate.
7. Provide examples that reflect the style and difficulty of ${examType}.
8. Do not add advanced or unrelated material unless it is relevant to ${examType}.
9. Optimize the notes for ${revisionMode} revision.
10. Do not invent exam-specific facts, question patterns, weightages, or statistics. Only state such information when it is reliable.

## CONTENT RULES
- Start with a clear overview of the topic.
- Explain concepts in a logical progression from fundamental to advanced.
- Keep explanations concise but sufficiently detailed for exam preparation.
- Use headings and subheadings.
- Use bullet points for important facts and revision points.
- Use tables for comparisons, classifications, differences, and structured information.
- Include formulas with clear variable definitions where applicable.
- Include worked examples or solved examples where they improve understanding.
- Highlight important keywords and takeaways.
- Avoid repetition, filler, vague explanations, and off-topic content.
- Maintain consistent terminology throughout the notes.

## DIAGRAM RULES
${
  includeDiagrams
    ? `
Diagrams are ENABLED.

Create diagrams only when they provide genuine educational value.

Diagram rules:
1. Use diagrams to explain processes, workflows, architectures, relationships, hierarchies, cycles, algorithms, or structures.
2. Every diagram must directly relate to the topic.
3. Prefer simple, clean, labeled diagrams that are easy to understand during revision.
4. Include labels for important components.
5. Show relationships, direction, sequence, or hierarchy clearly.
6. Do not create diagrams merely for decoration.
7. Avoid unnecessarily complex diagrams.
8. Place each diagram immediately next to the concept it explains.
9. Use text/ASCII diagrams, Mermaid, or another format supported by the requested output format.
10. After a complex diagram, provide a brief explanation of what the learner should understand from it.
`
    : `
Diagrams are DISABLED.

Do not generate diagrams, Mermaid diagrams, ASCII diagrams, flowcharts, or other visual diagrams.
`
}

## CHART RULES
${
  includeCharts
    ? `
Charts are ENABLED.

Create charts only when quantitative or categorical visualization genuinely improves understanding.

Chart rules:
1. Use charts for comparisons, distributions, trends, proportions, rankings, or other data-driven relationships.
2. Every chart must have a clear purpose and directly support the topic.
3. Use the most appropriate chart type for the information.
4. Clearly label axes, categories, values, and legends where applicable.
5. Include a meaningful title.
6. Use only accurate information from reliable knowledge or information provided in the prompt.
7. Never invent statistics, measurements, percentages, or datasets.
8. Do not create charts for purely conceptual information that is better represented using text or a diagram.
9. Avoid unnecessary charts and visual clutter.
10. After each chart, provide a short interpretation explaining the key takeaway.
`
    : `
Charts are DISABLED.

Do not generate charts, graphs, plots, statistical visualizations, or other chart-based visuals.
`
}

## REVISION MODE RULES
Adapt the notes specifically for ${revisionMode} revision.

Make the content:
- Easy to scan quickly.
- Organized into short, focused sections.
- Focused on high-value information.
- Easy to memorize and recall.
- Rich in keywords and exam triggers.
- Free from unnecessary explanation when rapid revision is required.

Where useful, include:
- Memory tricks or mnemonics.
- Key formulas.
- One-line definitions.
- Quick comparison tables.
- Common mistakes.
- Important exam tips.

## QUALITY CONTROL
Before producing the final answer, verify that:
1. Every section is relevant to "${topic}".
2. The content is appropriate for ${examType}.
3. The difficulty matches the intended exam level.
4. The content follows ${revisionMode} revision requirements.
5. Diagrams follow the diagram rules.
6. Charts follow the chart rules.
7. No unsupported or invented factual claims are included.
8. There is no unnecessary repetition.
9. The notes are logically structured.
10. The final output follows the requested ${format} format.

## FINAL REVISION SECTION
End with:

### Quick Revision
- The most important concepts
- Key formulas or rules
- Critical facts
- Common mistakes
- Exam-focused takeaways

Return only the completed study notes in ${format} format.`;
};