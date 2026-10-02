import type { ReactNode } from "react";

/**
 * Minimal, safe Markdown renderer.
 *
 * The listing description is creator-supplied text, so it is rendered with an
 * explicit allow-list instead of `dangerouslySetInnerHTML` on raw HTML. Links
 * are forced to `rel="noreferrer noopener"`; only http(s) and mailto survive.
 */

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[]; ordered: boolean }
  | { type: "code"; lang: string; text: string }
  | { type: "quote"; text: string }
  | { type: "rule" };

function parseInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|_[^_]+_|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-i${index++}`;

    if (token.startsWith("**")) nodes.push(<strong key={key} className="font-semibold text-mist-50">{token.slice(2, -2)}</strong>);
    else if (token.startsWith("_")) nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    else if (token.startsWith("`")) {
      nodes.push(
        <code key={key} className="rounded-md border border-white/10 bg-white/6 px-1.5 py-0.5 font-mono text-[12px] text-neon-200">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("[")) {
      const linkMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(token);
      const label = linkMatch?.[1] ?? token;
      const href = linkMatch?.[2] ?? "#";
      nodes.push(
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noreferrer noopener nofollow"
          className="text-neon-200 underline decoration-neon-400/40 underline-offset-2 transition-colors hover:text-neon-100"
        >
          {label}
        </a>,
      );
    } else {
      nodes.push(token.replace(/^\*|\*$/g, ""));
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const buffer: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) buffer.push(lines[i++]);
      i++;
      blocks.push({ type: "code", lang, text: buffer.join("\n") });
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
      i++;
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      blocks.push({ type: "rule" });
      i++;
      continue;
    }

    if (line.trimStart().startsWith(">")) {
      const buffer: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith(">")) {
        buffer.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      blocks.push({ type: "quote", text: buffer.join(" ") });
      continue;
    }

    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    const ordered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (bullet || ordered) {
      const isOrdered = Boolean(ordered);
      const items: string[] = [];
      while (i < lines.length) {
        const b = /^\s*[-*]\s+(.*)$/.exec(lines[i]);
        const o = /^\s*\d+[.)]\s+(.*)$/.exec(lines[i]);
        if (isOrdered && o) items.push(o[1]);
        else if (!isOrdered && b) items.push(b[1]);
        else break;
        i++;
      }
      blocks.push({ type: "list", items, ordered: isOrdered });
      continue;
    }

    const buffer: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|```|\s*[-*]\s|\s*\d+[.)]\s|>)/.test(lines[i])) {
      buffer.push(lines[i]);
      i++;
    }
    blocks.push({ type: "paragraph", text: buffer.join(" ") });
  }

  return blocks;
}

export function Markdown({ content, compact }: { content: string; compact?: boolean }) {
  const blocks = parseBlocks(content);

  return (
    <div className={compact ? "mt-2 space-y-3" : "space-y-4"}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading": {
            const sizes: Record<number, string> = {
              1: "text-xl",
              2: "text-[17px]",
              3: "text-[15px]",
              4: "text-[14px]",
              5: "text-[13.5px]",
              6: "text-[13px]",
            };
            return (
              <h3 key={i} className={`${sizes[block.level] ?? sizes[4]} mt-6 font-semibold text-mist-50 first:mt-0`}>
                {block.text}
              </h3>
            );
          }
          case "paragraph":
            return (
              <p key={i} className="text-[14px] leading-[1.75] text-mist-300">
                {parseInline(block.text, `p${i}`)}
              </p>
            );
          case "list": {
            const List = block.ordered ? "ol" : "ul";
            return (
              <List key={i} className={`space-y-2 pl-1 ${block.ordered ? "list-decimal" : "list-none"}`}>
                {block.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-[14px] leading-[1.7] text-mist-300">
                    {!block.ordered ? (
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-neon-400/80 shadow-[0_0_8px] shadow-neon-400/60" />
                    ) : null}
                    <span>{parseInline(item, `li${i}-${j}`)}</span>
                  </li>
                ))}
              </List>
            );
          }
          case "code":
            return (
              <pre key={i} className="overflow-x-auto rounded-xl border border-white/8 bg-ink-900/80 p-4">
                <code className="font-mono text-[12.5px] leading-relaxed text-mist-200">{block.text}</code>
              </pre>
            );
          case "quote":
            return (
              <blockquote key={i} className="border-l-2 border-neon-400/50 pl-4 text-[14px] italic leading-relaxed text-mist-400">
                {parseInline(block.text, `q${i}`)}
              </blockquote>
            );
          case "rule":
            return <hr key={i} className="border-white/8" />;
          default:
            return null;
        }
      })}
    </div>
  );
}