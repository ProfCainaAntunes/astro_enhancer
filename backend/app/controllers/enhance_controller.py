import logging
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, UploadFile, File, HTTPException, Response, status
# pyrefly: ignore [missing-import]
from fastapi.concurrency import run_in_threadpool
from app.services.enhancer_service import EnhancerService
from app.utils.image_processing import bytes_to_image, image_to_bytes

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")

@router.post("/enhance")
async def enhance_image(file: UploadFile = File(...)):
    """Receives an image via multipart/form-data, enhances it using a U-Net model,

    and returns the enhanced image as image/png.
    """
    # 1. Validate file presence
    if not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nenhum arquivo enviado. Por favor, selecione uma imagem."
        )

    # 2. Validate MIME type
    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        logger.warning(f"Rejected file with invalid content type: {content_type}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Arquivo inválido. O arquivo enviado deve ser uma imagem (PNG, JPEG, etc.)."
        )

    try:
        # 3. Read image bytes
        image_bytes = await file.read()
        
        # Validate that bytes are not empty
        if not image_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O arquivo enviado está vazio."
            )

        # 4. Decode image (runs CPU bounds, but simple enough to do inline or offloaded)
        try:
            img_array = bytes_to_image(image_bytes)
        except Exception as img_err:
            logger.error(f"Failed to parse image bytes: {img_err}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A imagem enviada está corrompida ou em formato não suportado."
            )

        # 5. Run U-Net sliding window inference offloaded to a thread pool
        # This prevents the FastAPI single-threaded event loop from blocking during TensorFlow execution
        try:
            enhanced_img_array = await run_in_threadpool(EnhancerService.enhance_image, img_array)
        except Exception as model_err:
            logger.error(f"Error during model processing: {model_err}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Ocorreu um erro interno ao processar a imagem com a U-Net."
            )

        # 6. Convert enhanced image back to PNG bytes
        try:
            enhanced_bytes = image_to_bytes(enhanced_img_array)
        except Exception as conv_err:
            logger.error(f"Failed to encode output image: {conv_err}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao codificar a imagem resultante."
            )

        # 7. Return image response
        return Response(content=enhanced_bytes, media_type="image/png")

    except HTTPException as http_exc:
        # Re-raise HTTP exceptions to let FastAPI handle them
        raise http_exc
    except Exception as e:
        logger.error(f"Unexpected system error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro inesperado no servidor. Por favor, tente novamente mais tarde."
        )
