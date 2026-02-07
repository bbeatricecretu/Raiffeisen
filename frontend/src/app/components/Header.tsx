import { Sparkles } from "lucide-react";

export function Header() {
  return (
    <header className="h-14 bg-white/80 backdrop-blur-sm border-b border-gray-200 flex items-center px-20">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm text-gray-600">Explore banking scenarios</span>
      </div>
    </header>
  );
}
