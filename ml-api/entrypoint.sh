#!/bin/bash
# Entrypoint script for CloverShield ML API
# Reads PORT from environment variable (required by Render)

PORT=${PORT:-8000}
HOST=${HOST:-0.0.0.0}

echo "🚀 Starting CloverShield ML API"
echo "📋 Configuration: HOST=$HOST, PORT=$PORT"
echo "⏳ Server will start, model will load in background..."

# Start uvicorn with the PORT from environment
exec uvicorn main:app --host "$HOST" --port "$PORT" --workers 1

