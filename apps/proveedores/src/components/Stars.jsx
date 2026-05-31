/**
 * 5-star rating display. Rounds to nearest integer for fill.
 * When `interactive` is true, the user can click to select a rating.
 * `size` is the star width/height in pixels.
 */
import { useMemo, useState } from 'react';

export function Stars({ rating, size = 14, interactive = false, onChange }) {
  const [hoverValue, setHoverValue] = useState(null);
  const filled = Math.round(rating || 0);
  const displayed = hoverValue !== null ? hoverValue : filled;

  const starClip = useMemo(
    () =>
      'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
    []
  );

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filledStar = i <= displayed;
        const baseClass = filledStar
          ? 'bg-amber-400 dark:bg-amber-300'
          : 'bg-ink-100 dark:bg-ink-600';
        const interactiveClass = interactive
          ? 'cursor-pointer hover:bg-amber-300 dark:hover:bg-amber-200'
          : '';

        return (
          <div
            key={i}
            className={`${baseClass} ${interactiveClass}`}
            style={{ width: size, height: size, clipPath: starClip }}
            onMouseEnter={interactive ? () => setHoverValue(i) : undefined}
            onMouseLeave={interactive ? () => setHoverValue(null) : undefined}
            onClick={interactive ? () => onChange?.(i) : undefined}
          />
        );
      })}
    </div>
  );
}
