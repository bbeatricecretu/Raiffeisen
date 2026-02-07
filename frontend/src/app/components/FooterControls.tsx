import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface FooterControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  zoom: number;
}

export function FooterControls({ onZoomIn, onZoomOut, onReset, zoom }: FooterControlsProps) {
  return (
    <footer className="h-16 bg-white/60 backdrop-blur-sm border-t border-gray-200 flex items-center justify-end px-20 gap-3">
      <div className="flex items-center gap-2 opacity-75 hover:opacity-100 transition-opacity">
        <button
          onClick={onZoomOut}
          className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5 text-gray-700" />
        </button>
        <span className="text-sm text-gray-600 min-w-[60px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={onZoomIn}
          className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5 text-gray-700" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 h-10 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          title="Reset Scenario"
        >
          <RotateCcw className="w-4 h-4 text-gray-700" />
          <span className="text-sm text-gray-700">Reset</span>
        </button>
      </div>
    </footer>
  );
}
