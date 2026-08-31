# CPU-only Python base image
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps required by opencv / deepface (CPU only)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
  && rm -rf /var/lib/apt/lists/*

# Install Python deps first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
  && pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app ./app

# Pre-download/warm the exact model used by the application.
# This makes the DeepFace model available inside the built image
# instead of downloading it on the first production request.
RUN python -c "from deepface import DeepFace; DeepFace.build_model('Facenet512')"

# Expose FastAPI port
EXPOSE 8000

# Uvicorn command (no reload, suitable for container)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]