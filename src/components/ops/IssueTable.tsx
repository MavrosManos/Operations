import type { Issue } from "@/lib/ops/types";
import {
  extractDateText,
  extractPlate,
  extractReservationNo,
  getBucketTheme,
  getSeverityTheme,
  getUrgencyTheme,
  inferIssueBucket,
} from "@/lib/ops/helpers";
import CopyableText from "./CopyableText";
import StatusBadge from "./StatusBadge";

export function IssueTable({ issues }: { issues: Issue[] }) {
  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
      <table className="min-w-[900px] w-full text-sm">
        <thead className="bg-slate-800 text-white">
          <tr className="text-left">
            <th className="px-3 py-2">Urgency</th>
            <th className="px-3 py-2">Severity</th>
            <th className="px-3 py-2">Bucket</th>
            <th className="px-3 py-2">Reservation</th>
            <th className="px-3 py-2">Plate</th>
            <th className="px-3 py-2">Title</th>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((i, idx) => {
            const u = getUrgencyTheme(i.urgencyKey);
            const s = getSeverityTheme(i.severity);
            const b = getBucketTheme(inferIssueBucket(i));
            return (
              <tr key={i.id || idx} className={`border-t border-slate-200 ${idx % 2 ? "bg-slate-50" : ""}`}>
                <td className="px-3 py-2"><StatusBadge label={u.label} className={u.chip} /></td>
                <td className="px-3 py-2"><StatusBadge label={s.label} className={s.chip} /></td>
                <td className="px-3 py-2"><StatusBadge label={b.label} className={b.chip} /></td>
                <td className="px-3 py-2"><CopyableText value={extractReservationNo(i)} /></td>
                <td className="px-3 py-2"><CopyableText value={extractPlate(i)} /></td>
                <td className="px-3 py-2 text-slate-900">{i.issueTitle || i.issueKey}</td>
                <td className="px-3 py-2 font-mono text-slate-700 whitespace-nowrap">{extractDateText(i)}</td>
                <td className="px-3 py-2 font-mono text-xs text-slate-600">{i.raw?.recommendation?.actionCode || ""}</td>
              </tr>
            );
          })}
          {issues.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center text-slate-500 py-8">No issues match the current filters.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
export default IssueTable;