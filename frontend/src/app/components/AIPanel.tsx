import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertCircle, Sparkles, Info, ArrowRight } from "lucide-react";
import type { ScenarioNodeData } from "./ScenarioNode";

interface AIPanelProps {
  node: ScenarioNodeData | null;
  onExplore?: () => void;
}

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    label: "Completed Step",
  },
  recommendation: {
    icon: Sparkles,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    label: "AI Recommendation",
  },
  warning: {
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    label: "Important Notice",
  },
  upcoming: {
    icon: Info,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    label: "Upcoming Step",
  },
};

export function AIPanel({ node, onExplore }: AIPanelProps) {
  if (!node) {
    return (
      <aside className="w-[360px] bg-white border-l border-gray-200 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Guide</h3>
            <p className="text-sm text-gray-600">
              Click on any node to explore that step of your journey
            </p>
          </div>
        </div>
      </aside>
    );
  }

  const config = statusConfig[node.status];
  const Icon = config.icon;

  return (
    <aside className="w-[360px] bg-white border-l border-gray-200 flex flex-col">
      <AnimatePresence mode="wait">
        <motion.div
          key={node.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex-1 flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start gap-3 mb-4">
              <div className={`${config.bgColor} ${config.color} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className={`text-xs font-medium ${config.color} uppercase tracking-wider mb-1`}>
                  {config.label}
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {node.title}
                </h3>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <p className="text-gray-700 leading-relaxed mb-6">
              {node.description}
            </p>

            {/* Context based on status */}
            <div className="space-y-3">
              {node.status === "completed" && (
                <div className="flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 p-4 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>This step has been successfully completed. You're making great progress!</p>
                </div>
              )}

              {node.status === "recommendation" && (
                <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-4 rounded-xl">
                  <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>Our AI suggests this path based on your preferences and financial profile.</p>
                </div>
              )}

              {node.status === "warning" && (
                <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 p-4 rounded-xl">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>Please review this carefully. You might want to consider an alternative option.</p>
                </div>
              )}

              {node.status === "upcoming" && (
                <div className="flex items-start gap-2 text-sm text-gray-700 bg-gray-50 p-4 rounded-xl">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>This step is coming up next in your journey.</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-gray-200 space-y-3">
            <button
              onClick={onExplore}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Continue Exploring
              <ArrowRight className="w-4 h-4" />
            </button>
            <button className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors cursor-pointer">
              See Alternative Path
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </aside>
  );
}
