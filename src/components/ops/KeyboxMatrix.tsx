import type { Issue } from "@/lib/ops/types";
import { buildKeyboxGroups, extractDateText, extractPlate, extractReservationNo } from "@/lib/ops/helpers";
import CopyableText from "./CopyableText";

export function KeyboxMatrix({ issues }: { issues: Issue[] }) {
  const groups = buildKeyboxGroups(issues);
  if (groups.length === 0) return null;
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="bg-green-800 text-white px-4 py-3">
        <div className="text-lg font-bold">KEYBOX MATRIX</div>
        <div className="text-xs opacity-80">SelfP reservations grouped by assigned keybox</div>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((g) => (
          <div key={g.keybox} className="border border-slate-200 rounded">
            <div className="bg-slate-800 text-white px-3 py-2 font-mono font-bold text-sm">
              {g.keybox} <span className="opacity-70">({g.issues.length})</span>
            </div>
            <div className="p-3 space-y-2 bg-slate-50">
              {g.issues.map((i, idx) => (
                <div key={i.id || idx} className="bg-white border border-slate-200 rounded p-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[11px] font-bold text-slate-400">#{idx + 1}</span>
                    <CopyableText value={extractReservationNo(i)} className="text-slate-900 font-bold" />
                  </div>
                  <div className="text-xs text-slate-700 mt-1">
                    Plate: <CopyableText value={extractPlate(i)} className="text-slate-900" />
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-1">{extractDateText(i)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default KeyboxMatrix;