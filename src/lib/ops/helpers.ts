import type { Bucket, Issue, LiveResponse, Severity, StationChangeMatrix, Urgency } from "./types";

export function getUrgencyTheme(u?: string) {
  switch (u) {
    case "TODAY":
      return { label: "TODAY", chip: "bg-red-600 text-white", border: "border-red-500", rank: 0 };
    case "TOMORROW":
      return { label: "TOMORROW", chip: "bg-orange-500 text-white", border: "border-orange-400", rank: 1 };
    case "DAY2":
      return { label: "DAY+2", chip: "bg-yellow-400 text-slate-900", border: "border-yellow-300", rank: 2 };
    default:
      return { label: "LATER", chip: "bg-blue-600 text-white", border: "border-blue-500", rank: 3 };
  }
}

export function getSeverityTheme(s?: string) {
  switch (s) {
    case "CRITICAL":
      return { label: "CRITICAL", chip: "bg-red-600 text-white" };
    case "WARNING":
      return { label: "WARNING", chip: "bg-orange-500 text-white" };
    default:
      return { label: "INFO", chip: "bg-blue-600 text-white" };
  }
}

export function getBucketTheme(b?: string) {
  switch (b) {
    case "AGENT":
      return { label: "AGENT", chip: "bg-red-100 text-red-800 border border-red-300", band: "bg-red-700 text-white" };
    case "SELFP":
      return { label: "SELFP", chip: "bg-green-100 text-green-800 border border-green-300", band: "bg-green-700 text-white" };
    default:
      return { label: "INFO", chip: "bg-slate-100 text-slate-800 border border-slate-300", band: "bg-slate-700 text-white" };
  }
}

export function inferIssueBucket(issue: Issue): Bucket {
  if (issue.bucket) return issue.bucket;
  const key = (issue.issueKey || "").toUpperCase();
  if (key.includes("AGENT")) return "AGENT";
  if (key.includes("SELFP") || key.includes("SELF_P")) return "SELFP";
  return "INFO";
}

export function extractPlate(issue: Issue): string {
  return (
    issue.raw?.assignedCar ||
    (issue.raw as any)?.plate ||
    (issue.raw as any)?.vehiclePlate ||
    ""
  );
}

export function extractReservationNo(issue: Issue): string {
  return issue.resNo || (issue.raw as any)?.resNo || "";
}

export function extractDateText(issue: Issue): string {
  return issue.raw?.formattedDate || (issue.raw as any)?.pickupText || "";
}

export function sortIssues(issues: Issue[]): Issue[] {
  return [...issues].sort((a, b) => {
    const ra = getUrgencyTheme(a.urgencyKey).rank;
    const rb = getUrgencyTheme(b.urgencyKey).rank;
    if (ra !== rb) return ra - rb;
    const da = extractDateText(a);
    const db = extractDateText(b);
    return da.localeCompare(db);
  });
}

export interface MatrixGroup {
  key: string;
  title: string;
  agent: Issue[];
  selfp: Issue[];
  info: Issue[];
}

export function buildDecisionMatrices(issues: Issue[]): MatrixGroup[] {
  const map = new Map<string, MatrixGroup>();
  for (const i of issues) {
    const key = i.issueKey || i.issueTitle || "UNCATEGORIZED";
    if (!map.has(key)) {
      map.set(key, {
        key,
        title: i.issueTitle || key,
        agent: [],
        selfp: [],
        info: [],
      });
    }
    const g = map.get(key)!;
    const b = inferIssueBucket(i);
    if (b === "AGENT") g.agent.push(i);
    else if (b === "SELFP") g.selfp.push(i);
    else g.info.push(i);
  }
  return Array.from(map.values());
}

export interface KeyboxGroup {
  keybox: string;
  issues: Issue[];
}

export function isKeyboxIssue(i: Issue): boolean {
  const rec = i.raw?.recommendation;
  if (!rec) return false;
  const ac = (rec.actionCode || "").toUpperCase();
  if (ac.includes("KEYBOX") || ac.includes("KEYB")) return true;
  const d = rec.data || {};
  return !!(d.primaryKeybox || d.primary || d.currentKeybox || d.available);
}

export function buildKeyboxGroups(issues: Issue[]): KeyboxGroup[] {
  const selfp = issues.filter((i) => inferIssueBucket(i) === "SELFP" && isKeyboxIssue(i));
  const map = new Map<string, Issue[]>();
  for (const i of selfp) {
    const d = i.raw?.recommendation?.data || {};
    const kb =
      d.primaryKeybox ||
      d.primary ||
      d.currentKeybox ||
      (Array.isArray(d.available) && d.available.length ? null : null);
    const key = kb || "MANUAL CHECK";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(i);
  }
  return Array.from(map.entries()).map(([keybox, issues]) => ({ keybox, issues }));
}

export interface StationCell {
  plate: string;
  resNo: string;
  pickup: string;
}

export interface BuiltStationMatrix {
  stations: string[];
  cells: Record<string, Record<string, StationCell[]>>; // from -> to -> cells
}

export function buildStationMatrix(m?: StationChangeMatrix): BuiltStationMatrix {
  const stationSet = new Set<string>();
  if (m?.stations) Object.keys(m.stations).forEach((s) => stationSet.add(s));
  const routes = m?.routes || {};
  for (const k of Object.keys(routes)) {
    const [from, to] = k.split("->");
    if (from) stationSet.add(from.trim());
    if (to) stationSet.add(to.trim());
  }
  const stations = Array.from(stationSet).sort();
  const cells: Record<string, Record<string, StationCell[]>> = {};
  for (const f of stations) {
    cells[f] = {};
    for (const t of stations) cells[f][t] = [];
  }
  for (const [k, route] of Object.entries(routes)) {
    const [from, to] = k.split("->").map((x) => x.trim());
    if (!from || !to || !cells[from] || !cells[from][to]) continue;
    const plates = route?.plates || {};
    for (const p of Object.values(plates)) {
      cells[from][to].push({
        plate: p.plate || p.vehiclePlate || "",
        resNo: p.resNo || p.nextResNo || p.reference || p.irn || "",
        pickup: p.pickupText || p.formattedDate || "",
      });
    }
  }
  return { stations, cells };
}

export function isStale(updatedAt?: string, thresholdMs = 10 * 60 * 1000): boolean {
  if (!updatedAt) return false;
  const t = Date.parse(updatedAt);
  if (Number.isNaN(t)) return false;
  return Date.now() - t > thresholdMs;
}

export function countBy(issues: Issue[], pred: (i: Issue) => boolean): number {
  return issues.reduce((a, i) => a + (pred(i) ? 1 : 0), 0);
}

export const _types = {} as { Bucket: Bucket; Severity: Severity; Urgency: Urgency; Live: LiveResponse };