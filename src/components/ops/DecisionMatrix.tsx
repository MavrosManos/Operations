import type { Issue } from "@/lib/ops/types";
import { buildDecisionMatrices, extractDateText, extractPlate, extractReservationNo } from "@/lib/ops/helpers";
import CopyableText from "./CopyableText";

function MiniCard({ idx, issue }: { idx: number; issue: Issue }) {
  return (
    <div className="bg-white border border-slate-200 rounded p-3 shadow-sm">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-[11px] font-bold text-slate-400">#{idx + 1}</span>
        <CopyableText value={extractReservationNo(issue)} className="text-slate-900 font-bold text-sm" />
      </div>
      <div className="text-xs text-slate-700">
        Plate: <CopyableText value={extractPlate(issue)} className="text-slate-900" />
      </div>
      <div className="text-xs text-slate-500 font-mono mt-1">{extractDateText(issue)}</div>
    </div>
  );
}

function Column({ title, tone, items }: { title: string; tone: string; items: Issue[] }) {
  return (
    <div className="flex-1 min-w-0">
      <div className={`px-3 py-2 font-bold text-sm rounded-t ${tone}`}>
        {title} <span className="opacity-80">({items.length})</span>
      </div>
      <div className="bg-slate-50 border border-t-0 border-slate-200 rounded-b p-3 space-y-2 min-h-[80px]">
        {items.length === 0 ? (
          <div className="text-slate-400 text-sm font-semibold text-center py-4">NONE</div>
        ) : (
          items.map((i, idx) => <MiniCard key={i.id || idx} idx={idx} issue={i} />)
        )}
      </div>
    </div>
  );
}

export function DecisionMatrix({ issues }: { issues: Issue[] }) {
  const groups = buildDecisionMatrices(issues);
  if (groups.length === 0) {
    return <div className="text-slate-500 text-sm p-4">No matrices to display.</div>;
  }
  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.key} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white px-4 py-3">
            <div className="text-xs opacity-70 font-mono">{g.key}</div>
            <div className="text-lg font-bold">{g.title}</div>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Column title="AGENT" tone="bg-red-700 text-white" items={g.agent} />
            <Column title="SELFP" tone="bg-green-700 text-white" items={g.selfp} />
          </div>
        </div>
      ))}
    </div>
  );
}
export default DecisionMatrix;