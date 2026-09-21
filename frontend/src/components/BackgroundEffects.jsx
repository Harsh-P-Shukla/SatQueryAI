import { useMemo } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Satellite } from "lucide-react";

export function BackgroundEffects({ isDark }) {
  const { scrollY } = useScroll();
  const driftY = useTransform(scrollY, [0, 700], [0, 72]);

  const stars = useMemo(
    () =>
      Array.from({ length: 32 }, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        top: `${12 + ((i * 19) % 78)}%`,
        delay: `${(i % 11) * 0.24}s`,
        size: i % 8 === 0 ? 2 : 1,
      })),
    []
  );

  return (
    <div className="satquery-cosmos fixed inset-0 pointer-events-none overflow-hidden">
      <div className="satquery-deep-space" />
      <div className="satquery-aurora-ribbon satquery-aurora-ribbon-a" />
      <div className="satquery-aurora-ribbon satquery-aurora-ribbon-b" />
      <div className="satquery-tricolor-current" />

      <motion.div style={{ y: driftY }} className="satquery-orbit-system">
        <div className="satquery-orbit satquery-orbit-outer" />
        <div className="satquery-orbit satquery-orbit-inner" />
        <motion.div
          className="satquery-satellite"
          animate={{ rotate: [0, 2, -2, 0], y: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Satellite className={isDark ? "text-cyan-200" : "text-[#0b4f6c]"} />
        </motion.div>
      </motion.div>

      <div className="satquery-starfield">
        {stars.map((star, i) => (
          <span
            key={i}
            className="satquery-star"
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              animationDelay: star.delay,
            }}
          />
        ))}
      </div>

      <div className="satquery-bharat-marker">ISRO-ready public demo</div>
    </div>
  );
}
