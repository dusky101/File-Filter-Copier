"""
File Filter Copier - FastAPI Backend
Main application entry point for the FastAPI server.
Designed to work both in development and when frozen with PyInstaller.
"""

import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Ensure backend package is importable (use real path when frozen as well)
backend_dir = Path(__file__).parent.resolve()
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from api.routes import router  # noqa: E402


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("=" * 60, flush=True)
    print("🚀 File Filter Copier API Starting...", flush=True)
    print("=" * 60, flush=True)
    print(f"📁 Backend Directory: {backend_dir}", flush=True)
    print(f"📖 API Documentation: http://127.0.0.1:8000/docs", flush=True)
    print(f"🔍 Health Check: http://127.0.0.1:8000/api/health", flush=True)
    print("=" * 60, flush=True)
    yield
    # Shutdown
    print("\n" + "=" * 60, flush=True)
    print("🛑 File Filter Copier API Shutting Down...", flush=True)
    print("=" * 60, flush=True)


app = FastAPI(
    title="File Filter Copier API",
    description="Backend API for File Filter Copier - A semantic file filtering and copying tool",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS for Electron/Vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(router, prefix="/api", tags=["File Operations"])


@app.get("/")
async def root():
    return {
        "message": "File Filter Copier API",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/api/health",
    }


def run():
    # Prefer FFC_PORT, then PORT, default 8000
    port = int(os.getenv("FFC_PORT") or os.getenv("PORT", "8000"))
    # Never use reload in frozen builds
    reload_flag = os.getenv("FLC_RELOAD", "0") == "1" and not getattr(sys, "frozen", False)

    # IMPORTANT: pass the app object (not "main:app") so PyInstaller builds work
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=port,
        reload=reload_flag,
        log_level="info",
    )


if __name__ == "__main__":
    run()