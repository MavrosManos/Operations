import { RefreshCw, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import MetricCard from "./MetricCard";

export interface HeaderProps {
  updatedAtAthens?: string;
  connected: boolean;
  countdown: number;
  onRefresh: () => void;
  loading: boolean;
  stale: boolean;
  issueCount: number;
  criticalCount: number;
  todayCount: number;
  agentCount: number;
  selfpCount: number;
}

export function Header(p: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b-4 border-slate-700 shadow-lg">
      <div className="px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3 mr-4">
          <div className="text-xl font-black tracking-tight">AUTOWAY LIVE OPS</div>
          <div className="text-xs text-slate-400 hidden sm:block">
            {p.updatedAtAthens ? `Updated ${p.updatedAtAthens}` : "No data yet"}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {p.connected ? (
            <span className="inline-flex items-center gap-1 bg-green-700 px-2 py-1 rounded">
              <Wifi className="h-3.5 w-3.5" /> LIVE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-red-700 px-2 py-1 rounded">
              <WifiOff className="h-3.5 w-3.5" /> OFFLINE
            </span>
          )}
          {p.stale && (
            <span className="inline-flex items-center gap-1 bg-yellow-500 text-slate-900 px-2 py-1 rounded font-semibold">
              <AlertTriangle className="h-3.5 w-3.5" /> STALE &gt;10m
            </span>
          )}
          <span className="text-slate-300 tabular-nums">next refresh in {p.countdown}s</span>
          <button
            onClick={p.onRefresh}
            disabled={p.loading}
            className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-3 py-1.5 rounded font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${p.loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="flex-1" />

        <div className="flex flex-wrap gap-2">
          <MetricCard label="Issues" value={p.issueCount} tone="slate" />
          <MetricCard label="Critical" value={p.criticalCount} tone="red" />
          <MetricCard label="Today" value={p.todayCount} tone="red" />
          <MetricCard label="Agent" value={p.agentCount} tone="red" />
          <MetricCard label="SelfP" value={p.selfpCount} tone="green" />
        </div>
      </div>
    </header>
  );
}
export default Header;