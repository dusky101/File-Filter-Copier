"""
File Filter Copier - FastAPI Backend
Main application entry point for the FastAPI server
"""

import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Add backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from api.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan event handler for startup and shutdown actions.
    This replaces the deprecated @app.on_event decorators.
    """
    # Startup
    print("=" * 60)
    print("🚀 File Filter Copier API Starting...")
    print("=" * 60)
    print(f"📁 Backend Directory: {backend_dir}")
    print(f"📖 API Documentation: http://localhost:8000/docs")
    print(f"🔍 Health Check: http://localhost:8000/api/health")
    print("=" * 60)
    
    yield  # Server is running
    
    # Shutdown
    print("\n" + "=" * 60)
    print("🛑 File Filter Copier API Shutting Down...")
    print("=" * 60)


# Initialize FastAPI app with lifespan handler
app = FastAPI(
    title="File Filter Copier API",
    description="Backend API for File Filter Copier - A semantic file filtering and copying tool",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan  # New lifespan handler
)

# Configure CORS for Electron app
# This allows the React frontend to communicate with the FastAPI backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:5174",  # Alternative port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Include API routes
app.include_router(router, prefix="/api", tags=["File Operations"])


@app.get("/")
async def root():
    """
    Root endpoint - provides basic API information
    """
    return {
        "message": "File Filter Copier API",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }


if __name__ == "__main__":
    """
    Run the FastAPI server with Uvicorn
    """
    port = int(os.getenv("PORT", "8000"))
    # Disable reload when frozen/packaged; allow enabling in dev via env
    reload_flag = os.getenv("FLC_RELOAD", "0") == "1" and not getattr(sys, "frozen", False)
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=reload_flag,
        log_level="info"
    )