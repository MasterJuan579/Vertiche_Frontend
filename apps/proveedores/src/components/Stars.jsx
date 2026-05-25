/**
 * 5-star rating display. Rounds to nearest integer for fill.
 * `size` is the star width/height in pixels.
 */
export function Stars({ rating, size = 14 }) {
  const filled = Math.round(rating);
  const starClip =
    'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={
            i <= filled
              ? 'bg-amber-400 dark:bg-amber-300'
              : 'bg-ink-100 dark:bg-ink-600'
          }
          style={{ width: size, height: size, clipPath: starClip }}
        />
      ))}
    </div>
  );
}
