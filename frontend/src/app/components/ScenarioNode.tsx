import { motion } from "motion/react";
import { CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

export type NodeStatus = "completed" | "recommendation" | "warning" | "upcoming";

export interface ScenarioNodeData {
  id: string;
  title: string;
  description: string;
  status: NodeStatus;
  x: number;
  y: number;
}

interface ScenarioNodeProps {
  node: ScenarioNodeData;
  isActive: boolean;
  onClick: () => void;
}

const statusConfig = {
  completed: {
    color: "bg-emerald-500",
    shadowColor: "shadow-emerald-500/30",
    icon: CheckCircle2,
    borderColor: "border-emerald-500",
  },
  recommendation: {
    color: "bg-amber-400",
    shadowColor: "shadow-amber-400/30",
    icon: Sparkles,
    borderColor: "border-amber-400",
  },
  warning: {
    color: "bg-red-500",
    shadowColor: "shadow-red-500/30",
    icon: AlertCircle,
    borderColor: "border-red-500",
  },
  upcoming: {
    color: "bg-gray-300",
    shadowColor: "shadow-gray-300/20",
    icon: null,
    borderColor: "border-gray-300",
  },
};

export function ScenarioNode({ node, isActive, onClick }: ScenarioNodeProps) {
  const config = statusConfig[node.status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: node.id === "start" ? 0 : 0.2,
      }}
      style={{
        position: "absolute",
        left: `${node.x}%`,
        top: `${node.y}%`,
        transform: "translate(-50%, -50%)",
      }}
      className="z-10 group"
    >
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.1, y: -4 }}
        whileTap={{ scale: 0.95 }}
        className="relative cursor-pointer"
      >
        {/* Pulse animation for active nodes */}
        {isActive && (
          <motion.div
            className={`absolute inset-0 rounded-3xl ${config.color} opacity-40`}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 0, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        {/* Main node card */}
        <div
          className={`w-24 h-24 rounded-2xl ${config.color} shadow-lg ${config.shadowColor} flex flex-col items-center justify-center relative p-2 border-2 ${config.borderColor} group-hover:shadow-xl transition-shadow`}
        >
          {Icon && (
            <div className="mb-1">
              <Icon className="w-6 h-6 text-white" />
            </div>
          )}
          {!Icon && (
            <div className="w-3 h-3 rounded-full bg-white/50 mb-1" />
          )}
          
          {/* Node text */}
          <div className="text-xs font-semibold text-white text-center leading-tight">
            {node.title}
          </div>
        </div>

        {/* Tooltip on hover */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">
            Click to explore
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
}