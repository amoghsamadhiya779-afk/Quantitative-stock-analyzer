import { motion } from "framer-motion";

interface Props {
  height?: number | string;
  className?: string;
  titleWidth?: string;
}

export default function SkeletonCard({ height = 300, className = "", titleWidth = "w-1/3" }: Props) {
  return (
    <div
      className={`p-5 ventriloc-card flex flex-col justify-between overflow-hidden relative ${className}`}
      style={{ height }}
    >
      <div className="space-y-4 w-full z-10">
        <motion.div
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className={`h-3 bg-[var(--color-chalk)] rounded-full ${titleWidth}`}
        />
        <motion.div
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          className="h-[1px] w-full bg-[var(--border)]"
        />
      </div>
      
      <div className="w-full h-full flex items-end pt-8 z-10">
        <motion.div
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          className="w-full h-full bg-[var(--color-fog)] rounded-lg"
        />
      </div>
      
      {/* Shimmer sweep effect */}
      <motion.div
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.5 }}
        className="absolute inset-0 z-20"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
          transform: "skewX(-20deg)"
        }}
      />
    </div>
  );
}
