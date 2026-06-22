/**
 * Service to handle API requests to the FastAPI backend.
 */

/**
 * Sends an image file to the backend for U-Net enhancement.
 * Handles decoding binary blobs and extracting structured JSON error messages in case of failure.
 * 
 * @param file The original image file to enhance.
 * @returns A promise resolving to the enhanced image Blob.
 */
export async function enhanceImageApi(file: File): Promise<Blob> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/enhance', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'Ocorreu um erro no processamento da imagem.';
      try {
        // Try parsing JSON error details returned by FastAPI
        const errorText = await response.text();
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorJson.error || errorMessage;
      } catch {
        // Fallback if parsing fails or response wasn't JSON
        if (response.status === 413) {
          errorMessage = 'A imagem é muito grande para ser processada por este servidor.';
        } else if (response.status === 504 || response.status === 502 || response.status === 503) {
          errorMessage = 'O processamento expirou (Timeout) ou o servidor está sobrecarregado. Imagens de altíssima resolução requerem mais tempo de processamento.';
        }
      }
      throw new Error(errorMessage);
    }

    return await response.blob();
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Não foi possível conectar ao servidor de processamento.');
  }
}
