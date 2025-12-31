# CloverShield ML Inference API Dockerfile
# Optimized for Python 3.9 and Hugging Face Spaces

FROM python:3.9-slim

# Create a non-root user (user 1000) to comply with HF security context
RUN useradd -m -u 1000 user

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_DEFAULT_TIMEOUT=100 \
    MAX_FIT_ROWS=10000 \
    HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    gfortran \
    libopenblas-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better Docker layer caching)
COPY requirements.txt .

# Install Python dependencies as the non-root user
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --prefer-binary -r requirements.txt

# Copy application code
COPY --chown=user . .

# Create directory for model (if not exists) and ensure permissions
RUN mkdir -p Models && chown -R user:user /app

# Copy and set up entrypoint script
COPY --chown=user entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Switch to the non-root user
USER user

# Expose port 7860 (Hugging Face Spaces standard)
EXPOSE 7860

# Health check (uses PORT env var, defaults to 7860)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import os, urllib.request; port=os.getenv('PORT', '7860'); urllib.request.urlopen(f'http://localhost:{port}/health')" || exit 1

# Run the application using entrypoint script
ENTRYPOINT ["/entrypoint.sh"]

