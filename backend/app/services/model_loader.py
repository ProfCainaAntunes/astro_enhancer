import os
import logging
import tensorflow as tf

logger = logging.getLogger(__name__)

class ModelLoader:
    """Singleton class to load and access the TensorFlow Keras model."""
    _instance = None
    _model = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(ModelLoader, cls).__new__(cls, *args, **kwargs)
        return cls._instance

    @classmethod
    def get_model(cls) -> tf.keras.Model:
        """Returns the loaded Keras model, initializing it if necessary."""
        if cls._model is None:
            cls._model = cls._load_model()
        return cls._model

    @classmethod
    def _load_model(cls) -> tf.keras.Model:
        model_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "model"))
        model_path = os.path.join(model_dir, "modelo.keras")
        
        # Ensure directory exists
        os.makedirs(model_dir, exist_ok=True)
        
        if not os.path.exists(model_path):
            logger.warning(f"Model file not found at {model_path}. Generating a dummy U-Net model for demonstration...")
            cls._generate_dummy_model(model_path)
            
        logger.info(f"Loading model from {model_path}...")
        try:
            # We load the model, compiling is False since we only need inference
            model = tf.keras.models.load_model(model_path, compile=False)
            logger.info("Model loaded successfully.")
            return model
        except Exception as e:
            logger.error(f"Failed to load model from {model_path}: {e}")
            raise e

    @classmethod
    def _generate_dummy_model(cls, filepath: str) -> None:
        """Creates and saves a dummy U-Net architecture to act as a fallback model."""
        from tensorflow.keras import layers, Model
        
        inputs = layers.Input(shape=(256, 256, 3))
        
        # Encoder (downsampling)
        c1 = layers.Conv2D(16, (3, 3), activation='relu', padding='same')(inputs)
        p1 = layers.MaxPooling2D((2, 2))(c1)
        
        c2 = layers.Conv2D(32, (3, 3), activation='relu', padding='same')(p1)
        p2 = layers.MaxPooling2D((2, 2))(c2)
        
        # Bottleneck
        c3 = layers.Conv2D(64, (3, 3), activation='relu', padding='same')(p2)
        
        # Decoder (upsampling)
        u2 = layers.Conv2DTranspose(32, (2, 2), strides=(2, 2), padding='same')(c3)
        concat2 = layers.concatenate([u2, c2])
        c4 = layers.Conv2D(32, (3, 3), activation='relu', padding='same')(concat2)
        
        u1 = layers.Conv2DTranspose(16, (2, 2), strides=(2, 2), padding='same')(c4)
        concat1 = layers.concatenate([u1, c1])
        c5 = layers.Conv2D(16, (3, 3), activation='relu', padding='same')(concat1)
        
        # Output layer - outputting normalized float32 in [0, 1] range (sigmoid)
        # We can implement a slight brightness and contrast enhancement as the dummy operation
        # but the model's weights will start random. That's fine for a mock/demonstration!
        outputs = layers.Conv2D(3, (1, 1), activation='sigmoid')(c5)
        
        model = Model(inputs=[inputs], outputs=[outputs])
        model.save(filepath)
        logger.info(f"Dummy model generated and saved to {filepath}")
