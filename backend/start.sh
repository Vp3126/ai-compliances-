#!/bin/bash
# Start script for Render deployment

# Run database migrations if needed (optional)
# python -m alembic upgrade head

# Start the FastAPI server with uvicorn
uvicorn main:app --host 0.0.0.0 --port $PORT
