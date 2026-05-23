import { buildStationMatrix } from "@/lib/ops/helpers";
import type { StationChangeMatrix as SCM } from "@/lib/ops/types";
import CopyableText from "./CopyableText";

export function StationChangeMatrix({ matrix }: { matrix?: SCM }) {
  const { stations, cells } = buildStationMatrix(matrix);
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="bg-slate-900 text-white px-4 py-3">
        <div className="text-lg font-bold">STATION CHANGE MATRIX</div>
        <div className="text-xs opacity-80">Vehicle movements between stations</div>
      </div>
      {stations.length === 0 ? (
        <div className="p-6 text-slate-500 text-sm">No station change data.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="border-collapse min-w-full">
            <thead>
              <tr>
                <th className="bg-slate-800 text-white text-xs uppercase px-3 py-2 border border-slate-700 sticky left-0 z-10">
                  FROM \ TO
                </th>
                {stations.map((s) => (
                  <th key={s} className="bg-slate-800 text-white text-xs uppercase px-3 py-2 border border-slate-700 whitespace-nowrap">
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stations.map((from) => (
                <tr key={from}>
                  <th className="bg-slate-800 text-white text-xs uppercase px-3 py-2 border border-slate-700 sticky left-0 z-10 text-left">
                    {from}
                  </th>
                  {stations.map((to) => {
                    const list = cells[from]?.[to] || [];
                    const same = from === to;
                    return (
                      <td
                        key={to}
                        className={`border border-slate-300 align-top px-2 py-2 min-w-[180px] ${
                          same ? "bg-slate-100 text-slate-400 text-center" : "bg-white"
                        }`}
                      >
                        {same ? (
                          "—"
                        ) : list.length === 0 ? (
                          <span className="text-slate-400">0</span>
                        ) : (
                          <div className="space-y-2">
                            {list.map((c, i) => (
                              <div key={i} className="border-l-2 border-blue-500 pl-2">
                                <div className="font-mono font-bold text-slate-900 text-sm">
                                  <CopyableText value={c.plate} className="text-slate-900" />
                                </div>
                                <div className="text-xs text-slate-600 font-mono">
                                  <CopyableText value={c.resNo} className="text-slate-600" />
                                </div>
                                {c.pickup && (
                                  <div className="text-[11px] text-slate-500 font-mono">{c.pickup}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
export default StationChangeMatrix;