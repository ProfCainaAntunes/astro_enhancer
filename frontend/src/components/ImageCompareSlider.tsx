import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Move, RotateCcw, Download, Sparkles } from 'lucide-react';

interface ImageCompareSliderProps {
  originalUrl: string;
  enhancedUrl: string;
  onDownload: () => void;
  onReset: () => void;
}

export const ImageCompareSlider: React.FC<ImageCompareSliderProps> = ({
  originalUrl,
  enhancedUrl,
  onDownload,
  onReset
}) => {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage (0 - 100)
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  
  // Zoom and Pan states
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const beforeImgRef = useRef<HTMLImageElement>(null);

  // Width/height state of container to align the clipped image correctly
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      });
    }
  }, []);

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDimensions, originalUrl, enhancedUrl]);

  // Handle separator dragging
  const handleSliderMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchStartSlider = (e: React.TouchEvent) => {
    setIsDraggingSlider(true);
    e.stopPropagation();
  };

  const handleMouseDownSlider = (e: React.MouseEvent) => {
    setIsDraggingSlider(true);
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle global move during drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSlider) {
        handleSliderMove(e.clientX);
      } else if (isPanning) {
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        setOffset({ x: dx, y: dy });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingSlider(false);
      setIsPanning(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingSlider && e.touches[0]) {
        handleSliderMove(e.touches[0].clientX);
      } else if (isPanning && e.touches[0]) {
        const dx = e.touches[0].clientX - panStart.x;
        const dy = e.touches[0].clientY - panStart.y;
        setOffset({ x: dx, y: dy });
      }
    };

    const handleTouchEnd = () => {
      setIsDraggingSlider(false);
      setIsPanning(false);
    };

    if (isDraggingSlider || isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDraggingSlider, isPanning, panStart, handleSliderMove]);

  // Handle Canvas panning
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsPanning(true);
    setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    e.preventDefault();
  };

  const handleTouchStartCanvas = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      setIsPanning(true);
      setPanStart({ x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y });
    }
  };

  // Zoom on wheel scroll
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const delta = -e.deltaY;
    const factor = delta > 0 ? (1 + zoomIntensity) : (1 - zoomIntensity);
    const newScale = Math.max(1, Math.min(scale * factor, 8));
    
    setScale(newScale);
    if (newScale === 1) {
      setOffset({ x: 0, y: 0 });
    }
  };

  const zoomIn = () => {
    setScale(prev => {
      const next = Math.min(prev + 0.5, 8);
      return next;
    });
  };

  const zoomOut = () => {
    setScale(prev => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setSliderPosition(50);
  };

  const imageTransformStyle: React.CSSProperties = {
    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
    transformOrigin: 'center',
    transition: isPanning ? 'none' : 'transform 0.15s ease-out',
  };

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <div className="flex flex-wrap items-center justify-between w-full max-w-4xl px-4 py-3 rounded-xl glass-panel border border-space-detail/40">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-space-accent animate-pulse-slow" />
          <span className="text-sm font-semibold text-gray-300">Compare Results</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={zoomOut}
            disabled={scale <= 1}
            className="p-2 rounded-lg bg-space-card hover:bg-space-detail border border-space-detail text-gray-300 hover:text-white transition-colors disabled:opacity-40"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <span className="text-xs font-mono bg-space-bg px-2.5 py-1.5 rounded border border-space-detail/50 text-space-accent">
            {scale.toFixed(1)}x
          </span>

          <button
            onClick={zoomIn}
            disabled={scale >= 8}
            className="p-2 rounded-lg bg-space-card hover:bg-space-detail border border-space-detail text-gray-300 hover:text-white transition-colors disabled:opacity-40"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-space-detail/60 mx-1" />

          <button
            onClick={resetView}
            className="p-2 rounded-lg bg-space-card hover:bg-space-detail border border-space-detail text-gray-300 hover:text-white transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDownCanvas}
        onTouchStart={handleTouchStartCanvas}
        className={`relative w-full max-w-4xl h-[550px] md:h-[600px] rounded-2xl glass-panel overflow-hidden border border-space-detail/60 select-none shadow-2xl ${
          isPanning ? 'cursor-grabbing' : scale > 1 ? 'cursor-grab' : 'cursor-default'
        }`}
      >
        {scale > 1 && (
          <div className="absolute top-4 left-4 bg-space-bg/85 border border-space-detail/50 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 z-10 pointer-events-none text-gray-300 animate-fade-in shadow-md">
            <Move className="w-3.5 h-3.5 text-space-accent" />
            Drag to pan around the image
          </div>
        )}

        <div className="absolute top-4 right-4 bg-space-accent/90 text-space-bg font-bold text-xs uppercase tracking-widest px-3 py-1 rounded shadow z-10 pointer-events-none">
          Enhanced
        </div>
        <div className="absolute top-4 left-4 bg-space-card/90 text-gray-300 font-bold text-xs uppercase tracking-widest px-3 py-1 rounded border border-space-detail/50 z-10 pointer-events-none" style={{ opacity: sliderPosition > 15 ? 1 : 0, transition: 'opacity 0.2s' }}>
          Original
        </div>

        <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden">
          
          <div className="w-full h-full flex items-center justify-center pointer-events-none select-none">
            <img
              src={enhancedUrl}
              alt="Enhanced Astrophotography"
              style={imageTransformStyle}
              className="max-w-full max-h-full object-contain pointer-events-none"
            />
          </div>

          <div
            className="absolute inset-y-0 left-0 h-full overflow-hidden pointer-events-none select-none"
            style={{ width: `${sliderPosition}%` }}
          >
            <div 
              style={{ width: dimensions.width, height: dimensions.height }}
              className="relative flex items-center justify-center pointer-events-none"
            >
              <img
                ref={beforeImgRef}
                src={originalUrl}
                alt="Original Astrophotography"
                style={{
                  ...imageTransformStyle,
                  width: 'auto',
                  height: 'auto',
                }}
                className="max-w-full max-h-full object-contain pointer-events-none"
              />
            </div>
          </div>

          <div
            className="absolute top-0 bottom-0 w-1 bg-space-accent/95 hover:bg-space-accent cursor-ew-resize z-20 group"
            style={{ left: `${sliderPosition}%` }}
            onMouseDown={handleMouseDownSlider}
            onTouchStart={handleTouchStartSlider}
          >
            <div className="absolute -left-3 top-0 bottom-0 w-7 cursor-ew-resize" />
            
            <div className="absolute inset-0 bg-space-accent shadow-[0_0_12px_#60a5fa] group-hover:scale-x-125 transition-transform" />

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-space-bg border-2 border-space-accent flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <div className="flex gap-0.5 text-space-accent select-none pointer-events-none">
                <span>◀</span>
                <span>▶</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-4xl px-4 mt-2">
        <button
          onClick={onReset}
          className="w-full sm:w-1/2 py-3.5 bg-space-card hover:bg-space-detail text-gray-300 hover:text-white font-semibold rounded-xl border border-space-detail transition-all duration-300 text-center"
        >
          Process Another Image
        </button>
        
        <button
          onClick={onDownload}
          className="w-full sm:w-1/2 py-3.5 bg-gradient-to-r from-space-accent to-blue-500 hover:from-blue-400 hover:to-space-accent text-space-bg font-bold rounded-xl shadow-[0_4px_15px_rgba(96,165,250,0.2)] hover:shadow-[0_4px_25px_rgba(96,165,250,0.4)] transition-all duration-300 flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          Download Enhanced Image
        </button>
      </div>
    </div>
  );
};
