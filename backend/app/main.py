import logging
from contextlib import asynccontextmanager
# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from app.controllers.enhance_controller import router as enhance_router
from app.services.model_loader import ModelLoader

# Configure logging format and level
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load the model once globally
    logger.info("Initializing U-Net model...")
    try:
        # Trigger model load
        ModelLoader.get_model()
        logger.info("Model pre-loaded successfully on startup.")
    except Exception as e:
        logger.critical(f"Failed to pre-load model on startup: {e}", exc_info=True)
    
    yield
    
    # Shutdown: Clean up resources if necessary
    logger.info("Shutting down application...")

# Initialize FastAPI with metadata and lifespan event handler
app = FastAPI(
    title="Night Vision AI Backend",
    description="Deep Learning Image Enhancement API for Astrophotography (UNESP Master's Dissertation Demonstration)",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for communication with React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For demo purposes, we allow all origins.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register controllers
app.include_router(enhance_router)

@app.get("/health")
def health_check():
    """Health check endpoint to verify backend status."""
    return {"status": "ok", "message": "Night Vision AI Backend is online."}

if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    # When executed directly, run using Uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
