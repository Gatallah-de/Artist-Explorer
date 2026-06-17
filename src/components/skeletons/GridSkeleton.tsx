"use client";

type Props = {
  rows?: number;
  cols?: number;
  /** Fixed cell height. If omitted, uses a responsive clamp. */
  height?: number;
  /** Extra className for the grid wrapper */
  className?: string;
};

export default function GridSkeleton({
  rows = 2,
  cols = 3,
  height,
  className = "",
}: Props) {
  const total = Math.max(0, rows) * Math.max(0, cols);
  const cells = Array.from({ length: total });

  const cellHeight =
    typeof height === "number" ? `${height}px` : "clamp(120px, 22vw, 180px)";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`grid gap-4 md:gap-6 ${className}`}
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      }}
    >
      {cells.map((_, i) => (
        <div
          key={i}
          className="skeleton-tile rounded-xl"
          style={{ height: cellHeight }}
        />
      ))}
    </div>
  );
}
