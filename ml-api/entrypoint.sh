#!/bin/bash
# Entrypoint script for CloverShield ML API
# Reads PORT from environment variable (required by Render)

PORT=${PORT:-8000}
HOST=${HOST:-0.0.0.0}

echo "🚀 Starting CloverShield ML API"
echo "📋 Configuration: HOST=$HOST, PORT=$PORT"
echo "⏳ Server will start, model will load on startup..."
echo "💡 Note: First request may take longer if model is still loading"

# Start uvicorn with the PORT from environment
# Use --log-level info for better visibility
exec uvicorn main:app --host "$HOST" --port "$PORT" --workers 1 --log-level info

