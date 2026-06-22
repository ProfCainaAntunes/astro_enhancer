import { useState, useEffect, useCallback } from 'react';
import { enhanceImageApi } from '../services/api';

export interface ImageMetadata {
  width: number;
  height: number;
  size: string;
  name: string;
}

export function useImageEnhancer() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Clean up Object URLs to prevent memory leaks
  const cleanUpUrls = useCallback(() => {
    if (originalUrl) {
      URL.revokeObjectURL(originalUrl);
    }
    if (enhancedUrl) {
      URL.revokeObjectURL(enhancedUrl);
    }
  }, [originalUrl, enhancedUrl]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (enhancedUrl) URL.revokeObjectURL(enhancedUrl);
    };
  }, [originalUrl, enhancedUrl]);

  const selectImage = useCallback((file: File) => {
    // 1. Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Arquivo inválido. Por favor, selecione uma imagem (PNG, JPG, WEBP).');
      return;
    }

    // 2. Clear old state
    setError(null);
    setIsProcessing(false);
    
    // Revoke old object URLs before overriding
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (enhancedUrl) URL.revokeObjectURL(enhancedUrl);
    setEnhancedUrl(null);

    // 3. Create preview URL
    const url = URL.createObjectURL(file);
    setOriginalFile(file);
    setOriginalUrl(url);

    // 4. Extract dimensions using Image object
    const img = new Image();
    img.onload = () => {
      setMetadata({
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: formatFileSize(file.size),
        name: file.name
      });
    };
    img.onerror = () => {
      setError('Não foi possível ler as dimensões da imagem. Pode ser que o arquivo esteja corrompido.');
      setOriginalFile(null);
      setOriginalUrl(null);
      setMetadata(null);
    };
    img.src = url;
  }, [originalUrl, enhancedUrl]);

  const enhanceImage = useCallback(async () => {
    if (!originalFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      const enhancedBlob = await enhanceImageApi(originalFile);
      const url = URL.createObjectURL(enhancedBlob);
      setEnhancedUrl(url);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro desconhecido no processamento.');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [originalFile]);

  const reset = useCallback(() => {
    cleanUpUrls();
    setOriginalFile(null);
    setOriginalUrl(null);
    setEnhancedUrl(null);
    setMetadata(null);
    setError(null);
    setIsProcessing(false);
  }, [cleanUpUrls]);

  return {
    originalFile,
    originalUrl,
    enhancedUrl,
    metadata,
    isProcessing,
    error,
    selectImage,
    enhanceImage,
    reset,
  };
}
