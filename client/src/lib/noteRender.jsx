import { useMemo } from "react";

function safeImageUrl(u) {
  try { const url = new URL(u); if (url.protocol !== "https:") return null; return url.toString().slice(0, 900); } catch { return null; }
}

function ChartBlock({ title, rows }) {
  if (!rows?.length) return null;
  const headers = rows[0] || [];
  const body = rows.slice(1);
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white">
      {title ? <div className="border-b border-line bg-brand-tint px-4 py-2 text-sm font-semibold text-ink">{title}</div> : null}
      <table className="w-full border-collapse text-sm">
        <thead><tr>{headers.map((c, i) => <th key={i} className="border border-line bg-brand-tint px-3 py-2 text-left font-semibold">{c}</th>)}</tr></thead>
        <tbody>{body.map((r, i) => <tr key={i} className={i % 2 ? "bg-band" : ""}>{r.map((c, j) => <td key={j} className="border border-line px-3 py-2">{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function MermaidFallback({ code }) {
  const lines = code.split("\n").map((l) => l.trim()).filter(Boolean);
  const nodes = [];
  for (const ln of lines) {
    const ms = [...ln.matchAll(/\[([^\]]+)\]|\{([^}]+)\}|\(([^)]+)\)/g)];
    for (const mm of ms) nodes.push((mm[1] || mm[2] || mm[3] || "").trim());
    if (!ms.length && ln.includes("-->")) nodes.push(ln.replace(/-->/g, " → ").slice(0, 120));
  }
  const unique = [...new Set(nodes.filter(Boolean))].slice(0, 12);
  if (!unique.length) return <pre className="overflow-x-auto rounded-xl bg-ink p-4 text-xs leading-relaxed text-white"><code>{code}</code></pre>;
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink-3">Diagram</div>
      <div className="flex flex-wrap items-center gap-2">
        {unique.map((label, i) => (
          <span key={i} className="inline-flex items-center gap-2">
            <span className="rounded-lg border border-brand/20 bg-brand-tint px-3 py-2 text-sm font-medium text-ink">{label}</span>
            {i < unique.length - 1 ? <span className="text-brand">→</span> : null}
          </span>
        ))}
      </div>
      <details className="mt-3 text-xs text-ink-3"><summary className="cursor-pointer">Show source</summary><pre className="mt-2 overflow-x-auto rounded bg-ink p-3 text-white"><code>{code}</code></pre></details>
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function parseNoteBlocks(raw) {
  let s = String(raw || "").replace(/<[^>]*>/g, "").replace(/\r\n/g, "\n");
  const mermaidRe = /```mermaid\s*\n([\s\S]*?)```/g;
  const mermaidBlocks = [];
  s = s.replace(mermaidRe, (_, code) => { const idx = mermaidBlocks.length; mermaidBlocks.push(code.trim()); return `\n__MERMAID_${idx}__\n`; });
  const codeRe = /```([\s\S]*?)```/g;
  const codeBlocks = [];
  s = s.replace(codeRe, (_, code) => { const idx = codeBlocks.length; codeBlocks.push(code.trim()); return `\n__CODE_${idx}__\n`; });
  const chunks = s.split(/\n{2,}/);
  const blocks = [];
  for (let chunk of chunks) {
    chunk = chunk.trim(); if (!chunk) continue;
    const mm = chunk.match(/^__MERMAID_(\d+)__$/);
    if (mm) { blocks.push({ kind: "mermaid", code: mermaidBlocks[Number(mm[1])] }); continue; }
    const cc = chunk.match(/^__CODE_(\d+)__$/);
    if (cc) { blocks.push({ kind: "code", code: codeBlocks[Number(cc[1])] }); continue; }
    if (/^Chart\s*:/i.test(chunk)) {
      const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
      const title = lines[0].replace(/^Chart\s*:\s*/i, "").trim();
      const tableLines = lines.slice(1).filter((l) => l.includes("|"));
      const rows = tableLines.length ? tableLines.map((l) => l.split("|").map((c) => c.trim()).filter(Boolean)) : [];
      const filtered = rows.filter((r, i) => !(i === 1 && r.every((c) => /^[-:]+$/.test(c))));
      const final = filtered.length ? filtered : rows;
      if (final.length) { blocks.push({ kind: "chart", title, rows: final }); continue; }
    }
    if (chunk.split("\n").every((l) => l.includes("|")) && chunk.includes("|")) {
      const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
      const rows = lines.map((l) => l.split("|").map((c) => c.trim()).filter(Boolean));
      const filtered = rows.filter((r, i) => !(i === 1 && r.every((c) => /^[-:]+$/.test(c))));
      blocks.push({ kind: "table", rows: filtered.length ? filtered : rows });
      continue;
    }
    if (chunk.includes("![") && chunk.includes("](")) { blocks.push({ kind: "markdown", text: chunk }); continue; }
    if (/^#{1,3}\s+/.test(chunk.split("\n")[0])) {
      const first = chunk.split("\n")[0]; const rest = chunk.split("\n").slice(1).join("\n").trim();
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
  let last = 0; let m; const segments = [];
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
            <span key={`img-${i}`} className="my-3 block overflow-hidden rounded-xl border border-line bg-white">
              <img src={safe} alt={seg.alt || "Illustration"} loading="lazy" referrerPolicy="no-referrer" className="max-h-[420px] w-full object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} />
              {seg.alt ? <span className="block border-t border-line bg-band px-3 py-2 text-center text-xs text-ink-3">{seg.alt}</span> : null}
            </span>
          );
        }
        const parts = seg.v.split(/(\*\*.+?\*\*)/g);
        return (
          <span key={`t-${i}`}>
            {parts.map((p, j) => {
              const b = p.match(/^\*\*(.+)\*\*$/);
              if (b) return <strong key={j} className="font-semibold text-ink">{b[1]}</strong>;
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
        if (bullet) return <div key={li} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" /><span className="flex-1">{renderInline(bullet[1])}</span></div>;
        if (numbered) return <div key={li} className="flex gap-2"><span className="font-semibold text-brand">{line.trim().split(/\s+/)[0]}</span><span className="flex-1">{renderInline(line.replace(/^\s*\d+\.\s+/, ""))}</span></div>;
        if (!line.trim()) return <span key={li} className="block h-2" />;
        return <span key={li} className="block">{renderInline(line)}</span>;
      })}
    </>
  );
}

export function NoteContent({ content }) {
  const blocks = useMemo(() => parseNoteBlocks(content), [content]);
  return (
    <div className="space-y-4 text-[0.9375rem] leading-relaxed">
      {blocks.map((b, i) => {
        if (b.kind === "mermaid") return <MermaidFallback key={i} code={b.code} />;
        if (b.kind === "code") return <pre key={i} className="overflow-x-auto rounded-xl bg-ink p-4 text-sm leading-relaxed text-white"><code>{b.code}</code></pre>;
        if (b.kind === "chart") return <ChartBlock key={i} title={b.title} rows={b.rows} />;
        if (b.kind === "table") {
          const [h, ...body] = b.rows;
          return (
            <div key={i} className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full border-collapse text-sm">
                {h ? <thead><tr>{h.map((c, j) => <th key={j} className="border border-line bg-brand-tint px-3 py-2 text-left font-semibold">{c}</th>)}</tr></thead> : null}
                <tbody>{body.map((r, ri) => <tr key={ri} className={ri % 2 ? "bg-band" : ""}>{r.map((c, ci) => <td key={ci} className="border border-line px-3 py-2">{c}</td>)}</tr>)}</tbody>
              </table>
            </div>
          );
        }
        if (b.kind === "heading") {
          const h1 = b.text.match(/^#\s+(.*)/);
          const h2 = b.text.match(/^##\s+(.*)/);
          const h3 = b.text.match(/^###\s+(.*)/);
          if (h1 && b.text.startsWith("# ")) return <h1 key={i} className="mt-6 text-2xl font-bold text-ink">{renderInline(h1[1])}</h1>;
          if (h2) return <h2 key={i} className="mt-6 text-xl font-bold text-ink">{renderInline(h2[1])}</h2>;
          if (h3) return <h3 key={i} className="mt-6 text-lg font-bold text-ink">{renderInline(h3[1])}</h3>;
        }
        return <div key={i} className="leading-relaxed text-ink-2"><InlineMarkdown text={b.text} /></div>;
      })}
    </div>
  );
}
