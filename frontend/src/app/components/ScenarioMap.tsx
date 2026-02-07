import { useState } from "react";
import { motion } from "motion/react";
import { ScenarioNode, type ScenarioNodeData } from "./ScenarioNode";
import { ConnectionLine } from "./ConnectionLine";
import { AIPanel } from "./AIPanel";
import { FooterControls } from "./FooterControls";
import { ArrowLeft } from "lucide-react";

interface ScenarioMapProps {
  product: string;
  onBack: () => void;
}

// Scenario data for different products
const scenarios: Record<string, { nodes: ScenarioNodeData[]; connections: Array<[string, string]> }> = {
  "current-account": {
    nodes: [
      {
        id: "start",
        title: "Getting Started",
        description: "Welcome to your current account journey! We'll guide you through a simple process to set up your account and start managing your money with ease. No complicated forms, just clear steps.",
        status: "completed",
        x: 15,
        y: 50,
      },
      {
        id: "verify",
        title: "Verify Identity",
        description: "Quick identity verification using your phone. Snap a photo of your ID and take a selfie. Our AI handles the rest securely and instantly, making sure you're protected.",
        status: "completed",
        x: 35,
        y: 30,
      },
      {
        id: "customize",
        title: "Customize Account",
        description: "Make your account truly yours. Choose your preferences for notifications, spending categories, and security settings. Our AI learns from your choices to provide better insights.",
        status: "recommendation",
        x: 55,
        y: 20,
      },
      {
        id: "fund",
        title: "Add Funds",
        description: "Transfer money from another account or set up your salary deposit. Multiple easy options available. Start with as little as you like.",
        status: "upcoming",
        x: 70,
        y: 35,
      },
      {
        id: "debit-card",
        title: "Get Debit Card",
        description: "Receive your personalized debit card with contactless payments. Track every transaction in real-time through the app. Instant notifications for peace of mind.",
        status: "recommendation",
        x: 55,
        y: 60,
      },
      {
        id: "alerts",
        title: "Set Up Alerts",
        description: "Stay informed about your money. Get smart notifications for unusual activity, low balances, or upcoming bills. Customize what matters to you.",
        status: "upcoming",
        x: 75,
        y: 70,
      },
      {
        id: "complete",
        title: "All Set!",
        description: "Your current account is ready to use! Start exploring budgeting tools, automatic savings, and personalized insights powered by AI to help you reach your financial goals.",
        status: "upcoming",
        x: 90,
        y: 50,
      },
    ],
    connections: [
      ["start", "verify"],
      ["verify", "customize"],
      ["customize", "fund"],
      ["verify", "debit-card"],
      ["debit-card", "alerts"],
      ["fund", "complete"],
      ["alerts", "complete"],
    ],
  },
  "premium-card": {
    nodes: [
      {
        id: "start",
        title: "Premium Journey",
        description: "Start your premium card experience! Discover exclusive benefits, rewards, and privileges designed for your lifestyle. We'll make sure you get the most value from every feature.",
        status: "completed",
        x: 15,
        y: 50,
      },
      {
        id: "eligibility",
        title: "Check Eligibility",
        description: "Our AI instantly reviews your profile to confirm you qualify for premium benefits. This takes just seconds and happens automatically in the background.",
        status: "completed",
        x: 30,
        y: 30,
      },
      {
        id: "benefits",
        title: "Choose Benefits",
        description: "Select from travel insurance, airport lounge access, cashback rewards, and concierge service. Pick what matches your lifestyle. Our AI recommends the best combination for you.",
        status: "recommendation",
        x: 50,
        y: 20,
      },
      {
        id: "rewards",
        title: "Rewards Program",
        description: "Earn points on every purchase. Get bonus points on travel, dining, and entertainment. Redeem for flights, hotels, or exclusive experiences. AI tracks the best redemption options.",
        status: "recommendation",
        x: 70,
        y: 30,
      },
      {
        id: "insurance",
        title: "Travel Insurance",
        description: "Comprehensive coverage for your trips worldwide. Medical expenses, trip cancellation, lost luggage - all included automatically when you book with your card.",
        status: "upcoming",
        x: 50,
        y: 50,
      },
      {
        id: "spending-limit",
        title: "Set Spending Limit",
        description: "Based on your income and spending patterns, we suggest an appropriate limit. You can adjust it anytime. Our AI monitors unusual spending and alerts you proactively.",
        status: "warning",
        x: 30,
        y: 70,
      },
      {
        id: "concierge",
        title: "Concierge Access",
        description: "Premium support available anytime. Restaurant reservations, event tickets, travel planning - your personal assistant is just a message away.",
        status: "upcoming",
        x: 70,
        y: 65,
      },
      {
        id: "complete",
        title: "Enjoy Premium",
        description: "Your premium card is activated! Start using exclusive benefits immediately. Track rewards, manage perks, and maximize value with AI-powered insights in your dashboard.",
        status: "upcoming",
        x: 88,
        y: 50,
      },
    ],
    connections: [
      ["start", "eligibility"],
      ["eligibility", "benefits"],
      ["benefits", "rewards"],
      ["eligibility", "spending-limit"],
      ["benefits", "insurance"],
      ["spending-limit", "concierge"],
      ["rewards", "complete"],
      ["insurance", "complete"],
      ["concierge", "complete"],
    ],
  },
  "simple-loan": {
    nodes: [
      {
        id: "start",
        title: "Loan Request",
        description: "Start your loan application with a simple conversation. Tell us what you need the money for and how much you're looking to borrow. No complex forms to fill out.",
        status: "completed",
        x: 15,
        y: 50,
      },
      {
        id: "assessment",
        title: "AI Assessment",
        description: "Our AI analyzes your financial situation in seconds. Income, expenses, credit history - all reviewed instantly to find the best loan option for you with transparent terms.",
        status: "completed",
        x: 30,
        y: 30,
      },
      {
        id: "offer",
        title: "Loan Offer",
        description: "Receive a personalized loan offer with clear terms. No hidden fees, no surprises. See exactly what you'll pay each month and the total cost in simple language.",
        status: "recommendation",
        x: 50,
        y: 20,
      },
      {
        id: "alternative",
        title: "Consider Saving",
        description: "Based on your goal, our AI noticed you could save up the amount in a few months. This might save you interest costs. Would you like to see a savings plan instead?",
        status: "warning",
        x: 50,
        y: 50,
      },
      {
        id: "terms",
        title: "Review Terms",
        description: "Understand your repayment schedule, interest rate, and total cost. Our AI explains everything in plain English. Ask questions anytime - we're here to help you make informed decisions.",
        status: "upcoming",
        x: 70,
        y: 25,
      },
      {
        id: "insurance",
        title: "Payment Protection",
        description: "Optional coverage if you lose your job or face unexpected hardship. Not required, but provides peace of mind. Our AI helps you decide if it's worth it for your situation.",
        status: "upcoming",
        x: 70,
        y: 45,
      },
      {
        id: "repayment",
        title: "Set Up Repayment",
        description: "Choose your payment date and method. We'll send reminders before each payment. Set up automatic payments to never miss a due date and build your credit score.",
        status: "upcoming",
        x: 50,
        y: 75,
      },
      {
        id: "approval",
        title: "Funds Released",
        description: "Money deposited directly to your account, usually within hours. Track your loan, make extra payments, or adjust your plan anytime through the app.",
        status: "upcoming",
        x: 85,
        y: 50,
      },
    ],
    connections: [
      ["start", "assessment"],
      ["assessment", "offer"],
      ["assessment", "alternative"],
      ["offer", "terms"],
      ["alternative", "repayment"],
      ["terms", "insurance"],
      ["insurance", "approval"],
      ["repayment", "approval"],
    ],
  },
};

export function ScenarioMap({ product, onBack }: ScenarioMapProps) {
  const [selectedNode, setSelectedNode] = useState<ScenarioNodeData | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string>("start");
  const [zoom, setZoom] = useState<number>(1);

  const scenario = scenarios[product];

  const handleNodeClick = (node: ScenarioNodeData) => {
    setSelectedNode(node);
    setActiveNodeId(node.id);
  };

  const handleReset = () => {
    setActiveNodeId("start");
    setSelectedNode(null);
    setZoom(1);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 0.6));
  };

  // Calculate visible nodes (active node + 2 levels ahead + all previous nodes)
  const getVisibleNodeIds = () => {
    const visibleIds = new Set<string>([activeNodeId]);
    
    // Forward traversal: 2 levels ahead
    const forwardQueue: Array<{ id: string; level: number }> = [{ id: activeNodeId, level: 0 }];
    const forwardVisited = new Set<string>([activeNodeId]);

    while (forwardQueue.length > 0) {
      const current = forwardQueue.shift()!;
      
      if (current.level >= 2) continue;

      // Find all connections from current node
      scenario.connections.forEach(([fromId, toId]) => {
        if (fromId === current.id && !forwardVisited.has(toId)) {
          forwardVisited.add(toId);
          visibleIds.add(toId);
          forwardQueue.push({ id: toId, level: current.level + 1 });
        }
      });
    }

    // Backward traversal: all previous nodes
    const backwardQueue: string[] = [activeNodeId];
    const backwardVisited = new Set<string>([activeNodeId]);

    while (backwardQueue.length > 0) {
      const current = backwardQueue.shift()!;

      // Find all connections leading to current node
      scenario.connections.forEach(([fromId, toId]) => {
        if (toId === current && !backwardVisited.has(fromId)) {
          backwardVisited.add(fromId);
          visibleIds.add(fromId);
          backwardQueue.push(fromId);
        }
      });
    }

    return visibleIds;
  };

  const visibleNodeIds = getVisibleNodeIds();
  const visibleNodes = scenario.nodes.filter((node) => visibleNodeIds.has(node.id));
  const visibleConnections = scenario.connections.filter(
    ([fromId, toId]) => visibleNodeIds.has(fromId) && visibleNodeIds.has(toId)
  );

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="h-14 bg-white/80 backdrop-blur-sm border-b border-gray-200 flex items-center px-20 justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Products</span>
        </button>
        <div className="text-sm text-gray-600">
          {product === "current-account" && "Current Account Journey"}
          {product === "premium-card" && "Premium Card Experience"}
          {product === "simple-loan" && "Loan Application Process"}
        </div>
      </div>

      {/* Main content - two column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Journey Canvas - 70% */}
        <div className="flex-1 relative">
          {/* Legend */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200 z-20"
          >
            <div className="text-xs font-semibold text-gray-700 mb-3">Legend</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-500" />
                <span className="text-xs text-gray-700">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-amber-400" />
                <span className="text-xs text-gray-700">AI Recommendation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500" />
                <span className="text-xs text-gray-700">Review Needed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-300" />
                <span className="text-xs text-gray-700">Upcoming</span>
              </div>
            </div>
          </motion.div>

          {/* Scenario Map */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full relative overflow-hidden"
            style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
          >
            {/* Connection Lines */}
            <svg className="absolute inset-0 w-full h-full">
              {visibleConnections.map(([fromId, toId]) => {
                const fromNode = scenario.nodes.find((n) => n.id === fromId);
                const toNode = scenario.nodes.find((n) => n.id === toId);

                if (!fromNode || !toNode) return null;

                // Convert percentages to absolute positions
                const container = document.querySelector(".w-full.h-full.relative.overflow-hidden");
                if (!container) return null;

                const rect = container.getBoundingClientRect();
                const fromX = (fromNode.x / 100) * rect.width;
                const fromY = (fromNode.y / 100) * rect.height;
                const toX = (toNode.x / 100) * rect.width;
                const toY = (toNode.y / 100) * rect.height;

                return (
                  <ConnectionLine
                    key={`${fromId}-${toId}`}
                    from={{ x: fromX, y: fromY }}
                    to={{ x: toX, y: toY }}
                    animated={fromId === activeNodeId || toId === activeNodeId}
                  />
                );
              })}
            </svg>

            {/* Nodes */}
            {visibleNodes.map((node) => (
              <ScenarioNode
                key={node.id}
                node={node}
                isActive={node.id === activeNodeId}
                onClick={() => handleNodeClick(node)}
              />
            ))}
          </motion.div>
        </div>

        {/* AI Panel - 30% sidebar */}
        <AIPanel node={selectedNode} />
      </div>

      {/* Footer Controls */}
      <FooterControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        zoom={zoom}
      />
    </div>
  );
}