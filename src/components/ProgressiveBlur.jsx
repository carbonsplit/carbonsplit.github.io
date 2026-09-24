/*
 * Progressive (variable-strength) blur pinned to a viewport edge.
 * Stacked backdrop-blur layers, each masked to its own band, so content
 * softens gradually as it scrolls under the edge instead of hitting a hard line.
 */
const LAYERS = [0.5, 1, 2, 4, 8, 16]; // px, weakest → strongest (toward the edge)

export default function ProgressiveBlur({ position = 'bottom', height = 96, offset = 0, className = '' }) {
  const toEdge = position === 'bottom' ? 'to bottom' : 'to top';
  const step = 100 / (LAYERS.length + 1);

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-x-0 z-40 ${className}`}
      style={{ [position]: offset, height }}
    >
      {LAYERS.map((blur, i) => {
        const a = i * step;
        const b = (i + 1) * step;
        const c = (i + 2) * step;
        const d = (i + 3) * step;
        const mask = `linear-gradient(${toEdge}, transparent ${a}%, #000 ${b}%, #000 ${c}%, transparent ${d}%)`;
        return (
          <div
            key={blur}
            className="absolute inset-0"
            style={{
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        );
      })}
    </div>
  );
}
