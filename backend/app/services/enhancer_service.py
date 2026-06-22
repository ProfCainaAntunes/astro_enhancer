import gc
import logging
# pyrefly: ignore [missing-import]
import numpy as np
import tensorflow as tf
from app.services.model_loader import ModelLoader
from app.utils.image_processing import pad_image, get_hanning_window_2d

logger = logging.getLogger(__name__)

# Core patching constants
PATCH_SIZE = 256
OVERLAP = 32  # Reduced from 64 to save ~25% computation while keeping Hanning blending seamless
STRIDE = PATCH_SIZE - OVERLAP  # 224

# 1. Compiled Inference Function (Alterations 1 & 2)
# We compile the U-Net inference into a static computational graph.
# Using input_signature ensures it compiles only once for dynamic batch dimensions (None),
# avoiding recompilations on the final (partial) batch.
@tf.function(input_signature=[
    tf.TensorSpec(shape=(None, PATCH_SIZE, PATCH_SIZE, 3), dtype=tf.float32)
])
def compiled_infer(batch_tensor: tf.Tensor) -> tf.Tensor:
    """Traces and executes the U-Net model using a compiled TensorFlow static graph."""
    model = ModelLoader.get_model()
    return model(batch_tensor, training=False)

class EnhancerService:
    """Service to handle high-performance, low-memory patch-based image enhancement."""

    @classmethod
    def enhance_image(cls, img: np.ndarray, forced_batch_size: int = None) -> np.ndarray:
        """Enhances an RGB image of any resolution using optimized U-Net batch streaming.

        Args:
            img: Input RGB image as a uint8 numpy array, shape (H, W, 3).
            forced_batch_size: Optional manual batch size override. If None, uses adaptive batching.

        Returns:
            The enhanced RGB image as a uint8 numpy array, shape (H, W, 3).
        """
        h_orig, w_orig = img.shape[:2]
        logger.info(f"Starting optimized image enhancement. Resolution: {w_orig}x{h_orig}")

        # 2. Pad image (Alteration 8)
        # Pad image to multiples of patch size and stride upfront to process uniformly.
        padded_img, pad_h, pad_w = pad_image(img, PATCH_SIZE, STRIDE)
        h_pad, w_pad = padded_img.shape[:2]
        logger.info(f"Padded image resolution: {w_pad}x{h_pad} (pad bottom: {pad_h}px, pad right: {pad_w}px)")

        # 3. Pre-allocation of accumulators (Alteration 9 & 10)
        # All accumulators and windows are pre-allocated in strict float32 to prevent float64 promotion overhead.
        reconstructed = np.zeros((h_pad, w_pad, 3), dtype=np.float32)
        weight_sum = np.zeros((h_pad, w_pad, 1), dtype=np.float32)
        hanning_win = get_hanning_window_2d(PATCH_SIZE)  # Float32 Hanning window

        # 4. Compute sliding window coordinates
        coordinates = []
        for y in range(0, h_pad - PATCH_SIZE + 1, STRIDE):
            for x in range(0, w_pad - PATCH_SIZE + 1, STRIDE):
                coordinates.append((y, x))

        total_patches = len(coordinates)

        # 5. Adaptive Batching Selection (Alteration 4)
        # Select batch size dynamically to trade off RAM vs CPU utilization under Render Free constraints.
        if forced_batch_size is not None:
            batch_size = forced_batch_size
        else:
            if total_patches <= 50:
                batch_size = 32    # Small image: fast batch to saturate cores
            elif total_patches <= 200:
                batch_size = 16    # Medium image
            else:
                batch_size = 8     # Large image (e.g. 4K+): small batch to prevent out-of-memory spikes
        
        logger.info(f"Total patches to process: {total_patches}. Selected BATCH_SIZE: {batch_size}")

        # 6. Stream Pipeline with Parallel Prefetching (Alterations 5, 6 & 12)
        # Define the generator that yields single patches. It does not hold the entire dataset in memory.
        def patch_generator():
            for y, x in coordinates:
                # Extract crop and scale to [0.0, 1.0] float32 immediately
                patch = padded_img[y:y+PATCH_SIZE, x:x+PATCH_SIZE, :].astype(np.float32) / 255.0
                yield patch, np.array([y, x], dtype=np.int32)

        # Wrap generator in a tf.data.Dataset for high-performance streaming
        dataset = tf.data.Dataset.from_generator(
            patch_generator,
            output_signature=(
                tf.TensorSpec(shape=(PATCH_SIZE, PATCH_SIZE, 3), dtype=tf.float32),
                tf.TensorSpec(shape=(2,), dtype=tf.int32)
            )
        )
        
        # Batch and prefetch. While batch N is being processed on CPU, the background prefetch
        # thread extracts and normalizes batch N+1 in parallel, hiding CPU/Memory latency.
        dataset = dataset.batch(batch_size).prefetch(tf.data.AUTOTUNE)

        # 7. Process batch by batch
        num_batches = -(-total_patches // batch_size)
        for batch_idx, (batch_patches, batch_coords) in enumerate(dataset):
            # Run compiled inference using static graph
            pred_patches = compiled_infer(batch_patches)

            # Convert tensors back to numpy for reconstruction
            pred_patches_np = pred_patches.numpy()
            coords_np = batch_coords.numpy()

            # Reconstruction immediate update (Alteration 5)
            for i in range(len(coords_np)):
                y, x = coords_np[i]
                reconstructed[y:y+PATCH_SIZE, x:x+PATCH_SIZE, :] += pred_patches_np[i] * hanning_win
                weight_sum[y:y+PATCH_SIZE, x:x+PATCH_SIZE, :] += hanning_win

            # 8. Explicit memory cleanup (Alteration 11)
            del batch_patches
            del batch_coords
            del pred_patches
            del pred_patches_np
            del coords_np

            # On large images (e.g. batch size 8), garbage collect periodically to prevent RAM inflation
            if batch_size == 8 and batch_idx % 10 == 0:
                gc.collect()

            if batch_idx % 5 == 0 or batch_idx == (num_batches - 1):
                logger.info(f"Processed batch {batch_idx + 1}/{num_batches}")

        # 9. Blend overlapping regions and clip
        # Add epsilon to prevent division by zero in case of unreached pixels
        blended_image = reconstructed / (weight_sum + 1e-5)
        blended_image = np.clip(blended_image, 0.0, 1.0) * 255.0
        final_padded = blended_image.astype(np.uint8)

        # 10. Crop back to original dimensions
        final_img = final_padded[0:h_orig, 0:w_orig, :]

        # 11. Final cleanup
        del reconstructed
        del weight_sum
        del padded_img
        del final_padded
        del blended_image
        gc.collect()

        logger.info("Optimized U-Net image enhancement completed successfully.")
        return final_img
