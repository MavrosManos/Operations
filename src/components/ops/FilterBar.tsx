import { Search } from "lucide-react";

export interface Filters {
  q: string;
  bucket: "ALL" | "AGENT" | "SELFP" | "INFO";
  urgency: "ALL" | "TODAY" | "TOMORROW" | "DAY2" | "STANDARD";
  severity: "ALL" | "CRITICAL" | "WARNING" | "INFO";
}

export function FilterBar({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) =>
    onChange({ ...filters, [k]: v });
  const sel =
    "bg-white border border-slate-300 rounded px-2 py-1.5 text-sm font-semibold text-slate-800";
  return (
    <div className="flex flex-wrap items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg p-3">
      <div className="relative">
        <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={filters.q}
          onChange={(e) => set("q", e.target.value)}
          placeholder="Search reservation or plate…"
          className="pl-8 pr-3 py-1.5 rounded border border-slate-300 bg-white text-sm w-64 text-slate-800"
        />
      </div>
      <select className={sel} value={filters.bucket} onChange={(e) => set("bucket", e.target.value as any)}>
        <option value="ALL">All buckets</option>
        <option value="AGENT">Agent</option>
        <option value="SELFP">SelfP</option>
        <option value="INFO">Info</option>
      </select>
      <select className={sel} value={filters.urgency} onChange={(e) => set("urgency", e.target.value as any)}>
        <option value="ALL">All urgency</option>
        <option value="TODAY">Today</option>
        <option value="TOMORROW">Tomorrow</option>
        <option value="DAY2">Day+2</option>
        <option value="STANDARD">Later</option>
      </select>
      <select className={sel} value={filters.severity} onChange={(e) => set("severity", e.target.value as any)}>
        <option value="ALL">All severity</option>
        <option value="CRITICAL">Critical</option>
        <option value="WARNING">Warning</option>
        <option value="INFO">Info</option>
      </select>
    </div>
  );
}
export default FilterBar;