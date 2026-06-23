import sqlite3
from contextlib import contextmanager

from app.storage.paths import sqlite_path

SCHEMA = """
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    pages INTEGER NOT NULL DEFAULT 0,
    size_mb REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing',
    uploaded_at TEXT NOT NULL,
    thumbnail_color TEXT NOT NULL,
    file_path TEXT NOT NULL,
    error_message TEXT
);
"""


@contextmanager
def get_connection():
    conn = sqlite3.connect(str(sqlite_path()), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with get_connection() as conn:
        conn.execute(SCHEMA)
