# CloverShield ML Inference API Dockerfile
# Optimized for Python 3.9

FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better Docker layer caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy application code
COPY . .

# Create directory for model (if not exists)
RUN mkdir -p Models

# Copy model file (if available)
# Note: In production, you may want to download from cloud storage
# COPY Models/fraud_pipeline_final.pkl Models/

# Copy and set up entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose port (Render will assign PORT dynamically)
EXPOSE 8000

# Health check (uses PORT env var, defaults to 8000)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import os, urllib.request; port=os.getenv('PORT', '8000'); urllib.request.urlopen(f'http://localhost:{port}/health')" || exit 1

# Run the application using entrypoint script
# This ensures PORT environment variable is properly read
ENTRYPOINT ["/entrypoint.sh"]

