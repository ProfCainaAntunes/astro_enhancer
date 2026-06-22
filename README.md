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
