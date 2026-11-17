// limit/offset pagination control shared by list pages (FR-7).

interface Props {
  page: number; // 0-based
  pageSize: number;
  loadedCount: number; // items returned for the current page
  onPage: (page: number) => void;
}

export default function Pagination({ page, pageSize, loadedCount, onPage }: Props) {
  const hasPrev = page > 0;
  const hasNext = loadedCount === pageSize; // full page => more may exist

  return (
    <div className="pager">
      <button disabled={!hasPrev} onClick={() => onPage(page - 1)}>
        ← Prev
      </button>
      <span>Page {page + 1}</span>
      <button disabled={!hasNext} onClick={() => onPage(page + 1)}>
        Next →
      </button>
    </div>
  );
}
