import React from 'react';

/**
 * SolvingOrb — a pure-CSS recreation of the "solving" state
 * from the thinking-orbs library. Uses animated dots arranged
 * in a circle that pulse and rotate, creating a swirling orb effect.
 */
const SolvingOrb = ({ size = 18 }) => {
  const dotCount = 8;
  const radius = size * 0.35;
  const dotSize = size * 0.12;
  const center = size / 2;

  return (
    <div
      className="solving-orb-container"
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ animation: 'solving-orb-spin 3s linear infinite' }}
      >
        {Array.from({ length: dotCount }).map((_, i) => {
          const angle = (i / dotCount) * 2 * Math.PI - Math.PI / 2;
          const cx = center + radius * Math.cos(angle);
          const cy = center + radius * Math.sin(angle);
          const delay = (i / dotCount) * 1.2;
          const baseOpacity = 0.3 + (i / dotCount) * 0.7;

          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={dotSize}
              fill="currentColor"
              opacity={baseOpacity}
              style={{
                animation: `solving-orb-dot 1.2s ease-in-out ${delay}s infinite`,
                transformOrigin: `${center}px ${center}px`,
              }}
            />
          );
        })}
      </svg>

      <style>{`
        @keyframes solving-orb-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes solving-orb-dot {
          0%, 100% {
            opacity: 0.2;
            r: ${dotSize * 0.7};
          }
          50% {
            opacity: 1;
            r: ${dotSize * 1.3};
          }
        }
      `}</style>
    </div>
  );
};

export default SolvingOrb;
