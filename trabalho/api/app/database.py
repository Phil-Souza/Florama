from collections.abc import Generator

import psycopg
from fastapi import HTTPException
from psycopg.rows import dict_row

from .config import DATABASE_URL


def get_db() -> Generator[psycopg.Connection, None, None]:
    if not DATABASE_URL:
        raise HTTPException(status_code=503, detail="Configure DATABASE_URL no arquivo api/.env.")

    try:
        connection = psycopg.connect(DATABASE_URL, row_factory=dict_row)
    except psycopg.OperationalError as exc:
        raise HTTPException(status_code=503, detail="Não foi possível conectar ao PostgreSQL.") from exc

    try:
        yield connection
    finally:
        connection.close()