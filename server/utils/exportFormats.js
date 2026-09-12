/**
 * exportFormats.js - Multi-Format Export Converter for ExaminAI
 *
 * Converts notes content into clean, export-ready documents in:
 * 1. Markdown (.md)
 * 2. Standalone HTML (.html) with responsive CSS & typography
 * 3. PDF-Ready LaTeX (.tex) for pdflatex compilation
 * 4. Plain Text (.txt) with structured ASCII/Unicode layout
 */

/**
 * Escapes HTML entities
 */
function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Escapes LaTeX special characters
 */
function escapeLatex(text) {
  return String(text || "")
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([&%$#_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

/**
 * Generates clean Markdown with auto-generated TOC and clean formatting
 */
export function convertToMarkdown(content, { topic, subject, toc = [], moduleType = "standard" } = {}) {
  let md = `# ${topic}\n`;
  if (subject) md += `*Subject: ${subject}*\n\n`;

  // Include TOC if longer than Quick Summary
  if (moduleType !== "quick-summary" && toc.length > 0) {
    md += `## Table of Contents\n\n`;
    for (const item of toc) {
      const indent = item.level === 3 ? "  - " : "- ";
      md += `${indent}[${item.title}](#${item.anchor})\n`;
    }
    md += `\n---\n\n`;
  }

  md += content;
  return md.trim() + "\n";
}

/**
 * Generates Standalone Styled HTML document
 */
export function convertToHtml(content, { topic, subject, toc = [], moduleType = "standard", metadataBlock = "" } = {}) {
  // Convert simple markdown elements to HTML
  let bodyHtml = escapeHtml(content);

  // Fenced code blocks
  bodyHtml = bodyHtml.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/gi, (match, lang, code) => {
    return `<pre class="code-block"><code class="language-${lang}">${code.trim()}</code></pre>`;
  });

  // Headers
  bodyHtml = bodyHtml.replace(/^### (.*$)/gim, '<h3 id="$1">$1</h3>');
  bodyHtml = bodyHtml.replace(/^## (.*$)/gim, '<h2 id="$1">$1</h2>');
  bodyHtml = bodyHtml.replace(/^# (.*$)/gim, '<h1 id="$1">$1</h1>');

  // Callouts
  bodyHtml = bodyHtml.replace(
    /&gt;\s*\[DEFINITION\]\s*([\s\S]*?)(?=\n\n|\n[^\s&]|$)/gi,
    '<div class="callout callout-definition"><div class="callout-badge">Definition</div><div class="callout-body">$1</div></div>'
  );
  bodyHtml = bodyHtml.replace(
    /&gt;\s*\[EXAMPLE\]\s*([\s\S]*?)(?=\n\n|\n[^\s&]|$)/gi,
    '<div class="callout callout-example"><div class="callout-badge">Worked Example</div><div class="callout-body">$1</div></div>'
  );
  bodyHtml = bodyHtml.replace(
    /&gt;\s*\[WARNING\]\s*([\s\S]*?)(?=\n\n|\n[^\s&]|$)/gi,
    '<div class="callout callout-warning"><div class="callout-badge">Exam Trap / Warning</div><div class="callout-body">$1</div></div>'
  );
  bodyHtml = bodyHtml.replace(
    /&gt;\s*\[KEY POINT\]\s*([\s\S]*?)(?=\n\n|\n[^\s&]|$)/gi,
    '<div class="callout callout-key"><div class="callout-badge">Key Point</div><div class="callout-body">$1</div></div>'
  );
  bodyHtml = bodyHtml.replace(
    /&gt;\s*\[TIP\]\s*([\s\S]*?)(?=\n\n|\n[^\s&]|$)/gi,
    '<div class="callout callout-tip"><div class="callout-badge">Pro Tip</div><div class="callout-body">$1</div></div>'
  );
  bodyHtml = bodyHtml.replace(
    /&gt;\s*([\s\S]*?)(?=\n\n|\n[^\s&]|$)/gi,
    '<blockquote class="quote-block">$1</blockquote>'
  );

  // Markdown tables
  bodyHtml = bodyHtml.replace(
    /((?:\|[^\n]+\|\r?\n)+)/g,
    (tableMatch) => {
      const rows = tableMatch.trim().split("\n").map((r) => r.trim());
      if (rows.length < 2) return tableMatch;
      let tableHtml = '<div class="table-container"><table class="notes-table">';
      rows.forEach((row, i) => {
        if (/^\|[-:\s|]+\|$/.test(row)) return; // separator line
        const cols = row.split("|").slice(1, -1).map((c) => c.trim());
        const tag = i === 0 ? "th" : "td";
        tableHtml += "<tr>";
        cols.forEach((col) => {
          tableHtml += `<${tag}>${col}</${tag}>`;
        });
        tableHtml += "</tr>";
      });
      tableHtml += "</table></div>";
      return tableHtml;
    }
  );

  // Bold & Italic
  bodyHtml = bodyHtml.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  bodyHtml = bodyHtml.replace(/\*(.*?)\*/g, "<em>$1</em>");
  bodyHtml = bodyHtml.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Horizontal rules
  bodyHtml = bodyHtml.replace(/^(?:---|\*\*\*|___)$/gm, "<hr class='section-divider' />");

  // Paragraphs
  bodyHtml = bodyHtml
    .split(/\n\s*\n/)
    .map((block) => {
      if (/^<(?:h[1-6]|div|blockquote|pre|hr|ul|ol|table)/i.test(block.trim())) {
        return block;
      }
      return `<p>${block.trim().replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");

  let tocHtml = "";
  if (moduleType !== "quick-summary" && toc.length > 0) {
    tocHtml = `
    <nav class="toc-container" aria-label="Table of Contents">
      <h2 class="toc-title">Table of Contents</h2>
      <ul class="toc-list">
        ${toc
          .map(
            (item) => `
          <li class="toc-item toc-level-${item.level}">
            <a href="#${item.anchor}">${escapeHtml(item.title)}</a>
          </li>`
          )
          .join("")}
      </ul>
    </nav>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(topic)} — ExaminAI Notes</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #ffffff;
      --surface: #f8fafc;
      --card-bg: #ffffff;
      --border: #e2e8f0;
      --text: #0f172a;
      --text-muted: #64748b;
      --brand: #4f46e5;
      --brand-tint: #eef2ff;
      --font-main: 'Inter', system-ui, -apple-system, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0b0f19;
        --surface: #111827;
        --card-bg: #1f2937;
        --border: #374151;
        --text: #f3f4f6;
        --text-muted: #9ca3af;
        --brand: #6366f1;
        --brand-tint: #1e1b4b;
      }
    }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 2.5rem 1.5rem;
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-main);
      font-size: 16px;
      line-height: 1.7;
    }
    .container {
      max-width: 860px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 2px solid var(--border);
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
    }
    .subject-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--brand);
      background: var(--brand-tint);
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      margin-bottom: 0.75rem;
    }
    h1 { font-size: 2.25rem; font-weight: 800; line-height: 1.2; margin: 0 0 0.5rem; letter-spacing: -0.02em; }
    h2 { font-size: 1.5rem; font-weight: 700; margin: 2rem 0 1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
    h3 { font-size: 1.2rem; font-weight: 600; margin: 1.5rem 0 0.75rem; }
    p { margin: 0 0 1.25rem; }
    strong { font-weight: 700; }
    code { font-family: var(--font-mono); font-size: 0.88em; background: var(--surface); border: 1px solid var(--border); padding: 0.15rem 0.35rem; border-radius: 4px; }
    pre.code-block { background: #0f172a; color: #f8fafc; padding: 1.25rem; border-radius: 8px; overflow-x: auto; font-family: var(--font-mono); font-size: 0.9em; margin: 1.5rem 0; }
    .toc-container { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; margin: 2rem 0; }
    .toc-title { font-size: 1.1rem; font-weight: 700; margin: 0 0 1rem; border: none; padding: 0; }
    .toc-list { list-style: none; padding-left: 0; margin: 0; }
    .toc-item { margin-bottom: 0.4rem; }
    .toc-item a { color: var(--brand); text-decoration: none; font-weight: 500; font-size: 0.95rem; }
    .toc-item a:hover { text-decoration: underline; }
    .toc-level-3 { padding-left: 1.5rem; font-size: 0.88rem; }
    .callout { border-radius: 8px; padding: 1rem 1.25rem; margin: 1.5rem 0; border-left: 4px solid; }
    .callout-badge { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem; }
    .callout-definition { background: #ecfdf5; border-color: #059669; color: #064e3b; }
    .callout-example { background: #f5f3ff; border-color: #7c3aed; color: #3b0764; }
    .callout-warning { background: #fff1f2; border-color: #e11d48; color: #881337; }
    .callout-key { background: #fffbeb; border-color: #d97706; color: #78350f; }
    .callout-tip { background: #eff6ff; border-color: #2563eb; color: #1e3a8a; }
    .table-container { overflow-x: auto; margin: 1.5rem 0; }
    .notes-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.95rem; }
    .notes-table th, .notes-table td { padding: 0.75rem 1rem; border: 1px solid var(--border); }
    .notes-table th { background: var(--surface); font-weight: 700; }
    .section-divider { border: 0; border-top: 1px solid var(--border); margin: 2.5rem 0; }
    @media print {
      body { padding: 0; color: #000; background: #fff; }
      .toc-container, .code-block, .callout { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <main class="container">
    <header class="header">
      ${subject ? `<span class="subject-badge">${escapeHtml(subject)}</span>` : ""}
      <h1>${escapeHtml(topic)}</h1>
      <p style="color: var(--text-muted); font-size: 0.95rem;">Generated by ExaminAI Notes System &bull; ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
    </header>

    ${tocHtml}

    <article class="content">
      ${bodyHtml}
    </article>
  </main>
</body>
</html>`;
}

/**
 * Generates PDF-Ready LaTeX document (.tex)
 */
export function convertToLatex(content, { topic, subject, moduleType = "standard" } = {}) {
  const safeTopic = escapeLatex(topic);
  const safeSubject = escapeLatex(subject || "General Notes");

  let body = String(content || "");

  // Headings
  body = body.replace(/^### (.*$)/gim, (_, t) => `\\subsubsection{${escapeLatex(t.trim())}}`);
  body = body.replace(/^## (.*$)/gim, (_, t) => `\\subsection{${escapeLatex(t.trim())}}`);
  body = body.replace(/^# (.*$)/gim, (_, t) => `\\section{${escapeLatex(t.trim())}}`);

  // Callouts into tcolorboxes
  body = body.replace(
    />\s*\[DEFINITION\]\s*([\s\S]*?)(?=\n\n|\n[^\s>]|$)/gi,
    (_, text) => `\\begin{tcolorbox}[colback=emerald!5!white,colframe=emerald!75!black,title=Definition]\n${escapeLatex(text.trim())}\n\\end{tcolorbox}\n`
  );
  body = body.replace(
    />\s*\[EXAMPLE\]\s*([\s\S]*?)(?=\n\n|\n[^\s>]|$)/gi,
    (_, text) => `\\begin{tcolorbox}[colback=violet!5!white,colframe=violet!75!black,title=Worked Example]\n${escapeLatex(text.trim())}\n\\end{tcolorbox}\n`
  );
  body = body.replace(
    />\s*\[WARNING\]\s*([\s\S]*?)(?=\n\n|\n[^\s>]|$)/gi,
    (_, text) => `\\begin{tcolorbox}[colback=red!5!white,colframe=red!75!black,title=Warning / Exam Trap]\n${escapeLatex(text.trim())}\n\\end{tcolorbox}\n`
  );
  body = body.replace(
    />\s*\[KEY POINT\]\s*([\s\S]*?)(?=\n\n|\n[^\s>]|$)/gi,
    (_, text) => `\\begin{tcolorbox}[colback=amber!5!white,colframe=amber!75!black,title=Key Point]\n${escapeLatex(text.trim())}\n\\end{tcolorbox}\n`
  );

  // Bold and code
  body = body.replace(/\*\*(.*?)\*\*/g, (_, b) => `\\textbf{${escapeLatex(b)}}`);
  body = body.replace(/`([^`]+)`/g, (_, c) => `\\texttt{${escapeLatex(c)}}`);

  // Horizontal rules
  body = body.replace(/^(?:---|\*\*\*|___)$/gm, "\\noindent\\rule{\\textwidth}{0.4pt}");

  const includeToc = moduleType !== "quick-summary" ? "\\tableofcontents\n\\newpage" : "";

  return `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=1in]{geometry}
\\usepackage{amsmath,amsfonts,amssymb}
\\usepackage{hyperref}
\\usepackage{booktabs}
\\usepackage{xcolor}
\\usepackage{tcolorbox}
\\usepackage{microtype}

\\hypersetup{
    colorlinks=true,
    linkcolor=blue!70!black,
    citecolor=blue!70!black,
    urlcolor=blue!70!black
}

\\title{\\textbf{${safeTopic}}}
\\author{ExaminAI Notes Generator}
\\date{${new Date().toLocaleDateString()}}

\\begin{document}

\\maketitle

\\begin{center}
\\textit{Subject: ${safeSubject}}
\\end{center}

\\vspace{0.5cm}

${includeToc}

${body}

\\end{document}
`;
}

/**
 * Generates Clean Plain Text (.txt) with structured ASCII formatting
 */
export function convertToPlainText(content, { topic, subject, actualWordCount = 0 } = {}) {
  let plain = `================================================================================\n`;
  plain += `  ${String(topic).toUpperCase()}\n`;
  if (subject) plain += `  Subject: ${subject}\n`;
  plain += `  Generated via ExaminAI Notes System | Word Count: ${actualWordCount}\n`;
  plain += `================================================================================\n\n`;

  let text = String(content || "")
    .replace(/```[\s\S]*?```/g, (match) => {
      return match.replace(/```/g, "").trim();
    })
    .replace(/^### (.*$)/gim, "--- $1 ---")
    .replace(/^## (.*$)/gim, "\n>>> $1 <<<\n")
    .replace(/^# (.*$)/gim, "\n[ $1 ]\n")
    .replace(/>\s*\[DEFINITION\]\s*/gi, "[DEFINITION] ")
    .replace(/>\s*\[EXAMPLE\]\s*/gi, "[EXAMPLE] ")
    .replace(/>\s*\[WARNING\]\s*/gi, "[WARNING / EXAM TRAP] ")
    .replace(/>\s*\[KEY POINT\]\s*/gi, "[KEY POINT] ")
    .replace(/>\s*\[TIP\]\s*/gi, "[TIP] ")
    .replace(/>\s*/g, "  | ")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "'$1'")
    .replace(/\[\[IMAGE:[^\]]+\]\]/g, "");

  plain += text.trim() + "\n";
  return plain;
}

/**
 * Master exporter: produces all four clean format bundles
 */
export function generateAllFormats(content, options = {}) {
  const { topic, subject, toc = [], moduleType = "standard", actualWordCount = 0 } = options;

  const markdown = convertToMarkdown(content, { topic, subject, toc, moduleType });
  const html = convertToHtml(content, { topic, subject, toc, moduleType });
  const latex = convertToLatex(content, { topic, subject, moduleType });
  const plainText = convertToPlainText(content, { topic, subject, actualWordCount });

  return {
    markdown,
    html,
    latex,
    plainText,
  };
}
