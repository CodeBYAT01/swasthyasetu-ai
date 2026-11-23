export function Table({ headers, children, className = '' }) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/70">
            {headers.map((header) => (
              <th key={header} className="whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, totalPages, onChange, total }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
      <p className="text-xs text-slate-500">Showing page {page} of {totalPages} · {total} records</p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-40">Previous</button>
        <span className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700">{page}</span>
        <button type="button" onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}
