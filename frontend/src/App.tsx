import React from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';
import { useImageEnhancer } from './hooks/useImageEnhancer';
import { UploadZone } from './components/UploadZone';
import { ImageCompareSlider } from './components/ImageCompareSlider';

function App() {
  const {
    originalUrl,
    enhancedUrl,
    metadata,
    isProcessing,
    error,
    selectImage,
    enhanceImage,
    reset
  } = useImageEnhancer();

  const handleDownload = () => {
    if (!enhancedUrl || !metadata) return;
    
    const link = document.createElement('a');
    link.href = enhancedUrl;
    
    const dotIndex = metadata.name.lastIndexOf('.');
    const nameWithoutExt = dotIndex !== -1 ? metadata.name.substring(0, dotIndex) : metadata.name;
    const ext = dotIndex !== -1 ? metadata.name.substring(dotIndex) : '.png';
    link.download = `${nameWithoutExt}_enhanced${ext}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative min-h-screen bg-space-bg flex flex-col justify-between overflow-hidden">
      
      <div className="absolute inset-0 starfield z-0" />
      <div className="nebula-glow top-[-200px] left-[-200px]" />
      <div className="nebula-purple bottom-[-200px] right-[-200px]" />

      <header className="relative z-10 w-full max-w-4xl mx-auto px-6 pt-10 pb-6 text-center select-none">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-space-secondary border border-space-detail/50 mb-4 shadow-sm">
          <Sparkles className="w-4 h-4 text-space-accent animate-pulse-slow" />
          <span className="text-xs font-semibold text-gray-300 tracking-wide uppercase">AI-Powered Restoration</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-gray-200 to-space-accent bg-clip-text text-transparent tracking-tight mb-3">
          Night Vision AI
        </h1>
        <h2 className="text-md md:text-lg font-medium text-gray-400 max-w-xl mx-auto leading-relaxed">
          Deep Learning Image Enhancement for Astrophotography
        </h2>
        <p className="text-xs text-gray-500 mt-2 max-w-md mx-auto">
          Improve low-light captures and reduce structural noise in deep space images in real-time.
        </p>
      </header>

      <main className="relative z-10 flex-grow flex items-center justify-center px-6 py-6 w-full max-w-5xl mx-auto">
        <div className="w-full">
          
          {error && (
            <div className="max-w-2xl mx-auto mb-6 p-4 rounded-xl border border-red-500/30 bg-red-950/20 text-red-200 flex items-start gap-3 shadow-lg animate-fade-in">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-grow">
                <h5 className="font-semibold text-sm">Operation Failed</h5>
                <p className="text-xs text-red-300/90 mt-1">{error}</p>
              </div>
            </div>
          )}

          {isProcessing ? (
            <div className="max-w-md mx-auto glass-panel rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-2xl border border-space-detail/50 min-h-[300px] animate-pulse-slow">
              <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-dashed border-space-accent/40 animate-[spin_8s_linear_infinite]" />
                <div className="absolute w-12 h-12 rounded-full border-2 border-transparent border-t-space-accent animate-[spin_1.5s_linear_infinite]" />
                <div className="w-4 h-4 rounded-full bg-space-accent shadow-[0_0_15px_#60a5fa] animate-ping" />
              </div>

              <h3 className="text-xl font-semibold text-gray-100 mb-2">Enhancing Image...</h3>
              <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                Processing image patches using U-Net. Large images may require a few moments.
              </p>
            </div>
          ) : enhancedUrl ? (
            <div className="animate-fade-in">
              <ImageCompareSlider
                originalUrl={originalUrl!}
                enhancedUrl={enhancedUrl}
                onDownload={handleDownload}
                onReset={reset}
              />
            </div>
          ) : (
            <div className="animate-fade-in">
              <UploadZone
                onFileSelect={selectImage}
                originalUrl={originalUrl}
                metadata={metadata}
                onEnhance={enhanceImage}
                onClear={reset}
                isProcessing={isProcessing}
              />
            </div>
          )}

        </div>
      </main>

      <footer className="relative z-10 w-full text-center py-8 border-t border-space-detail/20 bg-space-bg/50">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>
            <span>Master's Dissertation Demonstration</span>
            <span className="mx-2">•</span>
            <span className="font-semibold text-gray-400">UNESP</span>
          </div>
          <div>
            <span>Developed with clean architecture & TensorFlow</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
