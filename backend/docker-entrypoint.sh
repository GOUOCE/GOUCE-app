#!/bin/sh
set -e

echo "Running database migrations via Alembic..."
alembic upgrade head

echo "Starting FastAPI server..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 "$@"
