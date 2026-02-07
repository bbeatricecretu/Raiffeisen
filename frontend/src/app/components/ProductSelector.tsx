import { motion } from "motion/react";
import { CreditCard, Wallet, HandCoins } from "lucide-react";

interface ProductSelectorProps {
  onSelectProduct: (product: string) => void;
  selectedProduct: string | null;
}

const products = [
  {
    id: "current-account",
    name: "Current Account",
    icon: Wallet,
    description: "Manage your day-to-day spending",
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "premium-card",
    name: "Premium Card",
    icon: CreditCard,
    description: "Exclusive benefits and rewards",
    color: "from-purple-500 to-purple-600",
  },
  {
    id: "simple-loan",
    name: "Simple Loan",
    icon: HandCoins,
    description: "Quick and easy borrowing",
    color: "from-emerald-500 to-emerald-600",
  },
];

export function ProductSelector({ onSelectProduct, selectedProduct }: ProductSelectorProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          AI Scenario Explorer
        </h1>
        <p className="text-lg text-gray-600">
          Choose a banking product to explore your personalized journey
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product, index) => {
          const Icon = product.icon;
          const isSelected = selectedProduct === product.id;

          return (
            <motion.button
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectProduct(product.id)}
              className={`relative p-6 rounded-2xl border-2 transition-all ${
                isSelected
                  ? "border-blue-500 shadow-lg shadow-blue-500/20"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div
                className={`w-16 h-16 rounded-xl bg-gradient-to-br ${product.color} flex items-center justify-center mb-4 mx-auto`}
              >
                <Icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
              <p className="text-sm text-gray-600">{product.description}</p>

              {isSelected && (
                <motion.div
                  layoutId="selected-indicator"
                  className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
