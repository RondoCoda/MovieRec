// Half-star rating control. Values: 0.5, 1.0, ..., 5.0 (matches the DB CHECK).
// Interactive mode: click left half of a star = x.5, right half = x.0.

import { useState } from "react";

interface Props {
  value: number | null;
  onChange?: (value: number) => void;
  readonly?: boolean;
}

export default function StarRating({ value, onChange, readonly }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;

  if (readonly) {
    return (
      <span className="stars readonly" aria-label={`${value ?? 0} of 5 stars`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={shown >= i - 0.5 ? "star filled" : "star"}>
            ★{shown >= i - 0.5 && shown < i ? <span className="half">★</span> : null}
          </span>
        ))}
        {value !== null && <span className="rating-value">{value.toFixed(1)}</span>}
      </span>
    );
  }

  return (
    <span
      className="stars"
      role="radiogroup"
      aria-label="Rate this movie"
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const full = shown >= i;
        const half = !full && shown >= i - 0.5;
        return (
          <span
            key={i}
            className={full || half ? "star filled" : "star"}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setHover(e.clientX - rect.left < rect.width / 2 ? i - 0.5 : i);
            }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const v = e.clientX - rect.left < rect.width / 2 ? i - 0.5 : i;
              onChange?.(v);
            }}
          >
            ★{half ? <span className="half">★</span> : null}
          </span>
        );
      })}
      <span className="rating-value">
        {(hover ?? value ?? 0).toFixed(1)}
      </span>
    </span>
  );
}
