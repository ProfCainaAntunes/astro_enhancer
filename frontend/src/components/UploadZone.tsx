import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Sparkles, X } from 'lucide-react';
import { ImageMetadata } from '../hooks/useImageEnhancer';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  originalUrl: string | null;
  metadata: ImageMetadata | null;
  onEnhance: () => void;
  onClear: () => void;
  isProcessing: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFileSelect,
  originalUrl,
  metadata,
  onEnhance,
  onClear,
  isProcessing
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!originalUrl ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
          className={`relative group cursor-pointer rounded-2xl border-2 border-dashed p-10 transition-all duration-300 glass-panel text-center flex flex-col items-center justify-center min-h-[300px] ${
            isDragActive
              ? 'border-space-accent bg-space-accent/15 shadow-[0_0_20px_rgba(96,165,250,0.3)]'
              : 'border-space-detail hover:border-space-accent hover:bg-space-secondary/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleChange}
          />
          
          <div className="absolute inset-0 bg-radial-gradient from-space-accent/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

          <div className="relative p-4 bg-space-secondary rounded-full border border-space-detail mb-4 group-hover:border-space-accent group-hover:text-space-accent transition-colors duration-300">
            <Upload className="w-8 h-8 text-gray-400 group-hover:text-space-accent transition-colors" />
          </div>

          <h3 className="text-xl font-medium mb-2 text-gray-200">
            Drag & drop your astrophotography image here
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            Supports PNG, JPEG, TIFF up to any resolution
          </p>

          <button
            type="button"
            className="px-6 py-2.5 bg-space-detail/50 hover:bg-space-accent text-gray-200 hover:text-space-bg font-semibold rounded-lg border border-space-detail hover:border-space-accent transition-all duration-300 hover:shadow-[0_0_15px_rgba(96,165,250,0.4)]"
          >
            Select Image
          </button>
        </div>
      ) : (
        <div className="rounded-2xl glass-panel p-6 overflow-hidden flex flex-col md:flex-row gap-6 relative">
          <button
            onClick={onClear}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-space-secondary border border-space-detail hover:border-red-500/50 text-gray-400 hover:text-red-400 transition-colors z-10"
            title="Descartar Imagem"
            disabled={isProcessing}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-full md:w-1/2 flex items-center justify-center bg-space-bg/50 rounded-xl border border-space-detail/40 p-2 overflow-hidden aspect-video relative group">
            <img
              src={originalUrl}
              alt="Original Preview"
              className="max-w-full max-h-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>

          <div className="w-full md:w-1/2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon className="w-5 h-5 text-space-accent" />
                <span className="text-sm uppercase tracking-wider text-space-accent font-semibold">Image Loaded</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-100 truncate mb-4" title={metadata?.name}>
                {metadata?.name || 'Loading details...'}
              </h4>

              {metadata && (
                <div className="grid grid-cols-2 gap-4 border-t border-b border-space-detail/30 py-4 mb-6">
                  <div>
                    <span className="block text-xs text-gray-400 uppercase">Resolution</span>
                    <span className="text-md font-medium text-gray-200">
                      {metadata.width} x {metadata.height}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400 uppercase">File Size</span>
                    <span className="text-md font-medium text-gray-200">{metadata.size}</span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onEnhance}
              disabled={isProcessing}
              className="w-full py-3.5 bg-gradient-to-r from-space-accent to-blue-500 hover:from-blue-400 hover:to-space-accent text-space-bg font-bold rounded-xl shadow-[0_4px_20px_rgba(96,165,250,0.25)] hover:shadow-[0_4px_30px_rgba(96,165,250,0.5)] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5" />
              Enhance Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
