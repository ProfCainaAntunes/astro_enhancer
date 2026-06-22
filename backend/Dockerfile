# Use an official lightweight Python slim image
FROM python:3.10-slim

# Set environment variables to optimize Python execution in container
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# Set the working directory inside the container
WORKDIR /app

# Copy only requirements first to leverage Docker layer caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend files (app code and model directory)
COPY app/ ./app/
COPY model/ ./model/

# Expose port (Render/Docker default)
EXPOSE 8000

# Start Uvicorn, binding to 0.0.0.0 and dynamically mapping to PORT (useful for Render)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
