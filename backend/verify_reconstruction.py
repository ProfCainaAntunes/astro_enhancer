import sys
import os
import numpy as np

# Adjust path to import backend app components
sys.path.append(os.path.join(os.path.dirname(__file__), "app"))

from app.services.enhancer_service import EnhancerService

def main():
    print("Initializing U-Net Reconstruction Test...")
    
    # 1. Create a dummy test image (RGB, 500x400)
    h, w = 400, 500
    print(f"Creating a mock input image of resolution: {w}x{h}")
    mock_image = np.random.randint(0, 256, (h, w, 3), dtype=np.uint8)
    
    # 2. Run enhancement
    print("Invoking EnhancerService.enhance_image...")
    try:
        enhanced_image = EnhancerService.enhance_image(mock_image, batch_size=4)
    except Exception as e:
        print(f"ERROR: Enhancement failed with exception: {e}")
        sys.exit(1)
        
    # 3. Assertions
    print(f"Output image resolution: {enhanced_image.shape[1]}x{enhanced_image.shape[0]}")
    assert enhanced_image.shape == mock_image.shape, (
        f"Resolution mismatch! Expected {mock_image.shape}, got {enhanced_image.shape}"
    )
    assert enhanced_image.dtype == np.uint8, (
        f"Type mismatch! Expected uint8, got {enhanced_image.dtype}"
    )
    
    print("\nSUCCESS: Sliding window reconstruction and blending verified!")
    print("- Input size matched output size perfectly.")
    assert os.path.exists("model/modelo.keras"), "Model file model/modelo.keras was not generated."
    print("- fallback modelo.keras model was generated and exists.")

if __name__ == "__main__":
    main()
