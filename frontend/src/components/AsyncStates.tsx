// Async UI states: loading spinner, error with retry, empty placeholder.

import type { ReactNode } from "react";

export function Loading() {
  return <div className="spinner" role="status" aria-label="Loading" />;
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  const message =
    error instanceof Error ? error.message : "Something went wrong";
  return (
    <div className="state error">
      <div>⚠ {message}</div>
      {onRetry && (
        <button className="retry" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="state">{children}</div>;
}
