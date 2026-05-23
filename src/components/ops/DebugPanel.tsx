import { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import type { LiveResponse } from "@/lib/ops/types";

export function DebugPanel({ data }: { data: LiveResponse | null }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(data || {}, null, 2);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };
  return (
    <div className="bg-slate-900 text-slate-100 rounded-lg border border-slate-700 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-slate-800 transition text-left"
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <span className="font-bold">DEBUG / RAW JSON</span>
        <span className="text-xs text-slate-400 ml-2 font-mono truncate">
          snapshot={data?.snapshotId || "—"} · run={data?.runId || "—"} · batch={data?.batchId || "—"}
        </span>
      </button>
      {open && (
        <div className="border-t border-slate-700">
          <div className="flex justify-end p-2 bg-slate-800">
            <button
              onClick={copy}
              className="inline-flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-xs px-2 py-1 rounded"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
              Copy JSON
            </button>
          </div>
          <pre className="overflow-auto max-h-[480px] text-xs p-4 font-mono leading-relaxed">{json}</pre>
        </div>
      )}
    </div>
  );
}
export default DebugPanel;