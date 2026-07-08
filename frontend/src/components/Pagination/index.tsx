interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

function getPageList(page: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, 2, totalPages - 1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("ellipsis");
    result.push(p);
    prev = p;
  }
  return result;
}

export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;
  const pages = getPageList(page, totalPages);

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        aria-label="Previous page"
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-canvas disabled:opacity-30"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`e-${i}`} className="px-1 text-sm text-muted">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold transition-colors ${
              p === page ? "bg-primary text-white" : "text-muted hover:bg-canvas"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        aria-label="Next page"
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-canvas disabled:opacity-30"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
