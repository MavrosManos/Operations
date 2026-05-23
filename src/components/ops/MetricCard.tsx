export function MetricCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: number | string;
  tone?: "slate" | "red" | "orange" | "green" | "blue";
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-800 text-white border-slate-700",
    red: "bg-red-700 text-white border-red-600",
    orange: "bg-orange-600 text-white border-orange-500",
    green: "bg-green-700 text-white border-green-600",
    blue: "bg-blue-700 text-white border-blue-600",
  };
  return (
    <div className={`rounded-lg border px-4 py-3 min-w-[110px] ${tones[tone]}`}>
      <div className="text-[11px] uppercase tracking-wider opacity-80 font-semibold">{label}</div>
      <div className="text-2xl font-bold tabular-nums leading-tight mt-0.5">{value}</div>
    </div>
  );
}
export default MetricCard;