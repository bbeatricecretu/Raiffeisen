import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { ProductSelector } from "./components/ProductSelector";
import { ScenarioMap } from "./components/ScenarioMap";
import { OnboardingOverlay } from "./components/OnboardingOverlay";

export default function App() {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  const handleSelectProduct = (product: string) => {
    setSelectedProduct(product);
    // Small delay for better UX
    setTimeout(() => {
      setShowMap(true);
    }, 300);
  };

  const handleBack = () => {
    setShowMap(false);
    setTimeout(() => {
      setSelectedProduct(null);
    }, 300);
  };

  const handleStartExploring = () => {
    setShowOnboarding(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingOverlay onStart={handleStartExploring} />
        )}
      </AnimatePresence>

      {!showMap ? (
        <div className="flex items-center justify-center min-h-screen p-6">
          <ProductSelector
            onSelectProduct={handleSelectProduct}
            selectedProduct={selectedProduct}
          />
        </div>
      ) : (
        selectedProduct && (
          <ScenarioMap product={selectedProduct} onBack={handleBack} />
        )
      )}
    </div>
  );
}