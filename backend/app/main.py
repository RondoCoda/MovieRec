"""FastAPI application entry point for MovieRec."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import movies, ratings, recommendations, system, users

app = FastAPI(
    title="MovieRec API",
    version="0.3.0",
    description=(
        "Backend API for the DSC5003 MovieRec project. "
        "Includes Genre-based Jaccard Similarity recommendations."
    ),
)

allowed_origins = [
    item.strip()
    for item in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,"
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if item.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "PUT", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(system.router, prefix="/api")
app.include_router(movies.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(ratings.router, prefix="/api")
app.include_router(recommendations.router, prefix="/api")


@app.get("/", tags=["system"], summary="API welcome")
def root() -> dict[str, str]:
    return {"message": "MovieRec API", "docs": "/docs", "health": "/api/health"}
