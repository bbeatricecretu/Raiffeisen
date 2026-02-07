import { motion } from "motion/react";

interface ConnectionLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  animated?: boolean;
}

// Helper function to get point along cubic bezier curve
function getPointOnCubicBezier(t: number, p0: {x: number, y: number}, p1: {x: number, y: number}, p2: {x: number, y: number}, p3: {x: number, y: number}) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  };
}

export function ConnectionLine({ from, to, animated = false }: ConnectionLineProps) {
  // Calculate the path
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  
  // Control points for bezier curve
  const controlPoint1X = from.x + dx * 0.3;
  const controlPoint1Y = from.y;
  const controlPoint2X = from.x + dx * 0.7;
  const controlPoint2Y = to.y;

  const path = `M ${from.x} ${from.y} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${to.x} ${to.y}`;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    >
      {/* Shadow/glow effect */}
      <motion.path
        d={path}
        fill="none"
        stroke="url(#lineGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.6 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
      
      {/* Main line */}
      <motion.path
        d={path}
        fill="none"
        stroke="#6366f1"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />

      {/* Animated particle effect */}
      {animated && (
        <motion.circle
          r="4"
          fill="#6366f1"
          cx={from.x}
          cy={from.y}
          initial={{ opacity: 0 }}
          animate={{
            cx: [
              from.x,
              ...Array.from({ length: 20 }, (_, i) => {
                const t = (i + 1) / 20;
                return getPointOnCubicBezier(
                  t,
                  from,
                  { x: controlPoint1X, y: controlPoint1Y },
                  { x: controlPoint2X, y: controlPoint2Y },
                  to
                ).x;
              }),
            ],
            cy: [
              from.y,
              ...Array.from({ length: 20 }, (_, i) => {
                const t = (i + 1) / 20;
                return getPointOnCubicBezier(
                  t,
                  from,
                  { x: controlPoint1X, y: controlPoint1Y },
                  { x: controlPoint2X, y: controlPoint2Y },
                  to
                ).y;
              }),
            ],
            opacity: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      )}

      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#6366f1" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
        </linearGradient>
      </defs>
    </svg>
  );
}