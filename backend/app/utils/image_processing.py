import io
from PIL import Image
import numpy as np
import cv2

def compute_padding(size: int, patch_size: int = 256, stride: int = 192) -> tuple[int, int]:
    """Computes the target size and padding amount needed to cover a dimension with patches.

    Args:
        size: The original size of the dimension (height or width).
        patch_size: The size of each patch (default 256).
        stride: The step size between patches (default 192).

    Returns:
        A tuple of (target_size, padding_needed).
    """
    if size <= patch_size:
        return patch_size, patch_size - size
    
    rem = (size - patch_size) % stride
    if rem == 0:
        return size, 0
    
    pad = stride - rem
    return size + pad, pad

def pad_image(img: np.ndarray, patch_size: int = 256, stride: int = 192) -> tuple[np.ndarray, int, int]:
    """Pads the right and bottom of the image using reflect padding to fit patch dimensions.

    Args:
        img: The source image array, shape (H, W, 3).
        patch_size: Patch size.
        stride: Stride size.

    Returns:
        A tuple of (padded_image, pad_height, pad_width).
    """
    h, w = img.shape[:2]
    target_h, pad_h = compute_padding(h, patch_size, stride)
    target_w, pad_w = compute_padding(w, patch_size, stride)
    
    # Pad right and bottom to maintain pixel-perfect coordinates from the top-left origin
    padded_img = cv2.copyMakeBorder(
        img, 0, pad_h, 0, pad_w, cv2.BORDER_REFLECT_101
    )
    return padded_img, pad_h, pad_w

def get_hanning_window_2d(patch_size: int = 256) -> np.ndarray:
    """Generates a 2D Hanning window of shape (patch_size, patch_size, 1).

    Args:
        patch_size: Size of the 2D window.

    Returns:
        A float32 numpy array representing the 2D Hanning window.
    """
    w_1d = np.hanning(patch_size)
    w_2d = np.outer(w_1d, w_1d)
    return np.expand_dims(w_2d, axis=-1).astype(np.float32)

def bytes_to_image(image_bytes: bytes) -> np.ndarray:
    """Decodes raw image bytes into an RGB uint8 numpy array.

    Args:
        image_bytes: Raw bytes from a file upload.

    Returns:
        An RGB numpy array of shape (H, W, 3) and type uint8.
    """
    image = Image.open(io.BytesIO(image_bytes))
    if image.mode != "RGB":
        image = image.convert("RGB")
    return np.array(image, dtype=np.uint8)

def image_to_bytes(image_array: np.ndarray) -> bytes:
    """Encodes an RGB uint8 numpy array into PNG bytes.

    Args:
        image_array: An RGB numpy array of shape (H, W, 3).

    Returns:
        Raw bytes representing a PNG image.
    """
    image = Image.fromarray(image_array)
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format="PNG")
    return img_byte_arr.getvalue()
