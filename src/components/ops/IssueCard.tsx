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

export function IssueCard({ issue }: { issue: Issue }) {
  const urgency = getUrgencyTheme(issue.urgencyKey);
  const severity = getSeverityTheme(issue.severity);
  const bucket = getBucketTheme(inferIssueBucket(issue));
  const plate = extractPlate(issue);
  const resNo = extractReservationNo(issue);
  const date = extractDateText(issue);
  const rec = issue.raw?.recommendation;

  return (
    <div className={`bg-white rounded-lg border-l-4 ${urgency.border} border border-slate-200 shadow-sm p-4`}>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <StatusBadge label={urgency.label} className={urgency.chip} />
        <StatusBadge label={severity.label} className={severity.chip} />
        <StatusBadge label={bucket.label} className={bucket.chip} />
        <div className="flex-1" />
        {date && <span className="text-xs text-slate-500 font-mono">{date}</span>}
      </div>

      <div className="text-base font-bold text-slate-900 mb-2">
        {issue.issueTitle || issue.issueKey || "Issue"}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
        <div className="text-sm">
          <span className="text-[11px] uppercase text-slate-500 block">Reservation</span>
          <CopyableText value={resNo} className="text-slate-900 font-semibold" />
        </div>
        <div className="text-sm">
          <span className="text-[11px] uppercase text-slate-500 block">Plate</span>
          <CopyableText value={plate} className="text-slate-900 font-semibold" />
        </div>
      </div>

      {issue.raw?.driverName && (
        <div className="text-sm text-slate-700 mb-1">
          <span className="text-slate-500">Driver: </span>
          {issue.raw.driverName}
        </div>
      )}
      {issue.raw?.problem && (
        <div className="text-sm text-slate-800 mt-2 bg-slate-50 rounded p-2 border border-slate-200">
          {issue.raw.problem}
        </div>
      )}
      {rec && (rec.title || rec.actionCode) && (
        <div className="text-sm mt-2 bg-blue-50 border border-blue-200 rounded p-2">
          <div className="font-semibold text-blue-900">{rec.title || "Recommendation"}</div>
          {rec.actionCode && (
            <div className="text-xs text-blue-800 mt-0.5 font-mono">{rec.actionCode}</div>
          )}
          {rec.why && <div className="text-xs text-blue-800 mt-1">{rec.why}</div>}
        </div>
      )}
    </div>
  );
}
export default IssueCard;