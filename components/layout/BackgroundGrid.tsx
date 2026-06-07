/**
 * Fixed decorative grid behind all page content.
 * Styles live in globals.css (.background-grid) for performance.
 */
export function BackgroundGrid() {
  return (
    <div
      aria-hidden
      className="background-grid pointer-events-none fixed inset-0 z-0"
    />
  );
}
