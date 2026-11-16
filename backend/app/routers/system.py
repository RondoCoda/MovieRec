"""System and health-check endpoints."""

from fastapi import APIRouter, Depends
from psycopg2.extensions import connection

from app.db import get_db

router = APIRouter(tags=["system"])


@router.get("/health", summary="Check API and database availability")
def health(db: connection = Depends(get_db)) -> dict[str, str]:
    with db.cursor() as cur:
        cur.execute("SELECT 1")
        cur.fetchone()
    return {"status": "ok", "database": "connected"}
