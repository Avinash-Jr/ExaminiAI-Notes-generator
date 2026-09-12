import { useMemo } from "react";

function safeImageUrl(u) {
  try {
    const url = new URL(u);
    if (url.protocol !== "https:") return null;
    return url.toString().slice(0, 900);
  } catch {
    return null;
  }
}

function ChartBlock({ title, rows }) {
  if (!rows?.length) return null;
  const headers = rows[0] || [];
  const body = rows.slice(1);
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white">
      {title ? (
        <div className="border-b border-line bg-brand-tint px-4 py-2 text-sm font-semibold text-ink">
          {title}
        </div>
      ) : null}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {headers.map((c, i) => (
              <th
                key={i}
                className="border border-line bg-brand-tint px-3 py-2 text-left font-semibold"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((r, i) => (
            <tr key={i} className={i % 2 ? "bg-band" : ""}>
              {r.map((c, j) => (
                <td key={j} className="border border-line px-3 py-2">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const CALLOUT_STYLES = {
  definition: "border-l-4 border-emerald-600 bg-emerald-50 text-emerald-950",
  example: "border-l-4 border-violet-600 bg-violet-50 text-violet-950",
  warning: "border-l-4 border-rose-600 bg-rose-50 text-rose-950",
  quote: "border-l-4 border-teal-600 bg-teal-50 text-teal-950",
  key: "border-l-4 border-amber-600 bg-amber-100 text-amber-950",
};

function getCalloutTone(text) {
  const match = text.match(
    /^\[?(DEFINITION|EXAMPLE|WARNING|QUOTE|KEY POINT)\]?/i,
  );
  if (!match) return null;
  return match[1].toLowerCase().replace(" ", "-") === "key-point"
    ? "key"
    : match[1].toLowerCase();
}

function cleanCalloutText(text) {
  return text.replace(
    /^\[?(DEFINITION|EXAMPLE|WARNING|QUOTE|KEY POINT)\]?\s*/i,
    "",
  );
}

function MermaidFallback({ code }) {
  const lines = code
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const nodes = [];
  for (const ln of lines) {
    if (
      ln.startsWith("classDef") ||
      ln.startsWith("class ") ||
      ln.startsWith("style ") ||
      ln.startsWith("subgraph") ||
      ln === "end"
    )
      continue;
    const ms = [...ln.matchAll(/\["?(.*?)"?\]|\{"?(.*?)"?\}|\("?(.*?)"?\)/g)];
    for (const mm of ms) {
      const raw = (mm[1] || mm[2] || mm[3] || "").trim();
      if (raw && !raw.startsWith(":::")) {
        nodes.push(raw);
      }
    }
  }
  const unique = [...new Set(nodes.filter(Boolean))].slice(0, 16);
  if (!unique.length)
    return (
      <pre className="overflow-x-auto rounded-xl bg-ink p-4 text-xs leading-relaxed text-white">
        <code>{code}</code>
      </pre>
    );

  return (
    <div className="my-6 rounded-2xl border border-line bg-surface/50 p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-tint text-brand text-xs font-bold">
            📊
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-ink">
            Interactive Architecture & Concept Flow
          </span>
        </div>
        <span className="text-fine text-ink-3">Visual Diagram Flow</span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {unique.map((item, i) => {
          const parts = item.split(/<br\s*\/?>/i);
          const title = parts[0]?.replace(/^["']|["']$/g, "").trim();
          const subtitle = parts
            .slice(1)
            .join(" ")
            ?.replace(/^["']|["']$/g, "")
            .trim();
          return (
            <div
              key={i}
              className="relative flex flex-col justify-between rounded-xl border border-line/80 bg-sheet p-3.5 shadow-2xs transition-all hover:border-brand/40"
            >
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-tint text-[11px] font-bold text-brand">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink leading-snug">
                    {title}
                  </div>
                  {subtitle && (
                    <div className="mt-1 text-xs text-ink-3 leading-relaxed">
                      {subtitle}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <details className="mt-4 text-xs text-ink-3 border-t border-line/50 pt-3">
        <summary className="cursor-pointer font-medium hover:text-ink">
          View Raw Diagram Specification
        </summary>
        <pre className="mt-2 overflow-x-auto rounded-xl bg-ink p-3.5 text-xs text-slate-200">
          <code>{code}</code>
        </pre>
      </details>
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function parseNoteBlocks(raw) {
  let s = String(raw || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\r\n/g, "\n");
  const mermaidRe = /```\s*mermaid\s*\n([\s\S]*?)```/gi;
  const mermaidBlocks = [];
  s = s.replace(mermaidRe, (_, code) => {
    const idx = mermaidBlocks.length;
    mermaidBlocks.push(code.trim());
    return `\n__MERMAID_${idx}__\n`;
  });
  const codeRe = /```([\s\S]*?)```/g;
  const codeBlocks = [];
  s = s.replace(codeRe, (_, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push(code.trim());
    return `\n__CODE_${idx}__\n`;
  });
  const chunks = s.split(/\n{2,}/);
  const blocks = [];
  for (let chunk of chunks) {
    chunk = chunk.trim();
    if (!chunk) continue;
    const mm = chunk.match(/^__MERMAID_(\d+)__$/);
    if (mm) {
      blocks.push({ kind: "mermaid", code: mermaidBlocks[Number(mm[1])] });
      continue;
    }
    const cc = chunk.match(/^__CODE_(\d+)__$/);
    if (cc) {
      blocks.push({ kind: "code", code: codeBlocks[Number(cc[1])] });
      continue;
    }
    if (/^Chart\s*:/i.test(chunk)) {
      const lines = chunk
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const title = lines[0].replace(/^Chart\s*:\s*/i, "").trim();
      const tableLines = lines.slice(1).filter((l) => l.includes("|"));
      const rows = tableLines.length
        ? tableLines.map((l) =>
            l
              .split("|")
              .map((c) => c.trim())
              .filter(Boolean),
          )
        : [];
      const filtered = rows.filter(
        (r, i) => !(i === 1 && r.every((c) => /^[-:]+$/.test(c))),
      );
      const final = filtered.length ? filtered : rows;
      if (final.length) {
        blocks.push({ kind: "chart", title, rows: final });
        continue;
      }
    }
    if (/^>\s*/.test(chunk)) {
      const text = chunk
        .split("\n")
        .map((line) => line.replace(/^>\s?/, ""))
        .join(" ")
        .trim();
      const tone = getCalloutTone(text);
      blocks.push({
        kind: "callout",
        tone,
        text: tone ? cleanCalloutText(text) : text,
      });
      continue;
    }
    if (
      chunk.split("\n").every((l) => l.includes("|")) &&
      chunk.includes("|")
    ) {
      const lines = chunk
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const rows = lines.map((l) =>
        l
          .split("|")
          .map((c) => c.trim())
          .filter(Boolean),
      );
      const filtered = rows.filter(
        (r, i) => !(i === 1 && r.every((c) => /^[-:]+$/.test(c))),
      );
      blocks.push({ kind: "table", rows: filtered.length ? filtered : rows });
      continue;
    }
    if (chunk.includes("![") && chunk.includes("](")) {
      blocks.push({ kind: "markdown", text: chunk });
      continue;
    }
    if (/^#{1,3}\s+/.test(chunk.split("\n")[0])) {
      const first = chunk.split("\n")[0];
      const rest = chunk.split("\n").slice(1).join("\n").trim();
      blocks.push({ kind: "heading", text: first });
      if (rest) blocks.push({ kind: "markdown", text: rest });
      continue;
    }
    blocks.push({ kind: "markdown", text: chunk });
  }
  return blocks;
}

function renderInline(s) {
  const imgRe = /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
  let last = 0;
  let m;
  const segments = [];
  while ((m = imgRe.exec(s)) !== null) {
    if (m.index > last) segments.push({ t: "text", v: s.slice(last, m.index) });
    segments.push({ t: "img", alt: m[1], url: m[2] });
    last = m.index + m[0].length;
  }
  if (last < s.length) segments.push({ t: "text", v: s.slice(last) });
  if (!segments.length) segments.push({ t: "text", v: s });
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.t === "img") {
          const safe = safeImageUrl(seg.url);
          if (!safe) return null;
          return (
            <span
              key={`img-${i}`}
              className="my-3 block overflow-hidden rounded-xl border border-line bg-white"
            >
              <img
                src={safe}
                alt={seg.alt || "Illustration"}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="max-h-105 w-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              {seg.alt ? (
                <span className="block border-t border-line bg-band px-3 py-2 text-center text-xs text-ink-3">
                  {seg.alt}
                </span>
              ) : null}
            </span>
          );
        }
        const parts = seg.v.split(/(\*\*.+?\*\*)/g);
        return (
          <span key={`t-${i}`}>
            {parts.map((p, j) => {
              const b = p.match(/^\*\*(.+)\*\*$/);
              if (b)
                return (
                  <strong
                    key={j}
                    className="rounded-sm bg-yellow-200 px-0.5 font-bold text-amber-950"
                  >
                    {b[1]}
                  </strong>
                );
              return <span key={j}>{p}</span>;
            })}
          </span>
        );
      })}
    </>
  );
}

function InlineMarkdown({ text }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, li) => {
        const bullet = line.match(/^\s*[-*]\s+(.*)/);
        const numbered = line.match(/^\s*\d+\.\s+(.*)/);
        if (bullet)
          return (
            <div key={li} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              <span className="flex-1">{renderInline(bullet[1])}</span>
            </div>
          );
        if (numbered)
          return (
            <div key={li} className="flex gap-2">
              <span className="font-semibold text-brand">
                {line.trim().split(/\s+/)[0]}
              </span>
              <span className="flex-1">
                {renderInline(line.replace(/^\s*\d+\.\s+/, ""))}
              </span>
            </div>
          );
        if (!line.trim()) return <span key={li} className="block h-2" />;
        return (
          <span key={li} className="block">
            {renderInline(line)}
          </span>
        );
      })}
    </>
  );
}

export function NoteContent({ content }) {
  const blocks = useMemo(() => parseNoteBlocks(content), [content]);
  return (
    <div className="space-y-4 text-[0.9375rem] leading-relaxed">
      {blocks.map((b, i) => {
        if (b.kind === "mermaid")
          return <MermaidFallback key={i} code={b.code} />;
        if (b.kind === "code")
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-xl bg-ink p-4 text-sm leading-relaxed text-slate-100"
            >
              <code>{b.code}</code>
            </pre>
          );
        if (b.kind === "chart")
          return <ChartBlock key={i} title={b.title} rows={b.rows} />;
        if (b.kind === "callout")
          return (
            <blockquote
              key={i}
              className={`rounded-r-lg px-4 py-3 ${CALLOUT_STYLES[b.tone] || "border-l-4 border-teal-600 bg-teal-50 text-teal-950"}`}
            >
              <InlineMarkdown text={b.text} />
            </blockquote>
          );
        if (b.kind === "table") {
          const [h, ...body] = b.rows;
          return (
            <div
              key={i}
              className="overflow-x-auto rounded-xl border border-line"
            >
              <table className="w-full border-collapse text-sm">
                {h ? (
                  <thead>
                    <tr>
                      {h.map((c, j) => (
                        <th
                          key={j}
                          className="border border-line bg-brand-tint px-3 py-2 text-left font-semibold"
                        >
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                ) : null}
                <tbody>
                  {body.map((r, ri) => (
                    <tr key={ri} className={ri % 2 ? "bg-band" : ""}>
                      {r.map((c, ci) => (
                        <td key={ci} className="border border-line px-3 py-2">
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (b.kind === "heading") {
          const h1 = b.text.match(/^#\s+(.*)/);
          const h2 = b.text.match(/^##\s+(.*)/);
          const h3 = b.text.match(/^###\s+(.*)/);
          if (h1 && b.text.startsWith("# "))
            return (
              <h1 key={i} className="mt-6 text-2xl font-bold text-rose-800">
                {renderInline(h1[1])}
              </h1>
            );
          if (h2)
            return (
              <h2 key={i} className="mt-6 text-xl font-bold text-sky-800">
                {renderInline(h2[1])}
              </h2>
            );
          if (h3)
            return (
              <h3 key={i} className="mt-6 text-lg font-bold text-violet-800">
                {renderInline(h3[1])}
              </h3>
            );
        }
        return (
          <div key={i} className="leading-relaxed text-ink-2">
            <InlineMarkdown text={b.text} />
          </div>
        );
      })}
    </div>
  );
}
