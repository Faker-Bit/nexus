"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function CodeBlock({ code, className }: { code: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className={cn("group relative overflow-hidden rounded-xl border border-white/8 bg-ink-950/70", className)}>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }}
        aria-label="Copy code"
        className="absolute right-2 top-2 z-10 rounded-md p-1.5 text-mist-500 opacity-0 transition-all hover:bg-white/8 hover:text-mist-100 group-hover:opacity-100"
      >
        {copied ? <Check className="size-3.5 text-mint" /> : <Copy className="size-3.5" />}
      </button>
      <pre className="overflow-x-auto p-4 text-[12px] leading-relaxed text-mist-200">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}