# Night Vision AI ✨

**Deep Learning Image Enhancement for Astrophotography**  
*UNESP Master's Dissertation Demonstration*

This repository contains the complete source code for a web application designed to demonstrate a **U-Net** deep learning model trained to automatically restore and enhance low-light, noisy astrophotography and deep-space images.

---

## Key Technical Features

### 💻 Frontend (React + Vite + TypeScript + Tailwind CSS)
- **Glassmorphic Celestial Interface**: Premium dark-mode UI styled specifically around space aesthetics.
- **Fixed Separation Comparison Slider**: Vertical split bar with a custom handle comparing the original and enhanced images side-by-side.
- **Synchronized Viewport Zoom & Pan**: Wheel-to-zoom and click-to-drag panning keeping both layers aligned for fine-detail analysis.
- **Adaptive Loading & Errors**: Visual celestial orbit loaders and error handlers.

### ⚙️ Backend (Python + FastAPI)
- **Singleton Model Loader**: Pre-loads the TensorFlow `.keras` model once on startup and keeps it in memory.
- **Patched Sliding-Window Generator**: Processes arbitrary resolution uploads (e.g. 4K, 8K) in $256 \times 256$ chunks to stay within low-memory bounds.
- **2D Hanning Blending**: Synthesizes overlapping patches using a 2D Hanning window to eliminate visible seams or stitching artifacts.
- **Non-blocking Event Loop**: Offloads heavy inference calculations to background worker threads using FastAPI's `run_in_threadpool`.
- **Stateless & In-Memory**: Zero disk footprint. Decodes, processes, and encodes entirely inside RAM.

---

## Project Structure

```
astro_enhancer/
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI Workflow Configuration
├── backend/
│   ├── app/
│   │   ├── controllers/       # API router and endpoints (multipart uploads)
│   │   ├── services/          # ModelLoader singleton and EnhancerService core logic
│   │   ├── utils/             # Image cropping, padding, and blending helpers
│   │   └── main.py            # FastAPI entry point
│   ├── model/
│   │   └── modelo.keras       # U-Net weights model (auto-generated if missing)
│   ├── tests/
│   │   └── test_enhancer.py   # Pytest suite for backend validation
│   ├── Dockerfile
│   ├── .dockerignore
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/        # UploadZone and ImageCompareSlider
    │   ├── hooks/             # useImageEnhancer state hook
    │   ├── services/          # API communication client
    │   ├── styles/            # Tailwind base + custom starfield and glows
    │   ├── App.tsx            # Main layout controller
    │   └── main.tsx
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.ts
```

---

## Local Development Setup

### 1. Running the Backend
Ensure you have Python 3.10+ installed.

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -3.12 -m venv venv
   # On Windows:
   venv\Scripts\Activate.ps1
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```
4. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
    *Note: If `model/modelo.keras` is missing, the system will automatically generate a dummy U-Net architecture model on startup to ensure the server is immediately runnable.*

### 1.1 GPU-Accelerated Backend Setup (WSL2 with NVIDIA CUDA)
If you have an NVIDIA GPU (e.g. GeForce RTX) and want to accelerate U-Net inference on Windows, you must run the backend inside **WSL2 (Windows Subsystem for Linux)**, as native Windows GPU support was dropped in TensorFlow >= 2.11.

1. **Install WSL2**: Open administrative PowerShell and run `wsl --install`. Restart your PC when prompted.
2. **Copy the project to Linux Home**: For optimal file access performance, copy the project source code to your Ubuntu home folder (avoid running virtual environments directly inside `/mnt/c/` mounts):
   ```bash
   sudo apt update && sudo apt install -y rsync
   mkdir -p ~/projects
   rsync -av --exclude='venv' --exclude='.venv' --exclude='node_modules' --exclude='modelo.keras' --exclude='dist' /mnt/c/Projects/astro_enhancer/ ~/projects/astro_enhancer/
   cd ~/projects/astro_enhancer/backend
   ```
3. **Install Python 3.10**: On Ubuntu 24.04 default (which uses Python 3.12), add the DeadSnakes repository to install Python 3.10 (fully compatible with TensorFlow CUDA packages):
   ```bash
   sudo add-apt-repository ppa:deadsnakes/ppa -y
   sudo apt update
   sudo apt install -y python3.10 python3.10-venv python3.10-dev
   ```
4. **Create Virtual Environment**:
   ```bash
   python3.10 -m venv venv
   source venv/bin/activate
   pip install --upgrade pip
   pip install -r requirements.txt
   pip install tensorflow[and-cuda]
   ```
5. **Configure GPU Library Path**: To ensure WSL2 driver mounts and the virtual environment's pip-installed CUDA packages are correctly loaded, append the library lookup configurations to your `venv/bin/activate` script:
   ```bash
   SITE_PACKAGES=$(python3 -c "import site; print(site.getsitepackages()[0])")
   echo 'SITE_PACKAGES=$(python3 -c "import site; print(site.getsitepackages()[0])")' >> venv/bin/activate
   echo 'CUDA_LIBS=$(find $SITE_PACKAGES/nvidia/ -type d -name "lib" | paste -sd ":" -)' >> venv/bin/activate
   echo 'export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/usr/lib/wsl/lib/:$CUDA_LIBS' >> venv/bin/activate
   
   # Re-activate to load changes
   source venv/bin/activate
   ```
6. **Verify GPU Detection**:
   ```bash
   python3 -c "import tensorflow as tf; print('\n>>> GPU DETECTADA:', tf.config.list_physical_devices('GPU'))"
   ```
7. **Run the Backend server**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
8. **Run the Frontend (Host Windows)**: Run the React app natively on Windows (`npm run dev` inside `C:\Projects\astro_enhancer\frontend`). WSL2 automatically bridges network ports, allowing your Windows browser to access the backend at `http://localhost:8000` seamlessly.

### 2. Running the Frontend
Ensure you have Node.js (v18+) and npm installed.

1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the address shown (usually `http://localhost:3000`).

---

## Docker Execution (Production)

You can containerize the backend for deployment (e.g., to Render).

1. Build the Docker image from the `backend/` directory:
   ```bash
   cd backend
   docker build -t astro-enhancer-backend .
   ```
2. Run the container:
   ```bash
   docker run -p 8000:8000 -e PORT=8000 astro-enhancer-backend
   ```

---

## Continuous Integration (GitHub Actions)

A CI workflow configuration is set up under `.github/workflows/ci.yml`. On every push and pull request, it runs:
- **Frontend validation**: Installs dependencies, runs ESLint check, and builds the static assets.
- **Backend validation**: Installs dependencies, executes unit tests via `pytest`, and validates that the `Dockerfile` builds successfully.

---

## Deployment Guidelines

### Frontend to Vercel
1. Install the Vercel CLI or import the project through the Vercel Dashboard.
2. Link the repository, selecting the `frontend` folder as the root directory.
3. Configure the **Build Command** to `npm run build` and the **Output Directory** to `dist`.
4. Configure redirects (Rewrite) from `/api/:path*` to your Render backend endpoint to prevent CORS.

### Backend to Render
1. Create a new **Web Service** on Render.
2. Select your repository and specify the environment as **Docker**.
3. Set the directory path to `backend/`.
4. Render will automatically build the `Dockerfile` and expose it. Set the port to `8000` (or let Render bind it automatically).
