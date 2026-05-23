export function StatusBadge({ label, className = "" }: { label: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${className}`}
    >
      {label}
    </span>
  );
}
export default StatusBadge;