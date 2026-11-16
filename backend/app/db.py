"""Database connection and small query helpers for PostgreSQL."""

import os
from collections.abc import Generator, Sequence
from typing import Any

import psycopg2
from fastapi import HTTPException
from psycopg2.extras import RealDictCursor
from psycopg2.extensions import connection


def open_connection() -> connection:
    """Open a PostgreSQL connection using the project's standard PG* variables."""
    options: dict[str, Any] = {
        "dbname": os.getenv("PGDATABASE", "movierec_dev"),
        "host": os.getenv("PGHOST", "localhost"),
        "port": os.getenv("PGPORT", "5432"),
        "connect_timeout": int(os.getenv("PGCONNECT_TIMEOUT", "5")),
    }
    if os.getenv("PGUSER"):
        options["user"] = os.environ["PGUSER"]
    if os.getenv("PGPASSWORD"):
        options["password"] = os.environ["PGPASSWORD"]
    return psycopg2.connect(**options)


def get_db() -> Generator[connection, None, None]:
    """Provide one connection per request and always close it afterwards."""
    try:
        conn = open_connection()
    except psycopg2.OperationalError as exc:
        # Do not expose hostnames, usernames, or passwords in the API response.
        raise HTTPException(
            status_code=503,
            detail="Database is unavailable. Check PostgreSQL and PG* connection settings.",
        ) from exc

    try:
        yield conn
    finally:
        conn.close()


def fetch_all(
    conn: connection, sql: str, params: Sequence[Any] = ()
) -> list[dict[str, Any]]:
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(sql, tuple(params))
        return [dict(row) for row in cur.fetchall()]


def fetch_one(
    conn: connection, sql: str, params: Sequence[Any] = ()
) -> dict[str, Any] | None:
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(sql, tuple(params))
        row = cur.fetchone()
        return dict(row) if row is not None else None
