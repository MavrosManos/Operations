import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyableText({
  value,
  className = "",
  mono = true,
}: {
  value: string;
  className?: string;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  if (!value) return <span className="text-slate-400">—</span>;
  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };
  return (
    <button
      onClick={doCopy}
      title="Copy"
      className={`inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 hover:bg-slate-200 active:bg-slate-300 transition ${
        mono ? "font-mono" : ""
      } ${className}`}
    >
      <span className="truncate">{value}</span>
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-slate-500 shrink-0" />
      )}
    </button>
  );
}

export default CopyableText;