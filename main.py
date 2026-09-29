"""AgriCare API entry point.

Run from the repository root:
    uvicorn backend.api.main:app --reload
"""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database.connection import init_db

from .routes import auth, data, upload


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()   # create tables if missing
    yield

app = FastAPI(title="AgriCare API", version="0.1.0", lifespan=lifespan)

# Comma-separated list, e.g. CORS_ORIGINS="http://localhost:5500,https://agricare.example"
origins = os.getenv("CORS_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(data.router)
app.include_router(upload.router)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}
