import sys
import os
import numpy as np

# Adjust path to make sure the app directory is importable
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.utils.image_processing import compute_padding, pad_image, get_hanning_window_2d
from app.services.enhancer_service import EnhancerService

def test_compute_padding():
    """Verifies that the padding calculator yields correct target dimensions."""
    # Size smaller than patch size
    target, pad = compute_padding(200, patch_size=256, stride=192)
    assert target == 256
    assert pad == 56

    # Size exactly patch size
    target, pad = compute_padding(256, patch_size=256, stride=192)
    assert target == 256
    assert pad == 0

    # Size larger than patch size (requires padding to next stride multiple)
    target, pad = compute_padding(300, patch_size=256, stride=192)
    assert target == 448  # 256 + 192
    assert pad == 148

def test_hanning_window():
    """Ensures 2D Hanning window is generated with correct shape and types."""
    win = get_hanning_window_2d(256)
    assert win.shape == (256, 256, 1)
    assert win.dtype == np.float32
    assert win.min() >= 0.0
    assert win.max() <= 1.0

def test_enhancement_pipeline():
    """Verifies end-to-end sliding window reconstruction on a mock image."""
    h, w = 120, 180
    img = np.random.randint(0, 256, (h, w, 3), dtype=np.uint8)
    enhanced = EnhancerService.enhance_image(img, batch_size=4)
    
    assert enhanced.shape == img.shape, f"Expected {img.shape}, got {enhanced.shape}"
    assert enhanced.dtype == np.uint8, f"Expected uint8, got {enhanced.dtype}"
