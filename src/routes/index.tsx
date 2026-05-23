import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, LayoutGrid, List, Database } from "lucide-react";
import { API_BASE_URL, DEMO_DATA, fetchLive, LIVE_URL } from "@/lib/ops/api";
import type { Issue, LiveResponse } from "@/lib/ops/types";
import {
  countBy,
  inferIssueBucket,
  isStale,
  sortIssues,
  extractPlate,
  extractReservationNo,
  getUrgencyTheme,
} from "@/lib/ops/helpers";
import Header from "@/components/ops/Header";
import FilterBar, { type Filters } from "@/components/ops/FilterBar";
import IssueCard from "@/components/ops/IssueCard";
import IssueTable from "@/components/ops/IssueTable";
import DecisionMatrix from "@/components/ops/DecisionMatrix";
import KeyboxMatrix from "@/components/ops/KeyboxMatrix";
import StationChangeMatrix from "@/components/ops/StationChangeMatrix";
import DebugPanel from "@/components/ops/DebugPanel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AUTOWAY Live Ops" },
      { name: "description", content: "AUTOWAY live operations dashboard for Crete fleet." },
    ],
  }),
  component: Index,
});

const REFRESH_SECONDS = 20;

type View = "list" | "matrix";

function Index() {
  const [data, setData] = useState<LiveResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [countdown, setCountdown] = useState(REFRESH_SECONDS);
  const [view, setView] = useState<View>("matrix");
  const [filters, setFilters] = useState<Filters>({
    q: "",
    bucket: "ALL",
    urgency: "ALL",
    severity: "ALL",
  });
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);
    try {
      const json = await fetchLive(ac.signal);
      setData(json);
      setConnected(true);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setError(e?.message || "Failed to load");
      setConnected(false);
    } finally {
      setLoading(false);
      setCountdown(REFRESH_SECONDS);
    }
  }, []);

  useEffect(() => {
    if (!API_BASE_URL) {
      setError("VITE_API_BASE_URL is not set.");
      return;
    }
    load();
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          load();
          return REFRESH_SECONDS;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [load]);

  const issues: Issue[] = useMemo(() => data?.issues ?? [], [data]);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const out = issues.filter((i) => {
      if (filters.bucket !== "ALL" && inferIssueBucket(i) !== filters.bucket) return false;
      if (filters.urgency !== "ALL" && (i.urgencyKey || "STANDARD") !== filters.urgency) return false;
      if (filters.severity !== "ALL" && (i.severity || "INFO") !== filters.severity) return false;
      if (q) {
        const hay = `${extractReservationNo(i)} ${extractPlate(i)}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    return sortIssues(out);
  }, [issues, filters]);

  const criticalCount = countBy(issues, (i) => i.severity === "CRITICAL");
  const todayCount = countBy(issues, (i) => i.urgencyKey === "TODAY");
  const agentCount = countBy(issues, (i) => inferIssueBucket(i) === "AGENT");
  const selfpCount = countBy(issues, (i) => inferIssueBucket(i) === "SELFP");
  const stale = isStale(data?.updatedAt);

  const loadDemo = () => {
    setData({
      ...DEMO_DATA,
      updatedAt: new Date().toISOString(),
      updatedAtAthens: new Date().toLocaleString("en-GB", { timeZone: "Europe/Athens" }),
    });
    setError(null);
    setConnected(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Header
        updatedAtAthens={data?.updatedAtAthens}
        connected={connected}
        countdown={countdown}
        onRefresh={load}
        loading={loading}
        stale={stale}
        issueCount={data?.issueCount ?? issues.length}
        criticalCount={criticalCount}
        todayCount={todayCount}
        agentCount={agentCount}
        selfpCount={selfpCount}
      />

      <main className="max-w-[1400px] mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-900 rounded-lg p-4">
            <div className="flex items-center gap-2 font-bold text-base">
              <AlertCircle className="h-5 w-5" /> Could not load live ops data
            </div>
            <div className="text-sm mt-1">{error}</div>
            <div className="text-xs mt-2 font-mono break-all bg-white border border-red-200 rounded p-2">
              {LIVE_URL || "(no API URL configured)"}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={load}
                className="bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded font-semibold text-sm"
              >
                Retry
              </button>
              <button
                onClick={loadDemo}
                className="inline-flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded font-semibold text-sm"
              >
                <Database className="h-4 w-4" /> Load demo data
              </button>
            </div>
          </div>
        )}

        {!data && !error && (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
            <div className="text-lg font-bold text-slate-800">No live matrix yet</div>
            <div className="text-sm text-slate-500 mt-1">
              Waiting for Apps Script to publish the first successful AlertBrain snapshot.
            </div>
            {loading && <div className="mt-3 text-xs text-slate-400">Loading…</div>}
          </div>
        )}

        {data && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg overflow-hidden border border-slate-300 bg-white">
                <button
                  onClick={() => setView("matrix")}
                  className={`px-3 py-1.5 text-sm font-semibold inline-flex items-center gap-1 ${
                    view === "matrix" ? "bg-slate-900 text-white" : "text-slate-700"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" /> Matrix
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`px-3 py-1.5 text-sm font-semibold inline-flex items-center gap-1 ${
                    view === "list" ? "bg-slate-900 text-white" : "text-slate-700"
                  }`}
                >
                  <List className="h-4 w-4" /> List
                </button>
              </div>
              <div className="flex-1" />
              <FilterBar filters={filters} onChange={setFilters} />
            </div>

            {view === "list" ? (
              <>
                <section>
                  <h2 className="text-lg font-black tracking-wide text-slate-800 mb-2">ISSUES</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
                    {filtered.map((i, idx) => (
                      <IssueCard key={i.id || idx} issue={i} />
                    ))}
                    {filtered.length === 0 && (
                      <div className="text-slate-500 text-sm p-4">No issues match the current filters.</div>
                    )}
                  </div>
                  <IssueTable issues={filtered} />
                </section>
              </>
            ) : (
              <>
                <section>
                  <h2 className="text-lg font-black tracking-wide text-slate-800 mb-2">DECISION MATRICES</h2>
                  <DecisionMatrix issues={filtered} />
                </section>
                <section>
                  <KeyboxMatrix issues={filtered} />
                </section>
                <section>
                  <StationChangeMatrix matrix={data.digestMeta?.stationChangeMatrix} />
                </section>
              </>
            )}

            <DebugPanel data={data} />
            <div className="text-[11px] text-slate-400 text-center pb-6">
              API: <span className="font-mono">{LIVE_URL || "(unset)"}</span> · urgency legend:{" "}
              <span className={`px-1.5 rounded ${getUrgencyTheme("TODAY").chip}`}>TODAY</span>{" "}
              <span className={`px-1.5 rounded ${getUrgencyTheme("TOMORROW").chip}`}>TOMORROW</span>{" "}
              <span className={`px-1.5 rounded ${getUrgencyTheme("DAY2").chip}`}>DAY+2</span>{" "}
              <span className={`px-1.5 rounded ${getUrgencyTheme("STANDARD").chip}`}>LATER</span>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
